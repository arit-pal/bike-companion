package domain

import (
	"errors"
	"time"
)

// ServiceInterval defines a recurring maintenance item for a bike.
type ServiceInterval struct {
	ID              string     `json:"id"`
	BikeID          string     `json:"bike_id"`
	Name            string     `json:"name"`
	IntervalMiles   int        `json:"interval_miles"`
	IntervalDays    *int       `json:"interval_days,omitempty"`
	LastDoneMileage int        `json:"last_done_mileage"`
	LastDoneDate    *time.Time `json:"last_done_date,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// Domain errors for intervals.
var (
	ErrIntervalNotFound = errors.New("service interval not found")
	ErrIntervalInvalid  = errors.New("invalid interval data")
)
