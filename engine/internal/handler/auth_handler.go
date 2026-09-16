package handler

import (
	"net/http"
	"strings"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
	"github.com/arit-pal/bike-companion/engine/internal/dto"
	"github.com/arit-pal/bike-companion/engine/internal/service"
	"github.com/arit-pal/bike-companion/engine/pkg/utils"
)

// AuthHandler handles /api/auth/*.
type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register handles POST /api/auth/register.
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid json")
		return
	}

	// Basic validation (defense in depth, frontend already validates)
	if req.Email == "" || req.Password == "" || req.ConfirmPassword == "" {
		utils.WriteError(w, http.StatusBadRequest, "email and password required")
		return
	}
	if req.Password != req.ConfirmPassword {
		utils.WriteError(w, http.StatusBadRequest, "passwords do not match")
		return
	}
	if len(req.Password) < 10 {
		utils.WriteError(w, http.StatusBadRequest, "password must be at least 10 characters")
		return
	}
	if req.MakeModel == "" {
		utils.WriteError(w, http.StatusBadRequest, "make & model required")
		return
	}
	if req.Year < 1960 || req.Year > 2100 {
		utils.WriteError(w, http.StatusBadRequest, "invalid year")
		return
	}

	user, bike, token, err := h.authService.Register(r.Context(), req)
	if err != nil {
		switch err {
		case domain.ErrUserExists:
			utils.WriteError(w, http.StatusConflict, "user already exists")
		case domain.ErrUserInvalid, domain.ErrBikeInvalid:
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		default:
			if strings.Contains(err.Error(), "23505") {
				utils.WriteError(w, http.StatusConflict, "user already exists")
			} else {
				utils.WriteError(w, http.StatusBadRequest, err.Error())
			}
		}
		return
	}

	resp := dto.AuthResponse{
		Token: token,
		User:  dto.UserResponse{ID: user.ID, Email: user.Email},
	}
	if bike != nil {
		resp.Bike = &dto.BikeResponse{
			ID: bike.ID, UserID: bike.UserID, Make: bike.Make, Model: bike.Model, Year: bike.Year,
			Nickname: bike.Nickname, Category: bike.Category, VIN: bike.VIN,
			CurrentMileage: bike.CurrentMileage, PurchaseDate: bike.PurchaseDate,
			CreatedAt: bike.CreatedAt, UpdatedAt: bike.UpdatedAt,
		}
	}

	utils.WriteJSON(w, http.StatusCreated, resp)
}

// Login handles POST /api/auth/login.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid json")
		return
	}

	if req.Email == "" || req.Password == "" {
		utils.WriteError(w, http.StatusBadRequest, "email and password required")
		return
	}

	user, bike, token, err := h.authService.Login(r.Context(), req)
	if err != nil {
		if err == domain.ErrInvalidCredentials || err == domain.ErrUserNotFound {
			utils.WriteError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		utils.WriteError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	resp := dto.AuthResponse{
		Token: token,
		User:  dto.UserResponse{ID: user.ID, Email: user.Email},
	}
	if bike != nil {
		resp.Bike = &dto.BikeResponse{
			ID: bike.ID, UserID: bike.UserID, Make: bike.Make, Model: bike.Model, Year: bike.Year,
			Nickname: bike.Nickname, Category: bike.Category, VIN: bike.VIN,
			CurrentMileage: bike.CurrentMileage, PurchaseDate: bike.PurchaseDate,
			CreatedAt: bike.CreatedAt, UpdatedAt: bike.UpdatedAt,
		}
	}

	utils.WriteJSON(w, http.StatusOK, resp)
}

// Me handles GET /api/auth/me — requires Authorization: Bearer <token>.
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, bike, err := h.authService.GetMe(r.Context(), userID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "user not found")
		return
	}

	resp := dto.MeResponse{
		User: dto.UserResponse{ID: user.ID, Email: user.Email},
	}
	if bike != nil {
		resp.Bike = &dto.BikeResponse{
			ID: bike.ID, UserID: bike.UserID, Make: bike.Make, Model: bike.Model, Year: bike.Year,
			Nickname: bike.Nickname, Category: bike.Category, VIN: bike.VIN,
			CurrentMileage: bike.CurrentMileage, PurchaseDate: bike.PurchaseDate,
			CreatedAt: bike.CreatedAt, UpdatedAt: bike.UpdatedAt,
		}
	}

	utils.WriteJSON(w, http.StatusOK, resp)
}
