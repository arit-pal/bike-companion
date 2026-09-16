package dto

// RegisterRequest mirrors frontend RegisterPayload (2-step combined).
type RegisterRequest struct {
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=10"`
	ConfirmPassword string `json:"confirmPassword" validate:"required,eqfield=Password"`
	MakeModel       string `json:"makeModel" validate:"required"`
	Year            int    `json:"year" validate:"required,gte=1960,lte=2100"`
	Odometer        string `json:"odometer" validate:"required"`
	OdometerUnit    string `json:"odometerUnit" validate:"required,oneof=KM"`
	Category        string `json:"category"`
	VIN             string `json:"vin"`
}

// LoginRequest mirrors frontend LoginPayload.
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=10"`
}

// AuthResponse is returned on register/login.
type AuthResponse struct {
	Token string        `json:"token"`
	User  UserResponse  `json:"user"`
	Bike  *BikeResponse `json:"bike,omitempty"`
}

// UserResponse is public user fields.
type UserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

// MeResponse for GET /api/auth/me
type MeResponse struct {
	User UserResponse  `json:"user"`
	Bike *BikeResponse `json:"bike,omitempty"`
}
