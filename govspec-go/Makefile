VERSION ?= 0.1.0
COMMIT  := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
DATE    := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS := -ldflags "-s -w -X main.Version=$(VERSION) -X main.BuildDate=$(DATE) -X main.Commit=$(COMMIT)"

.PHONY: all build build-web build-go clean

all: build-web build-go

build: build-go

build-go:
	go build $(LDFLAGS) -o govspec ./cmd/govspec

build-web:
	cd web && npm install && npm run build
	@if exist cmd\govspec\web rmdir /s /q cmd\govspec\web
	@if [ -d cmd/govspec/web ]; then rm -rf cmd/govspec/web; fi
	@mkdir cmd\govspec\web 2>nul || mkdir -p cmd/govspec/web
	@xcopy web\dist\* cmd\govspec\web\ /s /e /y 2>nul || cp -r web/dist/* cmd/govspec/web/

build-windows:
	set GOOS=windows&& set GOARCH=amd64&& go build $(LDFLAGS) -o govspec.exe ./cmd/govspec

build-linux:
	set GOOS=linux&& set GOARCH=amd64&& go build $(LDFLAGS) -o govspec-linux ./cmd/govspec

build-darwin:
	set GOOS=darwin&& set GOARCH=arm64&& go build $(LDFLAGS) -o govspec-darwin ./cmd/govspec

clean:
	@del /f govspec govspec.exe govspec-linux govspec-darwin 2>nul || rm -f govspec govspec.exe govspec-linux govspec-darwin

dev:
	go run ./cmd/govspec serve --log-level debug
