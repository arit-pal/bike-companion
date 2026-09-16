package repository

import (
	"context"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
)

// IntervalRepository defines persistence for service intervals.
type IntervalRepository interface {
	Create(ctx context.Context, iv *domain.ServiceInterval) error
	ListByBikeID(ctx context.Context, bikeID string) ([]*domain.ServiceInterval, error)
	UpdateLastDone(ctx context.Context, id string, mileage int) error
	Delete(ctx context.Context, id string) error
}

// PostgresIntervalRepository is the Postgres implementation.
type PostgresIntervalRepository struct{}

var _ IntervalRepository = (*PostgresIntervalRepository)(nil)

func NewPostgresIntervalRepository() *PostgresIntervalRepository {
	return &PostgresIntervalRepository{}
}

func (r *PostgresIntervalRepository) Create(_ context.Context, _ *domain.ServiceInterval) error {
	return nil // TODO: INSERT INTO service_intervals ...
}

func (r *PostgresIntervalRepository) ListByBikeID(_ context.Context, _ string) ([]*domain.ServiceInterval, error) {
	return nil, nil
}

func (r *PostgresIntervalRepository) UpdateLastDone(_ context.Context, _ string, _ int) error {
	return nil
}

func (r *PostgresIntervalRepository) Delete(_ context.Context, _ string) error {
	return nil
}
