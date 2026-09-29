package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func perform(t *testing.T, handler http.Handler, method, target string, body []byte) *httptest.ResponseRecorder {
	t.Helper()
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req := httptest.NewRequest(method, target, reader)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	return rec
}

func decodeLanguages(t *testing.T, rec *httptest.ResponseRecorder) []Language {
	t.Helper()
	var items []Language
	if err := json.Unmarshal(rec.Body.Bytes(), &items); err != nil {
		t.Fatalf("목록 json: %v, 본문 %s", err, rec.Body.String())
	}
	return items
}

func TestGetLanguages(t *testing.T) {
	mux := newMux(NewStore())
	rec := perform(t, mux, http.MethodGet, "/languages", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("상태 %d, 본문 %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Header().Get("Content-Type"), "application/json") {
		t.Fatalf("content-type %s", rec.Header().Get("Content-Type"))
	}
	items := decodeLanguages(t, rec)
	if len(items) != 10 {
		t.Fatalf("개수 %d", len(items))
	}
	if items[0].Name != "Python" || items[9].Name != "Haskell" {
		t.Fatalf("순서 %s ... %s", items[0].Name, items[9].Name)
	}
	items[0].Name = "변경"
	again := decodeLanguages(t, perform(t, mux, http.MethodGet, "/languages", nil))
	if again[0].Name != "Python" {
		t.Fatal("반환 슬라이스 수정이 저장소에 반영되었습니다")
	}
}

func TestPostLanguage(t *testing.T) {
	mux := newMux(NewStore())
	body := []byte(`{"name":"OCaml","paradigm":"함수형","year":1996,"summary":"강한 타입의 ML 계열 언어"}`)
	rec := perform(t, mux, http.MethodPost, "/languages", body)
	if rec.Code != http.StatusCreated {
		t.Fatalf("상태 %d, 본문 %s", rec.Code, rec.Body.String())
	}
	var created Language
	if err := json.Unmarshal(rec.Body.Bytes(), &created); err != nil {
		t.Fatal(err)
	}
	if created.ID != 11 || created.Name != "OCaml" {
		t.Fatalf("생성 결과 %+v", created)
	}

	items := decodeLanguages(t, perform(t, mux, http.MethodGet, "/languages", nil))
	if len(items) != 11 || items[10].Name != "OCaml" {
		t.Fatalf("추가 후 목록 길이 %d", len(items))
	}

	dup := perform(t, mux, http.MethodPost, "/languages", []byte(`{"name":"ocaml","paradigm":"함수형","year":1996,"summary":"대소문자만 다릅니다"}`))
	if dup.Code != http.StatusConflict {
		t.Fatalf("중복 상태 %d, 본문 %s", dup.Code, dup.Body.String())
	}

	invalid := perform(t, mux, http.MethodPost, "/languages", []byte(`{"name":" ","paradigm":"함수형","year":1949,"summary":"짧음"}`))
	if invalid.Code != http.StatusBadRequest {
		t.Fatalf("잘못된 입력 상태 %d", invalid.Code)
	}

	unknown := perform(t, mux, http.MethodPost, "/languages", []byte(`{"id":99,"name":"Scheme","paradigm":"함수형","year":1975,"summary":"id는 서버가 정합니다"}`))
	if unknown.Code != http.StatusBadRequest {
		t.Fatalf("알 수 없는 필드 상태 %d", unknown.Code)
	}

	broken := perform(t, mux, http.MethodPost, "/languages", []byte(`{`))
	if broken.Code != http.StatusBadRequest {
		t.Fatalf("깨진 json 상태 %d", broken.Code)
	}
}

func TestKoreanNameUsesRuneCount(t *testing.T) {
	mux := newMux(NewStore())
	okName := strings.Repeat("가", 40)
	okBody := []byte(fmt.Sprintf(`{"name":"%s","paradigm":"시험","year":2000,"summary":"룬 40자는 허용됩니다"}`, okName))
	ok := perform(t, mux, http.MethodPost, "/languages", okBody)
	if ok.Code != http.StatusCreated {
		t.Fatalf("40룬 상태 %d, 본문 %s", ok.Code, ok.Body.String())
	}
	longName := strings.Repeat("나", 41)
	longBody := []byte(fmt.Sprintf(`{"name":"%s","paradigm":"시험","year":2000,"summary":"룬 41자는 거절됩니다"}`, longName))
	long := perform(t, mux, http.MethodPost, "/languages", longBody)
	if long.Code != http.StatusBadRequest {
		t.Fatalf("41룬 상태 %d", long.Code)
	}
}
