//go:build linux

package svcmanager

import (
	"fmt"
	"os"
	"os/exec"
)

const systemdUnitPath = "/etc/systemd/system/govspec.service"

func init() {
	platformManager = &linuxManager{}
}

type linuxManager struct{}

func (m *linuxManager) Install() error {
	exePath, err := ExePath()
	if err != nil {
		return err
	}

	unit := fmt.Sprintf(`[Unit]
Description=%s
After=network.target

[Service]
Type=simple
ExecStart=%s serve
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`, ServiceDescription, exePath)

	if err := os.WriteFile(systemdUnitPath, []byte(unit), 0644); err != nil {
		return fmt.Errorf("write unit file: %w (are you running as root?)", err)
	}

	exec.Command("systemctl", "daemon-reload").Run()
	exec.Command("systemctl", "enable", ServiceName).Run()

	fmt.Printf("Service '%s' installed at %s\n", ServiceName, systemdUnitPath)
	fmt.Println("Run 'govspec start' to start the service.")
	return nil
}

func (m *linuxManager) Uninstall() error {
	exec.Command("systemctl", "stop", ServiceName).Run()
	exec.Command("systemctl", "disable", ServiceName).Run()

	if err := os.Remove(systemdUnitPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove unit file: %w", err)
	}

	exec.Command("systemctl", "daemon-reload").Run()
	fmt.Printf("Service '%s' uninstalled.\n", ServiceName)
	return nil
}

func (m *linuxManager) Start() error {
	cmd := exec.Command("systemctl", "start", ServiceName)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("systemctl start failed: %s\n%s", err, string(output))
	}
	fmt.Printf("Service '%s' started.\n", ServiceName)
	return nil
}

func (m *linuxManager) Stop() error {
	cmd := exec.Command("systemctl", "stop", ServiceName)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("systemctl stop failed: %s\n%s", err, string(output))
	}
	fmt.Printf("Service '%s' stopped.\n", ServiceName)
	return nil
}
