package handler

import (
	"net/http"

	"github.com/arit-pal/bike-companion/engine/internal/service"
	"github.com/arit-pal/bike-companion/engine/pkg/utils"
)

// RecordHandler handles service logging and history.
type RecordHandler struct {
	svc service.RecordService
}

func NewRecordHandler(svc service.RecordService) *RecordHandler {
	return &RecordHandler{svc: svc}
}

func (h *RecordHandler) Log(w http.ResponseWriter, r *http.Request) {
	utils.WriteJSON(w, http.StatusNotImplemented, map[string]string{"error": "not implemented"})
}

func (h *RecordHandler) List(w http.ResponseWriter, r *http.Request) {
	utils.WriteJSON(w, http.StatusNotImplemented, map[string]string{"error": "not implemented"})
}
