package repository

import "database/sql"

type MetaRepo struct {
	db *sql.DB
}

func NewMetaRepo(db *sql.DB) *MetaRepo {
	return &MetaRepo{db: db}
}

func (r *MetaRepo) Set(key, value string) error {
	_, err := r.db.Exec(`INSERT INTO govspec_meta (key, value) VALUES (?, ?)
		ON CONFLICT(key) DO UPDATE SET value=excluded.value`, key, value)
	return err
}

func (r *MetaRepo) Get(key string) (string, error) {
	var value string
	err := r.db.QueryRow(`SELECT value FROM govspec_meta WHERE key = ?`, key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return value, err
}
