/**
 * Unit Tests for PersonalInfoCard Component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PersonalInfoCard from '../PersonalInfoCard';

describe('PersonalInfoCard', () => {
  const mockProfileData = {
    full_name: 'John Doe',
    country: 'UAE',
    city: 'Dubai',
    address: '123 Main St',
    accommodation_type: 'apartment',
    religion: 'Islam',
  };

  const mockSectionAnimation = () => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  });

  const defaultProps = {
    profileData: mockProfileData,
    isEditing: false,
    avatarPreview: null,
    avatarFile: null,
    onProfileChange: vi.fn(),
    onAvatarChange: vi.fn(),
    sectionAnimation: mockSectionAnimation,
  };

  it('should render personal information fields', () => {
    render(<PersonalInfoCard {...defaultProps} />);

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('UAE')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dubai')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
  });

  it('should disable inputs when not editing', () => {
    render(<PersonalInfoCard {...defaultProps} />);

    const nameInput = screen.getByDisplayValue('John Doe');
    expect(nameInput).toBeDisabled();
  });

  it('should enable inputs when editing', () => {
    render(<PersonalInfoCard {...defaultProps} isEditing={true} />);

    const nameInput = screen.getByDisplayValue('John Doe');
    expect(nameInput).not.toBeDisabled();
  });

  it('should call onProfileChange when input changes', () => {
    const mockOnChange = vi.fn();
    render(
      <PersonalInfoCard
        {...defaultProps}
        isEditing={true}
        onProfileChange={mockOnChange}
      />
    );

    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should display avatar preview when provided', () => {
    const avatarUrl = 'https://example.com/avatar.jpg';
    render(
      <PersonalInfoCard {...defaultProps} avatarPreview={avatarUrl} />
    );

    const avatarImg = screen.getByAltText('Profile');
    expect(avatarImg).toHaveAttribute('src', avatarUrl);
  });

  it('should show default avatar icon when no preview', () => {
    const { container } = render(<PersonalInfoCard {...defaultProps} />);

    // Check for the gradient background div that contains the default avatar
    const defaultAvatar = container.querySelector('.from-blue-100');
    expect(defaultAvatar).toBeInTheDocument();
  });

  it('should show upload button when editing', () => {
    render(<PersonalInfoCard {...defaultProps} isEditing={true} />);

    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
  });

  it('should show "Change Photo" when avatar exists and editing', () => {
    render(
      <PersonalInfoCard
        {...defaultProps}
        isEditing={true}
        avatarPreview="https://example.com/avatar.jpg"
      />
    );

    expect(screen.getByText('Change Photo')).toBeInTheDocument();
  });

  it('should show badge when new avatar file is selected', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    render(
      <PersonalInfoCard
        {...defaultProps}
        isEditing={true}
        avatarFile={mockFile}
      />
    );

    expect(screen.getByText('New photo ready')).toBeInTheDocument();
  });

  it('should display religion select label', () => {
    render(<PersonalInfoCard {...defaultProps} isEditing={true} />);

    // Check that the religion label is present
    expect(screen.getByText('Religion')).toBeInTheDocument();
  });

  it('should display accommodation type select label', () => {
    render(<PersonalInfoCard {...defaultProps} isEditing={true} />);

    // Check that the accommodation type label is present
    expect(screen.getByText('Accommodation Type')).toBeInTheDocument();
  });

  it('should show message when no avatar uploaded and not editing', () => {
    render(<PersonalInfoCard {...defaultProps} isEditing={false} avatarPreview={null} />);

    expect(screen.getByText('No profile picture uploaded')).toBeInTheDocument();
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(<PersonalInfoCard {...defaultProps} isEditing={true} />);

    const fileInput = document.querySelector('#avatar-upload');
    expect(fileInput).toHaveAttribute('aria-label', 'Select profile photo file');
    expect(fileInput).toHaveAttribute('aria-describedby', 'avatar-upload-help');
  });
});
