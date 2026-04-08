package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"load-test/internal/middleware"
	"load-test/internal/routes"
	"load-test/internal/routes/handler"
	"load-test/internal/store"
)

func main() {
	logger := log.Default()
	logger.Println("Start Load Test")

	// Root context canceled on SIGINT/SIGTERM.
	rootCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	st := store.NewStore()
	h := handler.New(st)
	httpHandler := routes.Open(h)
	httpHandler = middleware.Logger(logger, httpHandler)

	srv := &http.Server{
		Addr:    ":8080",
		Handler: httpHandler,
		BaseContext: func(net.Listener) context.Context {
			return rootCtx
		},
	}

	go func() {
		<-rootCtx.Done()
		logger.Println("Shutdown signal received")

		h.Close()

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(ctx)
	}()

	logger.Println("Server starting on :8080")
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatalf("server failed: %v", err)
	}
}
