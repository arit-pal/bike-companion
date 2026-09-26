package repository

import (
	"context"
	"fmt"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
	"github.com/arit-pal/bike-companion/engine/pkg/database"
	"github.com/google/uuid"
)

// RecordRepository defines persistence for service records.
type RecordRepository interface {
	Create(ctx context.Context, rec *domain.ServiceRecord) error
	ListByBikeID(ctx context.Context, bikeID, intervalID string, limit, offset int) ([]*domain.ServiceRecord, error)
}

// PostgresRecordRepository is the Postgres implementation.
type PostgresRecordRepository struct {
	pool *database.Pool
}

var _ RecordRepository = (*PostgresRecordRepository)(nil)

func NewPostgresRecordRepository(pool *database.Pool) *PostgresRecordRepository {
	return &PostgresRecordRepository{pool: pool}
}

func (r *PostgresRecordRepository) Create(ctx context.Context, rec *domain.ServiceRecord) error {
	if rec.ID == "" {
		rec.ID = uuid.NewString()
	}
	query := `
		INSERT INTO service_records (id, bike_id, service_interval_id, date_performed, mileage_at_service, cost, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at`
	if err := r.pool.QueryRow(ctx, query,
		rec.ID, rec.BikeID, rec.ServiceIntervalID, rec.DatePerformed, rec.MileageAtService, rec.Cost, rec.Notes,
	).Scan(&rec.CreatedAt); err != nil {
		return fmt.Errorf("create record: %w", err)
	}
	return nil
}

func (r *PostgresRecordRepository) ListByBikeID(ctx context.Context, bikeID, intervalID string, limit, offset int) ([]*domain.ServiceRecord, error) {
	query := `
		SELECT id, bike_id, service_interval_id, date_performed, mileage_at_service, cost, notes, created_at
		FROM service_records WHERE bike_id = $1`
	args := []any{bikeID}
	if intervalID != "" {
		args = append(args, intervalID)
		query += fmt.Sprintf(` AND service_interval_id = $%d`, len(args))
	}
	args = append(args, limit, offset)
	query += fmt.Sprintf(` ORDER BY date_performed DESC, created_at DESC LIMIT $%d OFFSET $%d`, len(args)-1, len(args))

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list records: %w", err)
	}
	defer rows.Close()
	out := make([]*domain.ServiceRecord, 0)
	for rows.Next() {
		rec := &domain.ServiceRecord{}
		if err := rows.Scan(
			&rec.ID, &rec.BikeID, &rec.ServiceIntervalID, &rec.DatePerformed,
			&rec.MileageAtService, &rec.Cost, &rec.Notes, &rec.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, rec)
	}
	return out, rows.Err()
}
