package repository

import (
	"context"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
)

// RecordRepository defines persistence for service records.
type RecordRepository interface {
	Create(ctx context.Context, rec *domain.ServiceRecord) error
	ListByBikeID(ctx context.Context, bikeID string) ([]*domain.ServiceRecord, error)
}

// PostgresRecordRepository is the Postgres implementation.
type PostgresRecordRepository struct{}

var _ RecordRepository = (*PostgresRecordRepository)(nil)

func NewPostgresRecordRepository() *PostgresRecordRepository {
	return &PostgresRecordRepository{}
}

func (r *PostgresRecordRepository) Create(_ context.Context, _ *domain.ServiceRecord) error {
	return nil // TODO: INSERT INTO service_records ...
}

func (r *PostgresRecordRepository) ListByBikeID(_ context.Context, _ string) ([]*domain.ServiceRecord, error) {
	return nil, nil
}
