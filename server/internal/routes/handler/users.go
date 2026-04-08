package handler

import (
	"load-test/internal/helper"
	"net/http"
	"strconv"
	"strings"
)

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	user, ok := h.Store.Authenticate(bearerToken(r), sessionCookie(r))
	if !ok {
		helper.WriteJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	switch r.Method {
	case http.MethodGet:
		helper.WriteJSON(w, http.StatusOK, user)
		return
	case http.MethodPut:
		var body struct {
			Name  string `json:"name"`
			Phone string `json:"phone"`
		}
		if err := helper.ReadJSON(r, &body); err != nil {
			helper.WriteJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_json"})
			return
		}

		updated, ok := h.Store.UpdateMe(user.ID, body.Name, body.Phone)
		if !ok {
			helper.WriteJSON(w, http.StatusNotFound, map[string]any{"error": "not_found"})
			return
		}
		helper.WriteJSON(w, http.StatusOK, updated)
		return
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
}

func (h *Handler) UserByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/users/")
	idStr = strings.Trim(idStr, "/")
	if idStr == "" || idStr == "me" {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	user, ok := h.Store.GetUserByID(id)
	if !ok {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	helper.WriteJSON(w, http.StatusOK, user)
}

func sessionCookie(r *http.Request) string {
	c, err := r.Cookie("session")
	if err != nil {
		return ""
	}
	return c.Value
}
