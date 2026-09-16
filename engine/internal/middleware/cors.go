package middleware

import (
	"net/http"
	"os"
	"strings"
)

// CORS is production-grade: exact origin match from CORS_ORIGINS (no wildcard with credentials),
// handles preflight, Vary, Max-Age, and Allow-Credentials correctly.
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowed := parseAllowedOrigins()

		// Only echo allowed origins — never wildcard when credentials are true
		if origin != "" && isAllowedOrigin(origin, allowed) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Length")
		w.Header().Set("Access-Control-Max-Age", "600") // 10 minutes

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func parseAllowedOrigins() []string {
	raw := os.Getenv("CORS_ORIGINS")
	if raw == "" {
		return nil
	}
	var out []string
	for _, o := range strings.Split(raw, ",") {
		if t := strings.TrimSpace(o); t != "" {
			out = append(out, t)
		}
	}
	return out
}

func isAllowedOrigin(origin string, allowed []string) bool {
	for _, a := range allowed {
		if origin == a {
			return true
		}
	}
	return false
}
