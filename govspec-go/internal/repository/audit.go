package repository

import (
	"database/sql"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/model"
)

type AuditRepo struct {
	db *sql.DB
}

func NewAuditRepo(db *sql.DB) *AuditRepo {
	return &AuditRepo{db: db}
}

func (r *AuditRepo) Create(entry model.AuditLog) error {
	_, err := r.db.Exec(`INSERT INTO audit_log (feature_id, from_status, to_status, changed_by, reason)
		VALUES (?, ?, ?, ?, ?)`,
		entry.FeatureID, entry.FromStatus, entry.ToStatus, entry.ChangedBy, entry.Reason)
	return err
}

func (r *AuditRepo) FindAll(featureID string) ([]model.AuditLog, error) {
	var query string
	var args []interface{}

	if featureID != "" {
		query = `SELECT a.id, a.feature_id, a.from_status, a.to_status, a.changed_by, a.reason, a.created_at,
			COALESCE(f.name, '') as feature_name
			FROM audit_log a LEFT JOIN features f ON a.feature_id = f.id
			WHERE a.feature_id = ? ORDER BY a.created_at DESC`
		args = append(args, featureID)
	} else {
		query = `SELECT a.id, a.feature_id, a.from_status, a.to_status, a.changed_by, a.reason, a.created_at,
			COALESCE(f.name, '') as feature_name
			FROM audit_log a LEFT JOIN features f ON a.feature_id = f.id
			ORDER BY a.created_at DESC`
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []model.AuditLog
	for rows.Next() {
		var l model.AuditLog
		if err := rows.Scan(&l.ID, &l.FeatureID, &l.FromStatus, &l.ToStatus,
			&l.ChangedBy, &l.Reason, &l.CreatedAt, &l.FeatureName); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, rows.Err()
}

func (r *AuditRepo) DeleteByFeature(featureID string) error {
	_, err := r.db.Exec(`DELETE FROM audit_log WHERE feature_id = ?`, featureID)
	return err
}
