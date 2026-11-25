package middlewares

import (
	"fmt"
	"strings"
	"time"

	"tumbuhin-backend/models"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims holds custom claims for authenticated Tumbuhin users
type JWTClaims struct {
	UserID       int64  `json:"user_id"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	FullName     string `json:"full_name"`
	Role         string `json:"role"`
	PosyanduName string `json:"posyandu_name"`
	VillageName  string `json:"village_name"`
	jwt.RegisteredClaims
}

// GenerateJWT creates a signed JWT token for the authenticated user
func GenerateJWT(secret string, user models.User) (string, error) {
	claims := JWTClaims{
		UserID:       user.ID,
		Email:        user.Email,
		Phone:        user.Phone,
		FullName:     user.FullName,
		Role:         user.Role,
		PosyanduName: user.PosyanduName,
		VillageName:  user.VillageName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "tumbuhin-clinical-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// RequireAuth validates the Bearer JWT token in the Authorization header
func RequireAuth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			views.Unauthorized(c, "Token otorisasi tidak ditemukan atau format tidak valid")
			c.Abort()
			return
		}

		tokenStr := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		claims := &JWTClaims{}

		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			views.Unauthorized(c, "Sesi login telah berakhir atau token tidak sah")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("user_claims", claims)
		c.Next()
	}
}

// RequireRoles restricts route access to specific RBAC roles
func RequireRoles(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("user_role")
		if !exists {
			views.Forbidden(c, "Peran pengguna tidak terdeteksi")
			c.Abort()
			return
		}

		userRole := fmt.Sprintf("%v", roleVal)
		for _, allowed := range allowedRoles {
			if strings.EqualFold(userRole, allowed) {
				c.Next()
				return
			}
		}

		views.Forbidden(c, fmt.Sprintf("Akses ditolak: Role '%s' tidak memiliki izin ke endpoint ini", userRole))
		c.Abort()
	}
}

// ClaimsFromContext returns the authenticated JWTClaims from Gin context if available.
func ClaimsFromContext(c *gin.Context) *JWTClaims {
	if c == nil {
		return nil
	}
	if claimsVal, exists := c.Get("user_claims"); exists {
		if claims, ok := claimsVal.(*JWTClaims); ok && claims != nil {
			return claims
		}
	}
	return nil
}

// VillageFromContext extracts the authenticated user's village_name or returns fallback.
func VillageFromContext(c *gin.Context, fallback string) string {
	if claims := ClaimsFromContext(c); claims != nil && strings.TrimSpace(claims.VillageName) != "" {
		return strings.TrimSpace(claims.VillageName)
	}
	return fallback
}

// PosyanduFromContext extracts the authenticated user's posyandu_name or returns fallback.
func PosyanduFromContext(c *gin.Context, fallback string) string {
	if claims := ClaimsFromContext(c); claims != nil && strings.TrimSpace(claims.PosyanduName) != "" {
		return strings.TrimSpace(claims.PosyanduName)
	}
	return fallback
}

// UserIDFromContext extracts the authenticated user's numeric ID.
func UserIDFromContext(c *gin.Context) int64 {
	if claims := ClaimsFromContext(c); claims != nil && claims.UserID > 0 {
		return claims.UserID
	}
	if value, exists := c.Get("user_id"); exists {
		switch typed := value.(type) {
		case int64:
			return typed
		case int:
			return int64(typed)
		case float64:
			return int64(typed)
		}
	}
	return 0
}

// UserNameFromContext extracts the authenticated user's full name or returns fallback.
func UserNameFromContext(c *gin.Context, fallback string) string {
	if claims := ClaimsFromContext(c); claims != nil && strings.TrimSpace(claims.FullName) != "" {
		return strings.TrimSpace(claims.FullName)
	}
	return fallback
}
