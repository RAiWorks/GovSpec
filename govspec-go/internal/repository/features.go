package repository

import (
	"database/sql"
	"time"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/model"
)

type FeatureRepo struct {
	db *sql.DB
}

func NewFeatureRepo(db *sql.DB) *FeatureRepo {
	return &FeatureRepo{db: db}
}

func (r *FeatureRepo) FindAll() ([]model.Feature, error) {
	rows, err := r.db.Query(`SELECT id, name, status, priority, depends_on, requested_by,
		requested_at, approved_at, rejected_at, completed_at, related_docs, notes,
		created_at, updated_at FROM features ORDER BY id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var features []model.Feature
	for rows.Next() {
		f, err := scanFeature(rows)
		if err != nil {
			return nil, err
		}
		features = append(features, f)
	}
	return features, rows.Err()
}

func (r *FeatureRepo) FindByID(id string) (*model.Feature, error) {
	row := r.db.QueryRow(`SELECT id, name, status, priority, depends_on, requested_by,
		requested_at, approved_at, rejected_at, completed_at, related_docs, notes,
		created_at, updated_at FROM features WHERE id = ?`, id)

	f, err := scanFeatureRow(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *FeatureRepo) Upsert(f model.Feature) error {
	_, err := r.db.Exec(`INSERT INTO features (id, name, status, priority, depends_on, requested_by,
		requested_at, approved_at, rejected_at, completed_at, related_docs, notes, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			name=excluded.name, status=excluded.status, priority=excluded.priority,
			depends_on=excluded.depends_on, requested_by=excluded.requested_by,
			requested_at=excluded.requested_at, approved_at=excluded.approved_at,
			rejected_at=excluded.rejected_at, completed_at=excluded.completed_at,
			related_docs=excluded.related_docs, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`,
		f.ID, f.Name, f.Status, f.Priority, f.DependsOn, f.RequestedBy,
		f.RequestedAt, f.ApprovedAt, f.RejectedAt, f.CompletedAt,
		f.RelatedDocs, f.Notes, f.CreatedAt, f.UpdatedAt)
	return err
}

func (r *FeatureRepo) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM features WHERE id = ?`, id)
	return err
}

func (r *FeatureRepo) AllIDs() ([]string, error) {
	rows, err := r.db.Query(`SELECT id FROM features`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *FeatureRepo) FindByDependency(depID string) ([]model.Feature, error) {
	rows, err := r.db.Query(`SELECT id, name, status, priority, depends_on, requested_by,
		requested_at, approved_at, rejected_at, completed_at, related_docs, notes,
		created_at, updated_at FROM features WHERE depends_on LIKE ? AND status NOT IN ('rejected', 'completed')`,
		"%"+depID+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var features []model.Feature
	for rows.Next() {
		f, err := scanFeature(rows)
		if err != nil {
			return nil, err
		}
		features = append(features, f)
	}
	return features, rows.Err()
}

func scanFeature(rows *sql.Rows) (model.Feature, error) {
	var f model.Feature
	err := rows.Scan(&f.ID, &f.Name, &f.Status, &f.Priority, &f.DependsOn,
		&f.RequestedBy, &f.RequestedAt, &f.ApprovedAt, &f.RejectedAt,
		&f.CompletedAt, &f.RelatedDocs, &f.Notes, &f.CreatedAt, &f.UpdatedAt)
	return f, err
}

func scanFeatureRow(row *sql.Row) (model.Feature, error) {
	var f model.Feature
	err := row.Scan(&f.ID, &f.Name, &f.Status, &f.Priority, &f.DependsOn,
		&f.RequestedBy, &f.RequestedAt, &f.ApprovedAt, &f.RejectedAt,
		&f.CompletedAt, &f.RelatedDocs, &f.Notes, &f.CreatedAt, &f.UpdatedAt)
	return f, err
}

// Ensure time import is used
var _ = time.Now
