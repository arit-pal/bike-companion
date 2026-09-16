package dto

import "time"

// CreateBikeRequest is the payload for POST /api/bikes.
type CreateBikeRequest struct {
	Make           string     `json:"make" validate:"required"`
	Model          string     `json:"model" validate:"required"`
	Year           int        `json:"year" validate:"required,gte=1960,lte=2100"`
	Nickname       *string    `json:"nickname,omitempty"`
	CurrentMileage int        `json:"current_mileage" validate:"gte=0"`
	PurchaseDate   *time.Time `json:"purchase_date,omitempty"`
}

// UpdateMileageRequest for PATCH /api/bikes/:id/mileage.
type UpdateMileageRequest struct {
	CurrentMileage int `json:"current_mileage" validate:"required,gte=0"`
}

// BikeResponse is the API representation of a Bike.
type BikeResponse struct {
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
