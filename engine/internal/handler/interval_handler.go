package handler

import (
	"net/http"

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
	utils.WriteJSON(w, http.StatusNotImplemented, map[string]string{"error": "not implemented"})
}

func (h *IntervalHandler) List(w http.ResponseWriter, r *http.Request) {
	utils.WriteJSON(w, http.StatusNotImplemented, map[string]string{"error": "not implemented"})
}

func (h *IntervalHandler) Dashboard(w http.ResponseWriter, r *http.Request) {
	utils.WriteJSON(w, http.StatusNotImplemented, map[string]string{"error": "not implemented"})
}
