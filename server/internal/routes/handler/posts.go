package handler

import (
	"load-test/internal/helper"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// PostByID handles GET /posts/{id}.
func (h *Handler) PostByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	_, ok := h.Store.Authenticate(bearerToken(r), sessionCookie(r))
	if !ok {
		helper.WriteJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/posts/")
	idStr = strings.Trim(idStr, "/")
	if idStr == "" {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	post, ok := h.Store.GetPostByID(id)
	if !ok {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	helper.WriteJSON(w, http.StatusOK, post)
}

// IntentionalServerError returns 500
func (h *Handler) IntentionalServerError(w http.ResponseWriter, r *http.Request) {
	_ = h
	helper.WriteJSON(w, http.StatusInternalServerError, map[string]any{"error": "intentional"})
}

// IntentionalNonJSON returns plain text response
func (h *Handler) IntentionalNonJSON(w http.ResponseWriter, r *http.Request) {
	_ = h
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("plain text response (intentional)"))
}

// IntentionalTimeout sleeps so that a short client timeout
func (h *Handler) IntentionalTimeout(w http.ResponseWriter, r *http.Request) {
	_ = h
	time.Sleep(2 * time.Second)
	helper.WriteJSON(w, http.StatusOK, map[string]any{"ok": true})
}
