import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext, useLocalize } from '~/hooks';
import { useToastContext } from '@librechat/client';
import ArtifactAdminSettings from '../AdminSettings';

// Mock dependencies
jest.mock('~/hooks', () => ({
  useAuthContext: jest.fn(),
  useLocalize: jest.fn(),
}));

jest.mock('@librechat/client', () => ({
  OGDialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog">{children}</div>
  ),
  OGDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  OGDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  OGDialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...props}
    />
  ),
  useToastContext: jest.fn(),
}));

const mockUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>;
const mockUseLocalize = useLocalize as jest.MockedFunction<typeof useLocalize>;
const mockUseToastContext = useToastContext as jest.MockedFunction<typeof useToastContext>;

describe('ArtifactAdminSettings', () => {
  const mockShowToast = jest.fn();
  const mockLocalize = jest.fn((key: string) => key);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalize.mockReturnValue(mockLocalize);
    mockUseToastContext.mockReturnValue({
      showToast: mockShowToast,
    });
  });

  it('should not render for non-admin users', () => {
    mockUseAuthContext.mockReturnValue({
      user: { role: SystemRoles.USER },
      isAuthenticated: true,
      logout: jest.fn(),
    });

    const { container } = render(<ArtifactAdminSettings />);
    expect(container.firstChild).toBeNull();
  });

  it('should render for admin users', () => {
    mockUseAuthContext.mockReturnValue({
      user: { role: SystemRoles.ADMIN },
      isAuthenticated: true,
      logout: jest.fn(),
    });

    render(<ArtifactAdminSettings />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('should display all configuration sections', () => {
    mockUseAuthContext.mockReturnValue({
      user: { role: SystemRoles.ADMIN },
      isAuthenticated: true,
      logout: jest.fn(),
    });

    render(<ArtifactAdminSettings />);

    // Check for section headers
    expect(screen.getByText('com_ui_shared_conversation_settings')).toBeInTheDocument();
    expect(screen.getByText('com_ui_content_processing_settings')).toBeInTheDocument();
    expect(screen.getByText('com_ui_security_settings')).toBeInTheDocument();
    expect(screen.getByText('com_ui_customization_settings')).toBeInTheDocument();
  });

  it('should have all configuration switches', () => {
    mockUseAuthContext.mockReturnValue({
      user: { role: SystemRoles.ADMIN },
      isAuthenticated: true,
      logout: jest.fn(),
    });

    render(<ArtifactAdminSettings />);

    // Check for configuration switches
    const switches = screen.getAllByRole('checkbox');
    expect(switches).toHaveLength(11); // Total number of switches in the component
  });

  it('should handle switch changes', () => {
    mockUseAuthContext.mockReturnValue({
      user: { role: SystemRoles.ADMIN },
      isAuthenticated: true,
      logout: jest.fn(),
    });

    render(<ArtifactAdminSettings />);

    const switches = screen.getAllByRole('checkbox');
    const firstSwitch = switches[0];

    // Initially should be checked (default value is true)
    expect(firstSwitch).toBeChecked();

    // Click to uncheck
    fireEvent.click(firstSwitch);
    expect(firstSwitch).not.toBeChecked();
  });

  it('should handle save button click', () => {
    mockUseAuthContext.mockReturnValue({
      user: { role: SystemRoles.ADMIN },
      isAuthenticated: true,
      logout: jest.fn(),
    });

    render(<ArtifactAdminSettings />);

    const saveButton = screen.getByText('com_ui_save');
    fireEvent.click(saveButton);

    expect(mockShowToast).toHaveBeenCalledWith({
      status: 'success',
      message: 'com_ui_saved',
    });
  });

  it('should use localization for all text', () => {
    mockUseAuthContext.mockReturnValue({
      user: { role: SystemRoles.ADMIN },
      isAuthenticated: true,
      logout: jest.fn(),
    });

    render(<ArtifactAdminSettings />);

    // Verify localize function is called for various keys
    expect(mockLocalize).toHaveBeenCalledWith('com_ui_artifacts_admin');
    expect(mockLocalize).toHaveBeenCalledWith('com_ui_admin_settings');
    expect(mockLocalize).toHaveBeenCalledWith('com_ui_artifacts');
    expect(mockLocalize).toHaveBeenCalledWith('com_ui_save');
  });

  it('should have proper default values', () => {
    mockUseAuthContext.mockReturnValue({
      user: { role: SystemRoles.ADMIN },
      isAuthenticated: true,
      logout: jest.fn(),
    });

    render(<ArtifactAdminSettings />);

    const switches = screen.getAllByRole('checkbox');

    // Most switches should be checked by default (true values)
    switches.forEach((switchElement) => {
      expect(switchElement).toBeChecked();
    });
  });

  it('should log configuration on save', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    mockUseAuthContext.mockReturnValue({
      user: { role: SystemRoles.ADMIN },
      isAuthenticated: true,
      logout: jest.fn(),
    });

    render(<ArtifactAdminSettings />);

    const saveButton = screen.getByText('com_ui_save');
    fireEvent.click(saveButton);

    expect(consoleSpy).toHaveBeenCalledWith('Artifact config update:', expect.any(Object));

    consoleSpy.mockRestore();
  });
});
