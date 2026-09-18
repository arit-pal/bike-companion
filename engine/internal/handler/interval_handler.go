package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
	"github.com/arit-pal/bike-companion/engine/internal/dto"
	"github.com/arit-pal/bike-companion/engine/internal/middleware"
	"github.com/arit-pal/bike-companion/engine/internal/service"
	"github.com/arit-pal/bike-companion/engine/pkg/utils"
)

// IntervalHandler handles interval CRUD and dashboard.
type IntervalHandler struct {
	svc service.IntervalService
}

func NewIntervalHandler(svc service.IntervalService) *IntervalHandler {
	return &IntervalHandler{svc: svc}
}

func (h *IntervalHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	bikeID := r.PathValue("bikeId")
	if bikeID == "" {
		utils.WriteError(w, http.StatusBadRequest, "bike id required")
		return
	}
	var req dto.CreateIntervalRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid json")
		return
	}
	iv := &domain.ServiceInterval{
		Name:            strings.TrimSpace(req.Name),
		IntervalMiles:   req.IntervalMiles,
		IntervalDays:    req.IntervalDays,
		LastDoneMileage: req.LastDoneMileage,
		LastDoneDate:    req.LastDoneDate,
	}
	created, err := h.svc.CreateForUser(r.Context(), bikeID, userID, iv)
	if err != nil {
		writeIntervalError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusCreated, created)
}

func (h *IntervalHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	bikeID := r.PathValue("bikeId")
	if bikeID == "" {
		utils.WriteError(w, http.StatusBadRequest, "bike id required")
		return
	}
	intervals, err := h.svc.ListForUser(r.Context(), bikeID, userID)
	if err != nil {
		writeIntervalError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, intervals)
}

func (h *IntervalHandler) Dashboard(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	bikeID := r.PathValue("bikeId")
	if bikeID == "" {
		utils.WriteError(w, http.StatusBadRequest, "bike id required")
		return
	}
	statuses, err := h.svc.StatusForUser(r.Context(), bikeID, userID)
	if err != nil {
		writeIntervalError(w, err)
		return
	}
	resp := make([]dto.DashboardStatusResponse, 0, len(statuses))
	for _, s := range statuses {
		resp = append(resp, dto.DashboardStatusResponse{
			IntervalID:     s.Interval.ID,
			Name:           s.Interval.Name,
			Status:         s.Status,
			MilesRemaining: s.Remaining,
			LastDoneDate:   s.Interval.LastDoneDate,
		})
	}
	utils.WriteJSON(w, http.StatusOK, resp)
}

// Update handles PUT /api/bikes/{bikeId}/intervals/{id}.
func (h *IntervalHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	bikeID := r.PathValue("bikeId")
	intervalID := r.PathValue("id")
	if bikeID == "" || intervalID == "" {
		utils.WriteError(w, http.StatusBadRequest, "bike id and interval id required")
		return
	}
	var req dto.UpdateIntervalRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid json")
		return
	}
	name := ""
	intervalMiles := 0
	if req.Name != nil {
		name = *req.Name
	}
	if req.IntervalMiles != nil {
		intervalMiles = *req.IntervalMiles
	}
	updated, err := h.svc.UpdateForUser(r.Context(), bikeID, intervalID, userID,
		name, intervalMiles, req.IntervalDays, req.LastDoneMileage, req.LastDoneDate)
	if err != nil {
		writeIntervalError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, updated)
}

// Delete handles DELETE /api/bikes/{bikeId}/intervals/{id}.
func (h *IntervalHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	bikeID := r.PathValue("bikeId")
	intervalID := r.PathValue("id")
	if bikeID == "" || intervalID == "" {
		utils.WriteError(w, http.StatusBadRequest, "bike id and interval id required")
		return
	}
	if err := h.svc.DeleteForUser(r.Context(), bikeID, intervalID, userID); err != nil {
		writeIntervalError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeIntervalError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrIntervalNotFound) || errors.Is(err, domain.ErrBikeNotFound):
		utils.WriteError(w, http.StatusNotFound, "not found")
	case errors.Is(err, domain.ErrIntervalInvalid):
		utils.WriteError(w, http.StatusBadRequest, "invalid interval data")
	case err.Error() != "" && strings.HasPrefix(err.Error(), "forbidden"):
		utils.WriteError(w, http.StatusForbidden, "forbidden")
	case strings.HasPrefix(err.Error(), "conflict"):
		utils.WriteError(w, http.StatusConflict, "interval name already exists for this bike")
	default:
		utils.WriteError(w, http.StatusBadRequest, err.Error())
	}
}
