package service

import (
	"context"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
	"github.com/arit-pal/bike-companion/engine/internal/repository"
)

// RecordService defines business operations for service records.
type RecordService interface {
	Log(ctx context.Context, rec *domain.ServiceRecord) (*domain.ServiceRecord, error)
	ListByBikeID(ctx context.Context, bikeID string) ([]*domain.ServiceRecord, error)
}

type recordService struct {
	repo         repository.RecordRepository
	intervalRepo repository.IntervalRepository
}

var _ RecordService = (*recordService)(nil)

func NewRecordService(repo repository.RecordRepository, intervalRepo repository.IntervalRepository) RecordService {
	return &recordService{repo: repo, intervalRepo: intervalRepo}
}

func (s *recordService) Log(ctx context.Context, rec *domain.ServiceRecord) (*domain.ServiceRecord, error) {
	if rec.MileageAtService < 0 {
		return nil, domain.ErrRecordInvalid
	}
	if err := s.repo.Create(ctx, rec); err != nil {
		return nil, err
	}
	// If linked to an interval, update last-done mileage/date.
	if rec.ServiceIntervalID != nil {
		_ = s.intervalRepo.UpdateLastDone(ctx, *rec.ServiceIntervalID, rec.MileageAtService)
	}
	return rec, nil
}

func (s *recordService) ListByBikeID(ctx context.Context, bikeID string) ([]*domain.ServiceRecord, error) {
	return s.repo.ListByBikeID(ctx, bikeID)
}
