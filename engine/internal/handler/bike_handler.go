package handler

import (
	"net/http"

	"github.com/arit-pal/bike-companion/engine/internal/dto"
	"github.com/arit-pal/bike-companion/engine/internal/service"
	"github.com/arit-pal/bike-companion/engine/pkg/utils"
)

// BikeHandler handles /api/bikes routes.
type BikeHandler struct {
	svc service.BikeService
}

func NewBikeHandler(svc service.BikeService) *BikeHandler {
	return &BikeHandler{svc: svc}
}

// Create handles POST /api/bikes — stub until wired.
func (h *BikeHandler) Create(w http.ResponseWriter, r *http.Request) {
	utils.WriteJSON(w, http.StatusNotImplemented, map[string]string{"error": "not implemented"})
}

// List handles GET /api/bikes.
func (h *BikeHandler) List(w http.ResponseWriter, r *http.Request) {
	bikes, err := h.svc.List(r.Context())
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "failed to list bikes")
		return
	}
	// Map to response
	resp := make([]dto.BikeResponse, 0, len(bikes))
	for _, b := range bikes {
		resp = append(resp, dto.BikeResponse{
			ID: b.ID, UserID: b.UserID, Make: b.Make, Model: b.Model, Year: b.Year,
			Nickname: b.Nickname, Category: b.Category, VIN: b.VIN,
			CurrentMileage: b.CurrentMileage, PurchaseDate: b.PurchaseDate,
			CreatedAt: b.CreatedAt, UpdatedAt: b.UpdatedAt,
		})
	}
	utils.WriteJSON(w, http.StatusOK, resp)
}

// UpdateMileage handles PATCH /api/bikes/{id}/mileage — requires auth, checks ownership.
func (h *BikeHandler) UpdateMileage(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	bikeID := r.PathValue("id")
	if bikeID == "" {
		utils.WriteError(w, http.StatusBadRequest, "bike id required")
		return
	}

	var req dto.UpdateMileageRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid json")
		return
	}
	if req.CurrentMileage < 0 {
		utils.WriteError(w, http.StatusBadRequest, "mileage must be >= 0")
		return
	}

	updated, err := h.svc.UpdateMileageForUser(r.Context(), bikeID, userID, req.CurrentMileage)
	if err != nil {
		if err.Error() == "forbidden: bike does not belong to user" {
			utils.WriteError(w, http.StatusForbidden, "forbidden")
			return
		}
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	resp := dto.BikeResponse{
		ID: updated.ID, UserID: updated.UserID, Make: updated.Make, Model: updated.Model, Year: updated.Year,
		Nickname: updated.Nickname, Category: updated.Category, VIN: updated.VIN,
		CurrentMileage: updated.CurrentMileage, PurchaseDate: updated.PurchaseDate,
		CreatedAt: updated.CreatedAt, UpdatedAt: updated.UpdatedAt,
	}
	utils.WriteJSON(w, http.StatusOK, resp)
}
