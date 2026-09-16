package domain

import (
	"errors"
	"time"
)

// ServiceRecord is a one-off or interval-linked service log.
type ServiceRecord struct {
	ID                string    `json:"id"`
	BikeID            string    `json:"bike_id"`
	ServiceIntervalID *string   `json:"service_interval_id,omitempty"`
	DatePerformed     time.Time `json:"date_performed"`
	MileageAtService  int       `json:"mileage_at_service"`
	Cost              *float64  `json:"cost,omitempty"`
	Notes             *string   `json:"notes,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}

// Domain errors for records.
var (
	ErrRecordNotFound = errors.New("service record not found")
	ErrRecordInvalid  = errors.New("invalid service record")
)
