package dto

import "time"

// LogServiceRequest for POST /api/bikes/:bikeId/records.
type LogServiceRequest struct {
	ServiceIntervalID *string   `json:"service_interval_id,omitempty"`
	DatePerformed     time.Time `json:"date_performed" validate:"required"`
	MileageAtService  int       `json:"mileage_at_service" validate:"required,gte=0"`
	Cost              *float64  `json:"cost,omitempty" validate:"omitempty,gte=0"`
	Notes             *string   `json:"notes,omitempty"`
}

// ServiceHistoryResponse is a single history row.
type ServiceHistoryResponse struct {
	ID                string    `json:"id"`
	BikeID            string    `json:"bike_id"`
	ServiceIntervalID *string   `json:"service_interval_id,omitempty"`
	DatePerformed     time.Time `json:"date_performed"`
	MileageAtService  int       `json:"mileage_at_service"`
	Cost              *float64  `json:"cost,omitempty"`
	Notes             *string   `json:"notes,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}
