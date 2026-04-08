package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/coder/websocket"
)

func (h *Handler) WSEchoCoder(w http.ResponseWriter, r *http.Request) {
	c, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{"*"},
	})
	if err != nil {
		return
	}
	trackID := h.trackCoderConn(c)
	defer h.ws.untrack(trackID)
	defer c.Close(websocket.StatusNormalClosure, "bye")

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	go func() {
		t := time.NewTicker(10 * time.Second)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				_ = c.Ping(ctx)
			}
		}
	}()

	for {
		readCtx, cancelRead := context.WithTimeout(ctx, 30*time.Second)
		mt, data, err := c.Read(readCtx)
		cancelRead()
		if err != nil {
			return
		}

		writeCtx, cancelWrite := context.WithTimeout(ctx, 10*time.Second)
		err = c.Write(writeCtx, mt, data)
		cancelWrite()
		if err != nil {
			return
		}
	}

}
