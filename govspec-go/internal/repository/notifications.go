package repository

import (
	"database/sql"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/model"
)

type NotificationRepo struct {
	db *sql.DB
}

func NewNotificationRepo(db *sql.DB) *NotificationRepo {
	return &NotificationRepo{db: db}
}

func (r *NotificationRepo) Create(n model.Notification) error {
	_, err := r.db.Exec(`INSERT INTO notifications (feature_id, type, title, message)
		VALUES (?, ?, ?, ?)`,
		n.FeatureID, n.Type, n.Title, n.Message)
	return err
}

func (r *NotificationRepo) FindAll(limit int) ([]model.Notification, error) {
	rows, err := r.db.Query(`SELECT id, feature_id, type, title, message, read, created_at
		FROM notifications ORDER BY created_at DESC LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifs []model.Notification
	for rows.Next() {
		var n model.Notification
		if err := rows.Scan(&n.ID, &n.FeatureID, &n.Type, &n.Title, &n.Message, &n.Read, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifs = append(notifs, n)
	}
	return notifs, rows.Err()
}

func (r *NotificationRepo) UnreadCount() (int, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM notifications WHERE read = 0`).Scan(&count)
	return count, err
}

func (r *NotificationRepo) MarkAllRead() error {
	_, err := r.db.Exec(`UPDATE notifications SET read = 1 WHERE read = 0`)
	return err
}

func (r *NotificationRepo) DeleteByFeature(featureID string) error {
	_, err := r.db.Exec(`DELETE FROM notifications WHERE feature_id = ?`, featureID)
	return err
}
