package handler

import (
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

func (h *Handler) WSEchoGorilla(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	trackID := h.trackGorillaConn(conn)
	defer h.ws.untrack(trackID)
	defer conn.Close()

	_ = conn.SetReadDeadline(time.Now().Add(30 * time.Second))
	conn.SetPongHandler(func(appData string) error {
		_ = conn.SetReadDeadline(time.Now().Add(30 * time.Second))
		return nil
	})

	for {
		mt, msg, err := conn.ReadMessage()
		if err != nil {
			return
		}
		if err := conn.WriteMessage(mt, msg); err != nil {
			return
		}
	}
}
