package utils

import "github.com/arit-pal/bike-companion/engine/pkg/constants"

// MileageStatus computes interval status from current vs last-done.
// Returns constants.StatusOverdue / DueSoon / OK
func MileageStatus(currentMileage, lastDoneMileage, intervalMiles int) string {
	remaining := intervalMiles - (currentMileage - lastDoneMileage)
	if remaining <= 0 {
		return constants.StatusOverdue
	}
	if remaining <= constants.DueSoonThresholdMiles {
		return constants.StatusDueSoon
	}
	return constants.StatusOK
}

// MilesRemaining returns how many miles/km remain until due (can be negative).
func MilesRemaining(currentMileage, lastDoneMileage, intervalMiles int) int {
	return intervalMiles - (currentMileage - lastDoneMileage)
}
