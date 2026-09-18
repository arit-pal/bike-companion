package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
	"github.com/arit-pal/bike-companion/engine/pkg/database"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// IntervalRepository defines persistence for service intervals.
type IntervalRepository interface {
	Create(ctx context.Context, iv *domain.ServiceInterval) error
	ListByBikeID(ctx context.Context, bikeID string) ([]*domain.ServiceInterval, error)
	GetByID(ctx context.Context, id string) (*domain.ServiceInterval, error)
	Update(ctx context.Context, iv *domain.ServiceInterval) error
	UpdateLastDone(ctx context.Context, id string, mileage int) error
	Delete(ctx context.Context, id string) error
}

// PostgresIntervalRepository is the Postgres implementation.
type PostgresIntervalRepository struct {
	pool *database.Pool
}

var _ IntervalRepository = (*PostgresIntervalRepository)(nil)

func NewPostgresIntervalRepository(pool *database.Pool) *PostgresIntervalRepository {
	return &PostgresIntervalRepository{pool: pool}
}

func (r *PostgresIntervalRepository) Create(ctx context.Context, iv *domain.ServiceInterval) error {
	if iv.ID == "" {
		iv.ID = uuid.NewString()
	}
	query := `
		INSERT INTO service_intervals (id, bike_id, name, interval_miles, interval_days, last_done_mileage, last_done_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at, updated_at`
	err := r.pool.QueryRow(ctx, query,
		iv.ID, iv.BikeID, iv.Name, iv.IntervalMiles, iv.IntervalDays, iv.LastDoneMileage, iv.LastDoneDate,
	).Scan(&iv.CreatedAt, &iv.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.ErrIntervalInvalid
		}
		return fmt.Errorf("create interval: %w", err)
	}
	return nil
}

func (r *PostgresIntervalRepository) ListByBikeID(ctx context.Context, bikeID string) ([]*domain.ServiceInterval, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, bike_id, name, interval_miles, interval_days, last_done_mileage, last_done_date, created_at, updated_at
		FROM service_intervals WHERE bike_id = $1 ORDER BY name ASC`, bikeID)
	if err != nil {
		return nil, fmt.Errorf("list intervals: %w", err)
	}
	defer rows.Close()
	out := make([]*domain.ServiceInterval, 0)
	for rows.Next() {
		iv := &domain.ServiceInterval{}
		if err := rows.Scan(
			&iv.ID, &iv.BikeID, &iv.Name, &iv.IntervalMiles, &iv.IntervalDays,
			&iv.LastDoneMileage, &iv.LastDoneDate, &iv.CreatedAt, &iv.UpdatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, iv)
	}
	return out, rows.Err()
}

func (r *PostgresIntervalRepository) GetByID(ctx context.Context, id string) (*domain.ServiceInterval, error) {
	iv := &domain.ServiceInterval{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, bike_id, name, interval_miles, interval_days, last_done_mileage, last_done_date, created_at, updated_at
		FROM service_intervals WHERE id = $1`, id).Scan(
		&iv.ID, &iv.BikeID, &iv.Name, &iv.IntervalMiles, &iv.IntervalDays,
		&iv.LastDoneMileage, &iv.LastDoneDate, &iv.CreatedAt, &iv.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrIntervalNotFound
		}
		return nil, fmt.Errorf("get interval: %w", err)
	}
	return iv, nil
}

func (r *PostgresIntervalRepository) Update(ctx context.Context, iv *domain.ServiceInterval) error {
	cmd, err := r.pool.Exec(ctx, `
		UPDATE service_intervals
		SET name = $2, interval_miles = $3, interval_days = $4,
		    last_done_mileage = $5, last_done_date = $6, updated_at = now()
		WHERE id = $1`, iv.ID, iv.Name, iv.IntervalMiles, iv.IntervalDays, iv.LastDoneMileage, iv.LastDoneDate)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.ErrIntervalInvalid
		}
		return fmt.Errorf("update interval: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return domain.ErrIntervalNotFound
	}
	return nil
}

func (r *PostgresIntervalRepository) UpdateLastDone(ctx context.Context, id string, mileage int) error {
	cmd, err := r.pool.Exec(ctx, `
		UPDATE service_intervals
		SET last_done_mileage = $2, last_done_date = CURRENT_DATE, updated_at = now()
		WHERE id = $1`, id, mileage)
	if err != nil {
		return fmt.Errorf("update last done: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return domain.ErrIntervalNotFound
	}
	return nil
}

func (r *PostgresIntervalRepository) Delete(ctx context.Context, id string) error {
	cmd, err := r.pool.Exec(ctx, `DELETE FROM service_intervals WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete interval: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return domain.ErrIntervalNotFound
	}
	return nil
}
