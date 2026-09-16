package constants

// Service status values.
const (
	StatusOK      = "OK"
	StatusDueSoon = "Due Soon"
	StatusOverdue = "Overdue"
)

// Default thresholds for dashboard status.
const (
	DueSoonThresholdMiles = 500 // miles/km remaining to be "Due Soon"
	DueSoonThresholdDays  = 14  // days remaining to be "Due Soon"
)

// Pagination defaults.
const (
	DefaultPage     = 1
	DefaultPageSize = 20
	MaxPageSize     = 100
)
