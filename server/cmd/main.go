package main

import (
	"log"
	"net/http"

	"load-test/internal/middleware"
	"load-test/internal/routes"
	"load-test/internal/store"
)

func main() {
	logger := log.Default()
	logger.Println("Start Load Test")

	st := store.NewStore()
	handler := routes.Open(st)
	handler = middleware.Logger(logger, handler)

	logger.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		logger.Fatalf("server failed: %v", err)
	}
}
