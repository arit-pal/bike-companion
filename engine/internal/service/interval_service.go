package service

import (
	"context"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
	"github.com/arit-pal/bike-companion/engine/internal/repository"
	"github.com/arit-pal/bike-companion/engine/pkg/utils"
)

// IntervalService defines business operations for intervals.
type IntervalService interface {
	Create(ctx context.Context, iv *domain.ServiceInterval) (*domain.ServiceInterval, error)
	ListByBikeID(ctx context.Context, bikeID string) ([]*domain.ServiceInterval, error)
	// Status returns computed dashboard status for a bike's intervals.
	Status(ctx context.Context, bikeID string) ([]ComputedStatus, error)
}

type ComputedStatus struct {
	Interval  *domain.ServiceInterval `json:"interval"`
	Status    string                  `json:"status"`
	Remaining int                     `json:"remaining"`
}

type intervalService struct {
	repo     repository.IntervalRepository
	bikeRepo repository.BikeRepository
}

var _ IntervalService = (*intervalService)(nil)

func NewIntervalService(repo repository.IntervalRepository, bikeRepo repository.BikeRepository) IntervalService {
	return &intervalService{repo: repo, bikeRepo: bikeRepo}
}

func (s *intervalService) Create(ctx context.Context, iv *domain.ServiceInterval) (*domain.ServiceInterval, error) {
	if iv.Name == "" || iv.IntervalMiles <= 0 {
		return nil, domain.ErrIntervalInvalid
	}
	if err := s.repo.Create(ctx, iv); err != nil {
		return nil, err
	}
	return iv, nil
}

func (s *intervalService) ListByBikeID(ctx context.Context, bikeID string) ([]*domain.ServiceInterval, error) {
	return s.repo.ListByBikeID(ctx, bikeID)
}

func (s *intervalService) Status(ctx context.Context, bikeID string) ([]ComputedStatus, error) {
	bike, err := s.bikeRepo.GetByID(ctx, bikeID)
	if err != nil {
		return nil, err
	}
	intervals, err := s.repo.ListByBikeID(ctx, bikeID)
	if err != nil {
		return nil, err
	}
	out := make([]ComputedStatus, 0, len(intervals))
	for _, iv := range intervals {
		status := utils.MileageStatus(bike.CurrentMileage, iv.LastDoneMileage, iv.IntervalMiles)
		remaining := utils.MilesRemaining(bike.CurrentMileage, iv.LastDoneMileage, iv.IntervalMiles)
		out = append(out, ComputedStatus{Interval: iv, Status: status, Remaining: remaining})
	}
	return out, nil
}
