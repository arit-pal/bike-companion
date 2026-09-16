package handler

import (
	"net/http"

	"github.com/arit-pal/bike-companion/engine/pkg/utils"
)

// Health returns 200 when the server is up.
func Health(w http.ResponseWriter, r *http.Request) {
	utils.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
