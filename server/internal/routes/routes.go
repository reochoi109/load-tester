package routes

import (
	"net/http"

	"load-test/internal/routes/handler"
)

func Open(h *handler.Handler) http.Handler {
	mux := http.NewServeMux()

	// System
	mux.HandleFunc("/health", h.HealthCheck)

	// Auth
	mux.HandleFunc("/auth/login", h.Login)
	mux.HandleFunc("/auth/logout", h.Logout)

	// Users
	mux.HandleFunc("/users/me", h.Me)     // GET/PUT
	mux.HandleFunc("/users/", h.UserByID) // GET /users/{id}

	// Posts
	mux.HandleFunc("/posts/", h.PostByID) // GET /posts/{id}

	// Intentional error endpoints
	mux.HandleFunc("/__server_error__", h.IntentionalServerError)
	mux.HandleFunc("/__non_json__", h.IntentionalNonJSON)
	mux.HandleFunc("/__timeout__", h.IntentionalTimeout)

	// WebSocket
	mux.HandleFunc("/ws/echo/gorilla", h.WSEchoGorilla)
	mux.HandleFunc("/ws/echo/coder", h.WSEchoCoder)
	mux.HandleFunc("/ws/chat/gorilla", h.WSChatGorilla)
	mux.HandleFunc("/ws/chat/coder", h.WSChatCoder)
	return mux
}
