package handler

import "load-test/internal/store"

type Handler struct {
	Store *store.Store

	// WebSocket chat hubs (broadcast to all connected clients).
	gorillaChat *gorillaChatRooms
	coderChat   *coderChatRooms

	ws *wsRegistry
}

func New(st *store.Store) *Handler {
	return &Handler{
		Store:       st,
		gorillaChat: newGorillaChatRooms(),
		coderChat:   newCoderChatRooms(),
		ws:          newWSRegistry(),
	}
}
