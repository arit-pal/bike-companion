package service

import (
	"context"
	"fmt"
	"time"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
	"github.com/arit-pal/bike-companion/engine/internal/repository"
	"github.com/arit-pal/bike-companion/engine/pkg/constants"
	"github.com/arit-pal/bike-companion/engine/pkg/database"
	"github.com/google/uuid"
)

// RecordService defines business operations for service records.
type RecordService interface {
	LogForUser(ctx context.Context, bikeID, userID string, rec *domain.ServiceRecord) (*domain.ServiceRecord, error)
	ListForUser(ctx context.Context, bikeID, userID, intervalID string, limit, offset int) ([]*domain.ServiceRecord, error)
}

type recordService struct {
	pool         *database.Pool
	repo         repository.RecordRepository
	intervalRepo repository.IntervalRepository
	bikeRepo     repository.BikeRepository
}

var _ RecordService = (*recordService)(nil)

func NewRecordService(pool *database.Pool, repo repository.RecordRepository, intervalRepo repository.IntervalRepository, bikeRepo repository.BikeRepository) RecordService {
	return &recordService{pool: pool, repo: repo, intervalRepo: intervalRepo, bikeRepo: bikeRepo}
}

func (s *recordService) requireOwnership(ctx context.Context, bikeID, userID string) error {
	bike, err := s.bikeRepo.GetByID(ctx, bikeID)
	if err != nil {
		return err
	}
	if bike.UserID == nil || *bike.UserID != userID {
		return fmt.Errorf("forbidden: bike does not belong to user")
	}
	return nil
}

func (s *recordService) LogForUser(ctx context.Context, bikeID, userID string, rec *domain.ServiceRecord) (*domain.ServiceRecord, error) {
	if err := s.requireOwnership(ctx, bikeID, userID); err != nil {
		return nil, err
	}
	if rec.MileageAtService < 0 {
		return nil, domain.ErrRecordInvalid
	}
	if rec.DatePerformed.IsZero() || rec.DatePerformed.After(time.Now().Add(24*time.Hour)) {
		return nil, domain.ErrRecordInvalid
	}
	if rec.Cost != nil && *rec.Cost < 0 {
		return nil, domain.ErrRecordInvalid
	}
	if rec.ServiceIntervalID != nil {
		iv, err := s.intervalRepo.GetByID(ctx, *rec.ServiceIntervalID)
		if err != nil {
			return nil, domain.ErrRecordInvalid
		}
		if iv.BikeID != bikeID {
			return nil, domain.ErrRecordInvalid
		}
	}

	rec.BikeID = bikeID
	if rec.ID == "" {
		rec.ID = uuid.NewString()
	}

	// Transaction: insert record → reset linked interval → roll odo forward.
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := tx.QueryRow(ctx, `
		INSERT INTO service_records (id, bike_id, service_interval_id, date_performed, mileage_at_service, cost, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at`,
		rec.ID, rec.BikeID, rec.ServiceIntervalID, rec.DatePerformed, rec.MileageAtService, rec.Cost, rec.Notes,
	).Scan(&rec.CreatedAt); err != nil {
		return nil, fmt.Errorf("create record: %w", err)
	}

	if rec.ServiceIntervalID != nil {
		if _, err := tx.Exec(ctx, `
			UPDATE service_intervals
			SET last_done_mileage = $2, last_done_date = $3::date, updated_at = now()
			WHERE id = $1`, *rec.ServiceIntervalID, rec.MileageAtService, rec.DatePerformed.Format("2006-01-02")); err != nil {
			return nil, fmt.Errorf("reset interval: %w", err)
		}
	}

	if _, err := tx.Exec(ctx, `
		UPDATE bikes SET current_mileage = GREATEST(current_mileage, $2), updated_at = now()
		WHERE id = $1`, bikeID, rec.MileageAtService); err != nil {
		return nil, fmt.Errorf("roll odo forward: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit: %w", err)
	}
	return rec, nil
}

func (s *recordService) ListForUser(ctx context.Context, bikeID, userID, intervalID string, limit, offset int) ([]*domain.ServiceRecord, error) {
	if err := s.requireOwnership(ctx, bikeID, userID); err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = constants.DefaultPageSize
	}
	if limit > constants.MaxPageSize {
		limit = constants.MaxPageSize
	}
	if offset < 0 {
		offset = 0
	}
	if intervalID != "" {
		iv, err := s.intervalRepo.GetByID(ctx, intervalID)
		if err != nil || iv.BikeID != bikeID {
			return nil, domain.ErrRecordInvalid
		}
	}
	return s.repo.ListByBikeID(ctx, bikeID, intervalID, limit, offset)
}
