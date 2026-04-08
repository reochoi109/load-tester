package handler

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/coder/websocket"
)

type coderChatHub struct {
	mu      sync.RWMutex
	clients map[*coderChatClient]struct{}
}

type coderChatClient struct {
	conn *websocket.Conn
	send chan []byte
}

func newCoderChatHub() *coderChatHub {
	return &coderChatHub{
		clients: map[*coderChatClient]struct{}{},
	}
}

type coderChatRooms struct {
	mu    sync.RWMutex
	rooms map[string]*coderChatHub
}

func newCoderChatRooms() *coderChatRooms {
	return &coderChatRooms{
		rooms: map[string]*coderChatHub{},
	}
}

func (r *coderChatRooms) get(room string) *coderChatHub {
	r.mu.Lock()
	defer r.mu.Unlock()
	if room == "" {
		room = "lobby"
	}
	h, ok := r.rooms[room]
	if !ok {
		h = newCoderChatHub()
		r.rooms[room] = h
	}
	return h
}

func (r *coderChatRooms) closeAll() {
	r.mu.RLock()
	rooms := make([]*coderChatHub, 0, len(r.rooms))
	for _, h := range r.rooms {
		rooms = append(rooms, h)
	}
	r.mu.RUnlock()
	for _, h := range rooms {
		h.closeAll()
	}
}

func (h *coderChatHub) add(c *coderChatClient) {
	h.mu.Lock()
	h.clients[c] = struct{}{}
	h.mu.Unlock()
}

func (h *coderChatHub) remove(c *coderChatClient) {
	h.mu.Lock()
	delete(h.clients, c)
	h.mu.Unlock()
	close(c.send)
}

func (h *coderChatHub) broadcast(msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for c := range h.clients {
		// Non-blocking send: under overload we drop messages instead of stalling all writers.
		select {
		case c.send <- msg:
		default:
		}
	}
}

func (h *coderChatHub) closeAll() {
	h.mu.Lock()
	clients := make([]*coderChatClient, 0, len(h.clients))
	for c := range h.clients {
		clients = append(clients, c)
		delete(h.clients, c)
	}
	h.mu.Unlock()

	for _, c := range clients {
		_ = c.conn.Close(websocket.StatusGoingAway, "server shutdown")
		func() {
			defer func() { _ = recover() }()
			close(c.send)
		}()
	}
}

func (h *Handler) WSChatCoder(w http.ResponseWriter, r *http.Request) {
	c, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{"*"},
	})
	if err != nil {
		return
	}
	trackID := h.trackCoderConn(c)
	defer h.ws.untrack(trackID)

	client := &coderChatClient{
		conn: c,
		send: make(chan []byte, 128),
	}
	room := r.URL.Query().Get("room")
	hub := h.coderChat.get(room)
	hub.add(client)

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	// Writer loop (single goroutine per conn)
	go func() {
		defer c.Close(websocket.StatusNormalClosure, "bye")
		for msg := range client.send {
			writeCtx, cancelWrite := context.WithTimeout(ctx, 10*time.Second)
			_ = c.Write(writeCtx, websocket.MessageText, msg)
			cancelWrite()
		}
	}()

	// Reader loop
	for {
		readCtx, cancelRead := context.WithTimeout(ctx, 60*time.Second)
		_, data, err := c.Read(readCtx)
		cancelRead()
		if err != nil {
			hub.remove(client)
			return
		}
		hub.broadcast(data)
	}
}
