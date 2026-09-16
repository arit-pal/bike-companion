package service

import (
	"context"
	"fmt"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
	"github.com/arit-pal/bike-companion/engine/internal/repository"
)

// BikeService defines business operations for bikes.
type BikeService interface {
	Create(ctx context.Context, b *domain.Bike) (*domain.Bike, error)
	GetByID(ctx context.Context, id string) (*domain.Bike, error)
	GetByUserID(ctx context.Context, userID string) (*domain.Bike, error)
	List(ctx context.Context) ([]*domain.Bike, error)
	UpdateMileage(ctx context.Context, id string, mileage int) error
	UpdateMileageForUser(ctx context.Context, bikeID, userID string, mileage int) (*domain.Bike, error)
}

type bikeService struct {
	repo repository.BikeRepository
}

var _ BikeService = (*bikeService)(nil)

func NewBikeService(repo repository.BikeRepository) BikeService {
	return &bikeService{repo: repo}
}

func (s *bikeService) Create(ctx context.Context, b *domain.Bike) (*domain.Bike, error) {
	if b.Make == "" || b.Model == "" {
		return nil, domain.ErrBikeInvalid
	}
	if err := s.repo.Create(ctx, b); err != nil {
		return nil, err
	}
	return b, nil
}

func (s *bikeService) GetByID(ctx context.Context, id string) (*domain.Bike, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *bikeService) GetByUserID(ctx context.Context, userID string) (*domain.Bike, error) {
	return s.repo.GetByUserID(ctx, userID)
}

func (s *bikeService) List(ctx context.Context) ([]*domain.Bike, error) {
	return s.repo.List(ctx)
}

func (s *bikeService) UpdateMileage(ctx context.Context, id string, mileage int) error {
	if mileage < 0 {
		return domain.ErrBikeInvalid
	}
	return s.repo.UpdateMileage(ctx, id, mileage)
}

func (s *bikeService) UpdateMileageForUser(ctx context.Context, bikeID, userID string, mileage int) (*domain.Bike, error) {
	if mileage < 0 {
		return nil, domain.ErrBikeInvalid
	}
	bike, err := s.repo.GetByID(ctx, bikeID)
	if err != nil {
		return nil, err
	}
	if bike.UserID == nil || *bike.UserID != userID {
		return nil, fmt.Errorf("forbidden: bike does not belong to user")
	}
	if err := s.repo.UpdateMileage(ctx, bikeID, mileage); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetByID(ctx, bikeID)
	if err != nil {
		return nil, err
	}
	return updated, nil
}
