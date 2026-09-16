package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/arit-pal/bike-companion/engine/internal/config"
	"github.com/arit-pal/bike-companion/engine/internal/domain"
	"github.com/arit-pal/bike-companion/engine/internal/dto"
	"github.com/arit-pal/bike-companion/engine/internal/repository"
	"github.com/arit-pal/bike-companion/engine/pkg/database"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles register/login.
type AuthService interface {
	Register(ctx context.Context, req dto.RegisterRequest) (*domain.User, *domain.Bike, string, error)
	Login(ctx context.Context, req dto.LoginRequest) (*domain.User, *domain.Bike, string, error)
	GetMe(ctx context.Context, userID string) (*domain.User, *domain.Bike, error)
}

type authService struct {
	cfg      *config.Config
	pool     *database.Pool
	userRepo repository.UserRepository
	bikeRepo repository.BikeRepository
}

var _ AuthService = (*authService)(nil)

func NewAuthService(cfg *config.Config, pool *database.Pool, userRepo repository.UserRepository, bikeRepo repository.BikeRepository) AuthService {
	return &authService{cfg: cfg, pool: pool, userRepo: userRepo, bikeRepo: bikeRepo}
}

func (s *authService) Register(ctx context.Context, req dto.RegisterRequest) (*domain.User, *domain.Bike, string, error) {
	if req.Password != req.ConfirmPassword {
		return nil, nil, "", domain.ErrUserInvalid
	}
	if len(req.Password) < 10 {
		return nil, nil, "", domain.ErrUserInvalid
	}

	// Check existing user
	if _, err := s.userRepo.GetByEmail(ctx, req.Email); err == nil {
		return nil, nil, "", domain.ErrUserExists
	} else if !errors.Is(err, domain.ErrUserNotFound) {
		return nil, nil, "", err
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, "", fmt.Errorf("hash password: %w", err)
	}

	userID := uuid.NewString()
	user := &domain.User{
		ID:           userID,
		Email:        strings.ToLower(strings.TrimSpace(req.Email)),
		PasswordHash: string(hash),
	}

	// Parse odometer
	mileage, err := parseOdometer(req.Odometer)
	if err != nil {
		return nil, nil, "", fmt.Errorf("invalid odometer: %w", err)
	}

	// Split makeModel
	makeStr, modelStr := splitMakeModel(req.MakeModel)
	if makeStr == "" {
		return nil, nil, "", domain.ErrBikeInvalid
	}

	bikeID := uuid.NewString()
	var category *string
	if strings.TrimSpace(req.Category) != "" {
		c := strings.TrimSpace(req.Category)
		category = &c
	}
	var vin *string
	if strings.TrimSpace(req.VIN) != "" {
		v := strings.ToUpper(strings.TrimSpace(req.VIN))
		vin = &v
	}

	bike := &domain.Bike{
		ID:             bikeID,
		UserID:         &userID,
		Make:           makeStr,
		Model:          modelStr,
		Year:           req.Year,
		Category:       category,
		VIN:            vin,
		CurrentMileage: mileage,
	}

	// Transaction: create user then bike
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, nil, "", fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	_, err = tx.Exec(ctx, `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)`, user.ID, user.Email, user.PasswordHash)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, nil, "", domain.ErrUserExists
		}
		return nil, nil, "", fmt.Errorf("create user: %w", err)
	}

	_, err = tx.Exec(ctx, `INSERT INTO bikes (id, user_id, make, model, year, category, vin, current_mileage) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		bike.ID, bike.UserID, bike.Make, bike.Model, bike.Year, bike.Category, bike.VIN, bike.CurrentMileage)
	if err != nil {
		return nil, nil, "", fmt.Errorf("create bike: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, nil, "", fmt.Errorf("commit: %w", err)
	}

	// Fetch created user/bike for timestamps
	createdUser, _ := s.userRepo.GetByID(ctx, userID)
	if createdUser != nil {
		user = createdUser
	}
	createdBike, _ := s.bikeRepo.GetByID(ctx, bikeID)
	if createdBike != nil {
		bike = createdBike
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, nil, "", err
	}

	return user, bike, token, nil
}

func (s *authService) Login(ctx context.Context, req dto.LoginRequest) (*domain.User, *domain.Bike, string, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, nil, "", domain.ErrInvalidCredentials
		}
		return nil, nil, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, nil, "", domain.ErrInvalidCredentials
	}

	bike, _ := s.bikeRepo.GetByUserID(ctx, user.ID) // bike may not exist (legacy)

	token, err := s.generateToken(user)
	if err != nil {
		return nil, nil, "", err
	}

	return user, bike, token, nil
}

func (s *authService) GetMe(ctx context.Context, userID string) (*domain.User, *domain.Bike, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}
	bike, _ := s.bikeRepo.GetByUserID(ctx, userID)
	return user, bike, nil
}

func (s *authService) generateToken(user *domain.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"exp":   time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":   time.Now().Unix(),
		"jti":   randomJTI(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func randomJTI() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%x", b)
}

func parseOdometer(s string) (int, error) {
	clean := strings.ReplaceAll(s, ",", "")
	clean = strings.TrimSpace(clean)
	if clean == "" {
		return 0, errors.New("empty odometer")
	}
	return strconv.Atoi(clean)
}

func splitMakeModel(s string) (string, string) {
	s = strings.TrimSpace(s)
	if s == "" {
		return "", ""
	}
	parts := strings.Fields(s)
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func isUniqueViolation(err error) bool {
	return err != nil && contains(err.Error(), "23505")
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (func() bool {
		for i := 0; i <= len(s)-len(substr); i++ {
			if s[i:i+len(substr)] == substr {
				return true
			}
		}
		return false
	})()
}
