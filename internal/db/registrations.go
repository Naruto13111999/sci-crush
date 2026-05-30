package db

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type Registration struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Class     string    `json:"class"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type RegisterInput struct {
	Name  string
	Class string
	Email string
	Phone string
}

func (s *Store) CreateRegistration(ctx context.Context, in RegisterInput) (*Registration, error) {
	name := strings.TrimSpace(in.Name)
	class := strings.TrimSpace(in.Class)
	if class == "" {
		class = "8"
	}
	email := strings.ToLower(strings.TrimSpace(in.Email))
	phone := strings.TrimSpace(in.Phone)

	if name == "" || email == "" || phone == "" {
		return nil, fmt.Errorf("all fields are required")
	}
	if !strings.Contains(email, "@") || len(email) < 5 {
		return nil, fmt.Errorf("invalid email address")
	}
	if len(phone) < 8 {
		return nil, fmt.Errorf("invalid phone number")
	}

	var reg Registration
	err := s.pool.QueryRow(ctx, `
		INSERT INTO registrations (name, class, email, phone)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (email) DO UPDATE SET
			name = EXCLUDED.name,
			class = EXCLUDED.class,
			phone = EXCLUDED.phone,
			updated_at = NOW()
		RETURNING id, name, class, email, phone, created_at, updated_at
	`, name, class, email, phone).Scan(
		&reg.ID, &reg.Name, &reg.Class, &reg.Email, &reg.Phone, &reg.CreatedAt, &reg.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("save registration: %w", err)
	}
	return &reg, nil
}

func (s *Store) EmailIsRegistered(ctx context.Context, email string) (bool, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return false, nil
	}
	var exists bool
	err := s.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM registrations WHERE email = $1)
	`, email).Scan(&exists)
	return exists, err
}

func (s *Store) Login(ctx context.Context, email, name string) (*Registration, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	name = strings.TrimSpace(name)

	if email == "" || name == "" {
		return nil, fmt.Errorf("email and name are required")
	}
	if !strings.Contains(email, "@") || len(email) < 5 {
		return nil, fmt.Errorf("invalid email address")
	}

	var reg Registration
	err := s.pool.QueryRow(ctx, `
		SELECT id, name, class, email, phone, created_at, updated_at
		FROM registrations
		WHERE email = $1
	`, email).Scan(
		&reg.ID, &reg.Name, &reg.Class, &reg.Email, &reg.Phone, &reg.CreatedAt, &reg.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("no account found with this email — please register")
		}
		return nil, fmt.Errorf("lookup registration: %w", err)
	}
	if !strings.EqualFold(strings.TrimSpace(reg.Name), name) {
		return nil, fmt.Errorf("name does not match our records for this email")
	}
	return &reg, nil
}
