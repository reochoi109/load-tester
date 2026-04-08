package handler

import "load-test/internal/store"

type Handler struct {
	Store *store.Store
}

func New(st *store.Store) *Handler {
	return &Handler{Store: st}
}
