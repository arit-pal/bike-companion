package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/arit-pal/bike-companion/engine/internal/config"
	"github.com/arit-pal/bike-companion/engine/pkg/utils"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const userIDKey contextKey = "userID"

// Auth validates JWT from Authorization: Bearer <token> and injects userID into context.
// Public routes must NOT use this middleware.
func Auth(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if auth == "" {
				utils.WriteError(w, http.StatusUnauthorized, "missing token")
				return
			}
			parts := strings.SplitN(auth, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
				utils.WriteError(w, http.StatusUnauthorized, "invalid token format")
				return
			}
			tokenStr := strings.TrimSpace(parts[1])
			if tokenStr == "" {
				utils.WriteError(w, http.StatusUnauthorized, "missing token")
				return
			}

			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(cfg.JWTSecret), nil
			})
			if err != nil || !token.Valid {
				utils.WriteError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				utils.WriteError(w, http.StatusUnauthorized, "invalid claims")
				return
			}
			sub, ok := claims["sub"].(string)
			if !ok || sub == "" {
				utils.WriteError(w, http.StatusUnauthorized, "invalid token subject")
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, sub)
			// Also support legacy string key for handlers that use "userID"
			ctx = context.WithValue(ctx, "userID", sub)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// UserIDFromContext extracts userID set by Auth middleware.
func UserIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(userIDKey).(string)
	if ok && v != "" {
		return v, true
	}
	// fallback to string key
	s, ok := ctx.Value("userID").(string)
	return s, ok && s != ""
}
