package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

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
	// Ownership-checked variants — verify bike.user_id == userID.
	CreateForUser(ctx context.Context, bikeID, userID string, iv *domain.ServiceInterval) (*domain.ServiceInterval, error)
	ListForUser(ctx context.Context, bikeID, userID string) ([]*domain.ServiceInterval, error)
	GetForUser(ctx context.Context, bikeID, intervalID, userID string) (*domain.ServiceInterval, error)
	UpdateForUser(ctx context.Context, bikeID, intervalID, userID string, name string, intervalMiles int, intervalDays *int, lastDoneMileage *int, lastDoneDate *time.Time) (*domain.ServiceInterval, error)
	DeleteForUser(ctx context.Context, bikeID, intervalID, userID string) error
	StatusForUser(ctx context.Context, bikeID, userID string) ([]ComputedStatus, error)
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

// requireOwnership loads the bike and ensures it belongs to userID.
func (s *intervalService) requireOwnership(ctx context.Context, bikeID, userID string) error {
	bike, err := s.bikeRepo.GetByID(ctx, bikeID)
	if err != nil {
		return err
	}
	if bike.UserID == nil || *bike.UserID != userID {
		return fmt.Errorf("forbidden: bike does not belong to user")
	}
	return nil
}

func validateInterval(name string, miles int, days *int, lastDone int) error {
	if strings.TrimSpace(name) == "" || len(name) > 100 {
		return domain.ErrIntervalInvalid
	}
	if miles <= 0 {
		return domain.ErrIntervalInvalid
	}
	if days != nil && *days <= 0 {
		return domain.ErrIntervalInvalid
	}
	if lastDone < 0 {
		return domain.ErrIntervalInvalid
	}
	return nil
}

func (s *intervalService) CreateForUser(ctx context.Context, bikeID, userID string, iv *domain.ServiceInterval) (*domain.ServiceInterval, error) {
	if err := s.requireOwnership(ctx, bikeID, userID); err != nil {
		return nil, err
	}
	iv.BikeID = bikeID
	if err := validateInterval(iv.Name, iv.IntervalMiles, iv.IntervalDays, iv.LastDoneMileage); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, iv); err != nil {
		if errors.Is(err, domain.ErrIntervalInvalid) {
			return nil, fmt.Errorf("conflict: interval name already exists for this bike")
		}
		return nil, err
	}
	return iv, nil
}

func (s *intervalService) ListForUser(ctx context.Context, bikeID, userID string) ([]*domain.ServiceInterval, error) {
	if err := s.requireOwnership(ctx, bikeID, userID); err != nil {
		return nil, err
	}
	return s.repo.ListByBikeID(ctx, bikeID)
}

func (s *intervalService) GetForUser(ctx context.Context, bikeID, intervalID, userID string) (*domain.ServiceInterval, error) {
	if err := s.requireOwnership(ctx, bikeID, userID); err != nil {
		return nil, err
	}
	iv, err := s.repo.GetByID(ctx, intervalID)
	if err != nil {
		return nil, err
	}
	if iv.BikeID != bikeID {
		return nil, domain.ErrIntervalNotFound
	}
	return iv, nil
}

func (s *intervalService) UpdateForUser(ctx context.Context, bikeID, intervalID, userID string, name string, intervalMiles int, intervalDays *int, lastDoneMileage *int, lastDoneDate *time.Time) (*domain.ServiceInterval, error) {
	iv, err := s.GetForUser(ctx, bikeID, intervalID, userID)
	if err != nil {
		return nil, err
	}
	if name != "" {
		iv.Name = strings.TrimSpace(name)
	}
	if intervalMiles > 0 {
		iv.IntervalMiles = intervalMiles
	}
	if intervalDays != nil {
		if *intervalDays <= 0 {
			return nil, domain.ErrIntervalInvalid
		}
		iv.IntervalDays = intervalDays
	}
	if lastDoneMileage != nil {
		if *lastDoneMileage < 0 {
			return nil, domain.ErrIntervalInvalid
		}
		iv.LastDoneMileage = *lastDoneMileage
	}
	if lastDoneDate != nil {
		iv.LastDoneDate = lastDoneDate
	}
	if err := validateInterval(iv.Name, iv.IntervalMiles, iv.IntervalDays, iv.LastDoneMileage); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, iv); err != nil {
		if errors.Is(err, domain.ErrIntervalInvalid) {
			return nil, fmt.Errorf("conflict: interval name already exists for this bike")
		}
		return nil, err
	}
	return iv, nil
}

func (s *intervalService) DeleteForUser(ctx context.Context, bikeID, intervalID, userID string) error {
	if _, err := s.GetForUser(ctx, bikeID, intervalID, userID); err != nil {
		return err
	}
	return s.repo.Delete(ctx, intervalID)
}

func (s *intervalService) StatusForUser(ctx context.Context, bikeID, userID string) ([]ComputedStatus, error) {
	if err := s.requireOwnership(ctx, bikeID, userID); err != nil {
		return nil, err
	}
	return s.Status(ctx, bikeID)
}
