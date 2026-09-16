package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
	"github.com/arit-pal/bike-companion/engine/pkg/database"
	"github.com/jackc/pgx/v5"
)

// BikeRepository defines persistence for bikes.
type BikeRepository interface {
	Create(ctx context.Context, b *domain.Bike) error
	GetByID(ctx context.Context, id string) (*domain.Bike, error)
	GetByUserID(ctx context.Context, userID string) (*domain.Bike, error)
	List(ctx context.Context) ([]*domain.Bike, error)
	UpdateMileage(ctx context.Context, id string, mileage int) error
}

type postgresBikeRepository struct {
	pool *database.Pool
}

var _ BikeRepository = (*postgresBikeRepository)(nil)

func NewPostgresBikeRepository(pool *database.Pool) BikeRepository {
	return &postgresBikeRepository{pool: pool}
}

func (r *postgresBikeRepository) Create(ctx context.Context, b *domain.Bike) error {
	query := `
		INSERT INTO bikes (id, user_id, make, model, year, nickname, category, vin, current_mileage)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at, updated_at`
	err := r.pool.QueryRow(ctx, query,
		b.ID, b.UserID, b.Make, b.Model, b.Year, b.Nickname, b.Category, b.VIN, b.CurrentMileage,
	).Scan(&b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create bike: %w", err)
	}
	return nil
}

func (r *postgresBikeRepository) GetByID(ctx context.Context, id string) (*domain.Bike, error) {
	query := `SELECT id, user_id, make, model, year, nickname, category, vin, current_mileage, purchase_date, created_at, updated_at FROM bikes WHERE id = $1`
	b := &domain.Bike{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&b.ID, &b.UserID, &b.Make, &b.Model, &b.Year, &b.Nickname, &b.Category, &b.VIN, &b.CurrentMileage, &b.PurchaseDate, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrBikeNotFound
		}
		return nil, fmt.Errorf("get bike: %w", err)
	}
	return b, nil
}

func (r *postgresBikeRepository) GetByUserID(ctx context.Context, userID string) (*domain.Bike, error) {
	query := `SELECT id, user_id, make, model, year, nickname, category, vin, current_mileage, purchase_date, created_at, updated_at FROM bikes WHERE user_id = $1 LIMIT 1`
	b := &domain.Bike{}
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&b.ID, &b.UserID, &b.Make, &b.Model, &b.Year, &b.Nickname, &b.Category, &b.VIN, &b.CurrentMileage, &b.PurchaseDate, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrBikeNotFound
		}
		return nil, fmt.Errorf("get bike by user: %w", err)
	}
	return b, nil
}

func (r *postgresBikeRepository) List(ctx context.Context) ([]*domain.Bike, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, user_id, make, model, year, nickname, category, vin, current_mileage, purchase_date, created_at, updated_at FROM bikes ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list bikes: %w", err)
	}
	defer rows.Close()
	var out []*domain.Bike
	for rows.Next() {
		b := &domain.Bike{}
		if err := rows.Scan(&b.ID, &b.UserID, &b.Make, &b.Model, &b.Year, &b.Nickname, &b.Category, &b.VIN, &b.CurrentMileage, &b.PurchaseDate, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

func (r *postgresBikeRepository) UpdateMileage(ctx context.Context, id string, mileage int) error {
	_, err := r.pool.Exec(ctx, `UPDATE bikes SET current_mileage = $2 WHERE id = $1`, id, mileage)
	return err
}
