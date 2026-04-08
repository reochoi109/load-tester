package store

import (
	"load-test/internal/helper"
	"strings"
	"sync"
)

type User struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	Password string `json:"-"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
}

type Post struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Body  string `json:"body"`
}

type Store struct {
	mu sync.RWMutex

	usersByID    map[int]*User
	usersByEmail map[string]*User

	postsByID map[int]*Post

	accessTokens map[string]int // token -> userID
	sessions     map[string]int // sessionID -> userID
}

func NewStore() *Store {
	longBody := makeLongBodyBytes(12000)

	s := &Store{
		usersByID:    map[int]*User{},
		usersByEmail: map[string]*User{},
		postsByID:    map[int]*Post{},
		accessTokens: map[string]int{},
		sessions:     map[string]int{},
	}

	u1 := &User{ID: 1, Email: "user1@example.com", Password: "password123", Name: "Alex", Phone: "010-1234-5678"}
	u2 := &User{ID: 2, Email: "user2@example.com", Password: "password123", Name: "Casey", Phone: "010-2345-6789"}
	u3 := &User{ID: 3, Email: "user3@example.com", Password: "password123", Name: "Jamie", Phone: "010-3456-7890"}

	s.usersByID[u1.ID] = u1
	s.usersByID[u2.ID] = u2
	s.usersByID[u3.ID] = u3

	s.usersByEmail[u1.Email] = u1
	s.usersByEmail[u2.Email] = u2
	s.usersByEmail[u3.Email] = u3

	s.postsByID[101] = &Post{ID: 101, Title: "Post 101", Body: longBody}
	s.postsByID[102] = &Post{ID: 102, Title: "Post 102", Body: longBody}
	s.postsByID[103] = &Post{ID: 103, Title: "Post 103", Body: longBody}
	return s
}

func (s *Store) Login(email, password string) (accessToken, sessionID string, user User, ok bool) {
	email = normalizeEmail(email)

	s.mu.Lock()
	defer s.mu.Unlock()

	u, exists := s.usersByEmail[email]
	if !exists || u.Password != password {
		return "", "", User{}, false
	}

	accessToken = "token_" + helper.RandID(16)
	sessionID = "session_" + helper.RandID(16)

	s.accessTokens[accessToken] = u.ID
	s.sessions[sessionID] = u.ID

	return accessToken, sessionID, *u, true
}

func (s *Store) Logout(accessToken, sessionID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 비어있지 않을 때만 삭제
	if len(accessToken) != 0 {
		delete(s.accessTokens, accessToken)
	}

	if len(sessionID) != 0 {
		delete(s.sessions, sessionID)
	}
}

func (s *Store) Authenticate(accessToken, sessionID string) (user User, ok bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if len(accessToken) != 0 {
		if uid, ok := s.accessTokens[accessToken]; ok {
			if u, ok := s.usersByID[uid]; ok {
				return *u, true
			}
		}
	}

	if len(sessionID) != 0 {
		if uid, ok := s.sessions[sessionID]; ok {
			if u, ok := s.usersByID[uid]; ok {
				return *u, true
			}
		}
	}
	return User{}, false
}

func (s *Store) GetUserByID(id int) (User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	u, ok := s.usersByID[id]
	if !ok {
		return User{}, false
	}
	return *u, true
}

func (s *Store) UpdateMe(userID int, name, phone string) (User, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	u, ok := s.usersByID[userID]
	if !ok {
		return User{}, false
	}

	if name != "" {
		u.Name = name
	}
	if phone != "" {
		u.Phone = phone
	}

	return *u, true
}

func (s *Store) GetPostByID(id int) (Post, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	p, ok := s.postsByID[id]
	if !ok {
		return Post{}, false
	}
	return *p, true
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// 최소 n bytes 길이의 문자열 생성
func makeLongBodyBytes(n int) string {
	if n <= 0 {
		return ""
	}
	const chunk = "lorem ipsum dolor sit amet, consectetur adipiscing elit. "
	var sb strings.Builder
	sb.Grow(n)
	for sb.Len() < n {
		sb.WriteString(chunk)
	}
	s := sb.String()
	if len(s) > n {
		s = s[:n]
	}
	return s
}
