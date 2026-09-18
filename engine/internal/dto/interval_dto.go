package dto

import "time"

// CreateIntervalRequest for POST /api/bikes/:bikeId/intervals.
type CreateIntervalRequest struct {
	Name            string     `json:"name" validate:"required"`
	IntervalMiles   int        `json:"interval_miles" validate:"required,gt=0"`
	IntervalDays    *int       `json:"interval_days,omitempty" validate:"omitempty,gt=0"`
	LastDoneMileage int        `json:"last_done_mileage" validate:"gte=0"`
	LastDoneDate    *time.Time `json:"last_done_date,omitempty"`
}

// UpdateIntervalRequest for PUT /api/bikes/:bikeId/intervals/:id — all fields optional.
type UpdateIntervalRequest struct {
	Name            *string    `json:"name,omitempty"`
	IntervalMiles   *int       `json:"interval_miles,omitempty"`
	IntervalDays    *int       `json:"interval_days,omitempty"`
	LastDoneMileage *int       `json:"last_done_mileage,omitempty"`
	LastDoneDate    *time.Time `json:"last_done_date,omitempty"`
}

// DashboardStatusResponse is the computed status for dashboard.
type DashboardStatusResponse struct {
	IntervalID     string     `json:"interval_id"`
	Name           string     `json:"name"`
	Status         string     `json:"status"` // OK | Due Soon | Overdue
	MilesRemaining int        `json:"miles_remaining"`
	DaysRemaining  *int       `json:"days_remaining,omitempty"`
	LastDoneDate   *time.Time `json:"last_done_date,omitempty"`
}
