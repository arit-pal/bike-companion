package domain

import (
	"errors"
	"time"
)

// Bike is the core aggregate for a motorcycle.
type Bike struct {
	ID             string     `json:"id"`
	UserID         *string    `json:"user_id,omitempty"`
	Make           string     `json:"make"`
	Model          string     `json:"model"`
	Year           int        `json:"year"`
	Nickname       *string    `json:"nickname,omitempty"`
	Category       *string    `json:"category,omitempty"`
	VIN            *string    `json:"vin,omitempty"`
	CurrentMileage int        `json:"current_mileage"`
	PurchaseDate   *time.Time `json:"purchase_date,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// Domain errors for bikes.
var (
	ErrBikeNotFound = errors.New("bike not found")
	ErrBikeInvalid  = errors.New("invalid bike data")
)
