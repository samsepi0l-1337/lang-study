package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
)

func newMux(store *Store) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /languages", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, store.List())
	})
	mux.HandleFunc("POST /languages", func(w http.ResponseWriter, r *http.Request) {
		var in LanguageInput
		dec := json.NewDecoder(r.Body)
		dec.DisallowUnknownFields()
		if err := dec.Decode(&in); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON 본문을 해석할 수 없습니다"})
			return
		}
		created, err := store.Add(in)
		if errors.Is(err, ErrInvalid) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		if errors.Is(err, ErrDuplicate) {
			writeJSON(w, http.StatusConflict, map[string]string{"error": err.Error()})
			return
		}
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "저장에 실패했습니다"})
			return
		}
		writeJSON(w, http.StatusCreated, created)
	})
	return mux
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		log.Printf("json encode: %v", err)
	}
}

func listenAddr() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8090"
	}
	return ":" + port
}

func main() {
	addr := listenAddr()
	log.Printf("언어 등록 서버 수신: %s", addr)
	if err := http.ListenAndServe(addr, newMux(NewStore())); err != nil {
		log.Fatal(err)
	}
}
