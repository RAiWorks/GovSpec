package server

import (
	"context"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/handler"
	"github.com/RAiWorks/GovSpec/govspec-go/internal/markdown"
	"github.com/RAiWorks/GovSpec/govspec-go/internal/model"
	"github.com/RAiWorks/GovSpec/govspec-go/internal/repository"
	"github.com/RAiWorks/GovSpec/govspec-go/internal/service"
)

// Server holds the HTTP server and all dependencies.
type Server struct {
	cfg    *model.Config
	router *chi.Mux
	webFS  fs.FS
}

// New creates a new Server with all dependencies wired up.
func New(cfg *model.Config, webFS fs.FS) (*Server, error) {
	// Open database
	db, err := repository.Open(cfg.DBPath)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	// Create repos
	featureRepo := repository.NewFeatureRepo(db)
	auditRepo := repository.NewAuditRepo(db)
	notifRepo := repository.NewNotificationRepo(db)
	metaRepo := repository.NewMetaRepo(db)

	// Create markdown parser
	parser := markdown.NewParser(cfg.DocsPath)

	// Create services
	syncSvc := service.NewSyncService(parser, featureRepo, auditRepo, notifRepo, metaRepo)

	// Initial sync
	result, err := syncSvc.SyncFromMarkdown()
	if err != nil {
		slog.Warn("initial sync failed", "error", err)
	} else {
		slog.Info("initial sync complete", "features", result.FeaturesSync, "governance", result.GovernanceVersion)
	}

	// Create handlers
	featureHandler := handler.NewFeatureHandler(featureRepo, auditRepo, notifRepo, parser, syncSvc)
	auditHandler := handler.NewAuditHandler(auditRepo)
	notifHandler := handler.NewNotificationHandler(notifRepo)
	syncHandler := handler.NewSyncHandler(syncSvc)
	govHandler := handler.NewGovernanceHandler(parser)

	// Build router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(slogMiddleware)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", handler.Health)
		r.Get("/features", featureHandler.ListFeatures)
		r.Post("/features", featureHandler.CreateFeature)
		r.Get("/features/{id}", featureHandler.GetFeature)
		r.Put("/features/{id}/status", featureHandler.UpdateStatus)
		r.Get("/audit", auditHandler.ListAuditLogs)
		r.Get("/notifications", notifHandler.ListNotifications)
		r.Put("/notifications/read", notifHandler.MarkAllRead)
		r.Post("/sync", syncHandler.TriggerSync)
		r.Get("/governance", govHandler.GetGovernance)
	})

	// Serve embedded SPA for all other routes
	if webFS != nil {
		fileServer := http.FileServerFS(webFS)
		r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
			// Try to serve the file directly
			path := strings.TrimPrefix(r.URL.Path, "/")
			if path == "" {
				path = "index.html"
			}

			// Check if file exists in the embedded FS
			if f, err := webFS.Open(path); err == nil {
				f.Close()
				fileServer.ServeHTTP(w, r)
				return
			}

			// Fallback to index.html for SPA routing
			r.URL.Path = "/"
			fileServer.ServeHTTP(w, r)
		})
	}

	return &Server{cfg: cfg, router: r, webFS: webFS}, nil
}

// Run starts the HTTP server and blocks until shutdown.
func (s *Server) Run() error {
	addr := fmt.Sprintf("127.0.0.1:%d", s.cfg.Port)

	srv := &http.Server{
		Addr:         addr,
		Handler:      s.router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		slog.Info("GovSpec server starting", "addr", addr, "url", fmt.Sprintf("http://%s", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-done
	slog.Info("shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		return fmt.Errorf("shutdown: %w", err)
	}

	slog.Info("server stopped")
	return nil
}

func slogMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r)
		slog.Debug("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", ww.Status(),
			"duration", time.Since(start).String(),
		)
	})
}
