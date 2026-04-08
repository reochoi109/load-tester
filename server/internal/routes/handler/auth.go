package handler

import (
	"load-test/internal/helper"
	"net/http"
	"strings"
)

func (h *Handler) Login(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := helper.ReadJSON(req, &body); err != nil {
		helper.WriteJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_json"})
		return
	}

	accessToken, sessionID, _, ok := h.Store.Login(body.Email, body.Password)
	if !ok {
		helper.WriteJSON(w, http.StatusUnauthorized, map[string]any{"error": "invalid_credentials"})
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
	})

	helper.WriteJSON(w, http.StatusOK, map[string]any{
		"accessToken": accessToken,
		"token":       accessToken,
	})
}

func (h *Handler) Logout(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	sessionID := ""
	if c, err := req.Cookie("session"); err == nil && c.Value != "" {
		sessionID = c.Value
	}
	accessToken := bearerToken(req)

	h.Store.Logout(accessToken, sessionID)

	// remove cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	w.WriteHeader(http.StatusNoContent)
}

func bearerToken(req *http.Request) string {
	auth := strings.TrimSpace(req.Header.Get("Authorization"))
	if auth == "" {
		return ""
	}
	const prefix = "Bearer "
	if strings.HasPrefix(auth, prefix) {
		return strings.TrimSpace(strings.TrimPrefix(auth, prefix))
	}
	return auth
}
