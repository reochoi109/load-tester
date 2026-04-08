package handler

import (
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type gorillaChatHub struct {
	mu      sync.RWMutex
	clients map[*gorillaChatClient]struct{}
}

type gorillaChatClient struct {
	conn *websocket.Conn
	send chan []byte
}

func newGorillaChatHub() *gorillaChatHub {
	return &gorillaChatHub{
		clients: map[*gorillaChatClient]struct{}{},
	}
}

type gorillaChatRooms struct {
	mu    sync.RWMutex
	rooms map[string]*gorillaChatHub
}

func newGorillaChatRooms() *gorillaChatRooms {
	return &gorillaChatRooms{
		rooms: map[string]*gorillaChatHub{},
	}
}

func (r *gorillaChatRooms) get(room string) *gorillaChatHub {
	r.mu.Lock()
	defer r.mu.Unlock()
	if room == "" {
		room = "lobby"
	}
	h, ok := r.rooms[room]
	if !ok {
		h = newGorillaChatHub()
		r.rooms[room] = h
	}
	return h
}

func (r *gorillaChatRooms) closeAll() {
	r.mu.RLock()
	rooms := make([]*gorillaChatHub, 0, len(r.rooms))
	for _, h := range r.rooms {
		rooms = append(rooms, h)
	}
	r.mu.RUnlock()
	for _, h := range rooms {
		h.closeAll()
	}
}

func (h *gorillaChatHub) add(c *gorillaChatClient) {
	h.mu.Lock()
	h.clients[c] = struct{}{}
	h.mu.Unlock()
}

func (h *gorillaChatHub) remove(c *gorillaChatClient) {
	h.mu.Lock()
	delete(h.clients, c)
	h.mu.Unlock()
	close(c.send)
}

func (h *gorillaChatHub) broadcast(msg []byte) {
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

func (h *gorillaChatHub) closeAll() {
	h.mu.Lock()
	clients := make([]*gorillaChatClient, 0, len(h.clients))
	for c := range h.clients {
		clients = append(clients, c)
		delete(h.clients, c)
	}
	h.mu.Unlock()

	for _, c := range clients {
		_ = c.conn.Close()
		// Safe close (may already be closed by remove()).
		func() {
			defer func() { _ = recover() }()
			close(c.send)
		}()
	}
}

func (h *Handler) WSChatGorilla(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	trackID := h.trackGorillaConn(conn)
	defer h.ws.untrack(trackID)

	client := &gorillaChatClient{
		conn: conn,
		send: make(chan []byte, 128),
	}
	room := r.URL.Query().Get("room")
	hub := h.gorillaChat.get(room)
	hub.add(client)

	go func() {
		defer conn.Close()
		for msg := range client.send {
			_ = conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}()

	// Reader loop
	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			hub.remove(client)
			_ = conn.Close()
			return
		}
		hub.broadcast(msg)
	}
}
