package handler

import (
	"sync"

	coderws "github.com/coder/websocket"
	"github.com/gorilla/websocket"
)

// wsRegistry tracks all websocket connections (echo + chat) so we can force-close
// hijacked connections during server shutdown.
type wsRegistry struct {
	mu      sync.Mutex
	nextID  uint64
	closers map[uint64]func()
}

func newWSRegistry() *wsRegistry {
	return &wsRegistry{
		closers: map[uint64]func(){},
	}
}

func (r *wsRegistry) track(closeFn func()) uint64 {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.nextID++
	id := r.nextID
	r.closers[id] = closeFn
	return id
}

func (r *wsRegistry) untrack(id uint64) {
	r.mu.Lock()
	delete(r.closers, id)
	r.mu.Unlock()
}

func (r *wsRegistry) closeAll() {
	r.mu.Lock()
	closers := make([]func(), 0, len(r.closers))
	for _, c := range r.closers {
		closers = append(closers, c)
	}
	// Clear registry so repeated Close() calls are cheap.
	r.closers = map[uint64]func(){}
	r.mu.Unlock()

	for _, c := range closers {
		c()
	}
}

func (h *Handler) trackGorillaConn(c *websocket.Conn) uint64 {
	return h.ws.track(func() {
		_ = c.Close()
	})
}

func (h *Handler) trackCoderConn(c *coderws.Conn) uint64 {
	return h.ws.track(func() {
		_ = c.Close(coderws.StatusGoingAway, "server shutdown")
	})
}

// Close closes all active websocket connections and chat client send loops.
// Call this before http.Server.Shutdown() so hijacked connections don't keep the process alive.
func (h *Handler) Close() {
	// Close all conns first; reader/writer goroutines should exit on errors.
	if h.ws != nil {
		h.ws.closeAll()
	}
	// Close chat hubs to stop writer loops waiting on send channels.
	if h.gorillaChat != nil {
		h.gorillaChat.closeAll()
	}
	if h.coderChat != nil {
		h.coderChat.closeAll()
	}
}
