//go:build windows

package svcmanager

import (
	"fmt"
	"os/exec"
)

func init() {
	platformManager = &windowsManager{}
}

type windowsManager struct{}

func (m *windowsManager) Install() error {
	exePath, err := ExePath()
	if err != nil {
		return err
	}

	cmd := exec.Command("sc", "create", ServiceName,
		fmt.Sprintf("binPath= \"%s\" serve", exePath),
		fmt.Sprintf("DisplayName= %s", ServiceDisplayName),
		"start= auto",
		"obj= LocalSystem")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("sc create failed: %s\n%s", err, string(output))
	}

	exec.Command("sc", "description", ServiceName, ServiceDescription).CombinedOutput()
	exec.Command("sc", "failure", ServiceName, "reset= 86400", "actions= restart/5000/restart/10000/restart/30000").CombinedOutput()

	fmt.Printf("Service '%s' installed successfully.\n", ServiceName)
	fmt.Println("Run 'govspec start' to start the service.")
	return nil
}

func (m *windowsManager) Uninstall() error {
	exec.Command("sc", "stop", ServiceName).CombinedOutput()

	cmd := exec.Command("sc", "delete", ServiceName)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("sc delete failed: %s\n%s", err, string(output))
	}

	fmt.Printf("Service '%s' uninstalled successfully.\n", ServiceName)
	return nil
}

func (m *windowsManager) Start() error {
	cmd := exec.Command("sc", "start", ServiceName)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("sc start failed: %s\n%s", err, string(output))
	}
	fmt.Printf("Service '%s' started.\n", ServiceName)
	return nil
}

func (m *windowsManager) Stop() error {
	cmd := exec.Command("sc", "stop", ServiceName)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("sc stop failed: %s\n%s", err, string(output))
	}
	fmt.Printf("Service '%s' stopped.\n", ServiceName)
	return nil
}
