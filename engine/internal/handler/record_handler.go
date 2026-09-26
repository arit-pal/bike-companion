package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/arit-pal/bike-companion/engine/internal/domain"
	"github.com/arit-pal/bike-companion/engine/internal/dto"
	"github.com/arit-pal/bike-companion/engine/internal/middleware"
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

// logRequest mirrors dto.LogServiceRequest but accepts a plain YYYY-MM-DD date
// (HTML date inputs don't emit RFC3339, which time.Time can't unmarshal).
type logRequest struct {
	ServiceIntervalID *string  `json:"service_interval_id"`
	DatePerformed     string   `json:"date_performed"`
	MileageAtService  int      `json:"mileage_at_service"`
	Cost              *float64 `json:"cost"`
	Notes             *string  `json:"notes"`
}

// Log handles POST /api/bikes/{bikeId}/records — 201 with the created record.
func (h *RecordHandler) Log(w http.ResponseWriter, r *http.Request) {
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
	var req logRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid json")
		return
	}
	date, err := time.Parse("2006-01-02", strings.TrimSpace(req.DatePerformed))
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "date_performed must be YYYY-MM-DD")
		return
	}
	rec := &domain.ServiceRecord{
		ServiceIntervalID: req.ServiceIntervalID,
		DatePerformed:     date,
		MileageAtService:  req.MileageAtService,
		Cost:              req.Cost,
		Notes:             req.Notes,
	}
	created, err := h.svc.LogForUser(r.Context(), bikeID, userID, rec)
	if err != nil {
		writeRecordError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusCreated, toHistoryResponse(created))
}

// List handles GET /api/bikes/{bikeId}/records?interval_id=&limit=&offset=.
func (h *RecordHandler) List(w http.ResponseWriter, r *http.Request) {
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
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	recs, err := h.svc.ListForUser(r.Context(), bikeID, userID, q.Get("interval_id"), limit, offset)
	if err != nil {
		writeRecordError(w, err)
		return
	}
	resp := make([]dto.ServiceHistoryResponse, 0, len(recs))
	for _, rec := range recs {
		resp = append(resp, toHistoryResponse(rec))
	}
	utils.WriteJSON(w, http.StatusOK, resp)
}

func toHistoryResponse(rec *domain.ServiceRecord) dto.ServiceHistoryResponse {
	return dto.ServiceHistoryResponse{
		ID: rec.ID, BikeID: rec.BikeID, ServiceIntervalID: rec.ServiceIntervalID,
		DatePerformed: rec.DatePerformed, MileageAtService: rec.MileageAtService,
		Cost: rec.Cost, Notes: rec.Notes, CreatedAt: rec.CreatedAt,
	}
}

func writeRecordError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrRecordNotFound) || errors.Is(err, domain.ErrBikeNotFound):
		utils.WriteError(w, http.StatusNotFound, "not found")
	case errors.Is(err, domain.ErrRecordInvalid) || errors.Is(err, domain.ErrIntervalNotFound):
		utils.WriteError(w, http.StatusBadRequest, "invalid service record")
	case strings.HasPrefix(err.Error(), "forbidden"):
		utils.WriteError(w, http.StatusForbidden, "forbidden")
	default:
		utils.WriteError(w, http.StatusBadRequest, err.Error())
	}
}
