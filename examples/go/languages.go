package main

import (
	"errors"
	"strings"
	"sync"
	"unicode/utf8"
)

type Language struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Paradigm string `json:"paradigm"`
	Year     int    `json:"year"`
	Summary  string `json:"summary"`
}

type LanguageInput struct {
	Name     string `json:"name"`
	Paradigm string `json:"paradigm"`
	Year     int    `json:"year"`
	Summary  string `json:"summary"`
}

var (
	ErrInvalid   = errors.New("이름, 패러다임, 연도, 요약이 올바른 범위여야 합니다")
	ErrDuplicate = errors.New("이미 등록된 언어입니다")
)

// Store는 요청 고루틴이 공유합니다. 뮤텍스를 복사하지 않도록 포인터 리시버만 씁니다.
type Store struct {
	mu     sync.Mutex
	items  []Language
	nextID int
}

func NewStore() *Store {
	seed := []Language{
		{ID: 1, Name: "Python", Paradigm: "다중 패러다임", Year: 1991, Summary: "들여쓰기로 블록을 나누고 표준 라이브러리가 넓습니다."},
		{ID: 2, Name: "JavaScript", Paradigm: "다중 패러다임", Year: 1995, Summary: "브라우저와 서버가 같은 언어를 실행합니다."},
		{ID: 3, Name: "Go", Paradigm: "명령형", Year: 2009, Summary: "단순한 문법과 표준 라이브러리 HTTP를 함께 둡니다."},
		{ID: 4, Name: "Rust", Paradigm: "다중 패러다임", Year: 2015, Summary: "소유권으로 메모리 안전을 컴파일할 때 검사합니다."},
		{ID: 5, Name: "TypeScript", Paradigm: "다중 패러다임", Year: 2012, Summary: "JavaScript에 정적 타입과 컴파일 단계를 더합니다."},
		{ID: 6, Name: "Kotlin", Paradigm: "다중 패러다임", Year: 2011, Summary: "JVM에서 null 허용 여부를 타입으로 구분합니다."},
		{ID: 7, Name: "Elixir", Paradigm: "함수형", Year: 2011, Summary: "가벼운 프로세스와 메시지로 동시성을 만듭니다."},
		{ID: 8, Name: "Zig", Paradigm: "명령형", Year: 2016, Summary: "할당자를 호출자가 고르고 오류를 값으로 돌려줍니다."},
		{ID: 9, Name: "Dart", Paradigm: "객체지향", Year: 2011, Summary: "화면과 서버를 한 언어의 타입 시스템으로 작성합니다."},
		{ID: 10, Name: "Haskell", Paradigm: "순수 함수형", Year: 1990, Summary: "순수 함수와 강한 타입으로 부작용을 경계 밖에 둡니다."},
	}
	return &Store{items: seed, nextID: len(seed) + 1}
}

func (s *Store) List() []Language {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Language, len(s.items))
	copy(out, s.items)
	return out
}

func (s *Store) Add(in LanguageInput) (Language, error) {
	name := strings.TrimSpace(in.Name)
	paradigm := strings.TrimSpace(in.Paradigm)
	summary := strings.TrimSpace(in.Summary)
	if name == "" || utf8.RuneCountInString(name) > 40 ||
		paradigm == "" || utf8.RuneCountInString(paradigm) > 40 ||
		summary == "" || utf8.RuneCountInString(summary) > 200 ||
		in.Year < 1950 || in.Year > 2100 {
		return Language{}, ErrInvalid
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, row := range s.items {
		if strings.EqualFold(row.Name, name) {
			return Language{}, ErrDuplicate
		}
	}
	created := Language{
		ID:       s.nextID,
		Name:     name,
		Paradigm: paradigm,
		Year:     in.Year,
		Summary:  summary,
	}
	s.nextID++
	s.items = append(s.items, created)
	return created, nil
}
