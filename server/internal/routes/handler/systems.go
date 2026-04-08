package handler

import "net/http"

func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	_ = h
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}
