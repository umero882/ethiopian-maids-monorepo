import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderComponent } from '@/utils/testUtils.jsx';
import MaidCard from '../MaidCard';
import { vi } from 'vitest';

const mockMaid = {
  id: 1,
  name: 'Test Maid',
  full_name: 'Test Maid',
  image: '/test-image.jpg',
  nationality: 'Ethiopia',
  experience_years: 3,
  skills: ['Cooking', 'Cleaning'],
  languages: ['English', 'Amharic'],
  availability_status: 'available',
  preferred_salary_min: 300,
  preferred_salary_max: 400,
  preferred_currency: 'USD',
  current_location: 'Dubai',
};

// Agency-managed maid for testing contact button
const mockAgencyMaid = {
  ...mockMaid,
  is_agency_managed: true,
};

const mockNavigate = vi.fn();
const mockOnContact = vi.fn();
const mockOnBookNow = vi.fn();

describe('MaidCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders maid information correctly', () => {
    renderComponent(
      <MaidCard
        maid={mockMaid}
        index={0}
        onContact={mockOnContact}
        onBookNow={mockOnBookNow}
        user={{ id: 'user1' }}
        navigate={mockNavigate}
      />
    );

    expect(screen.getByText('Test Maid')).toBeInTheDocument();
    // Check for experience display
    expect(screen.getByText('3+ yrs exp')).toBeInTheDocument();
    // Check for skills (component shows first 2)
    expect(screen.getByText('Cooking, Cleaning')).toBeInTheDocument();
    // Check for languages (component shows first 2)
    expect(screen.getByText('English, Amharic')).toBeInTheDocument();
    // Check for salary - component formats as min-max/mo
    expect(screen.getByText('$300-400/mo')).toBeInTheDocument();
  });

  test('calls onContact when contact button is clicked (agency maid)', () => {
    renderComponent(
      <MaidCard
        maid={mockAgencyMaid}
        index={0}
        onContact={mockOnContact}
        onBookNow={mockOnBookNow}
        user={{ id: 'user1' }}
        navigate={mockNavigate}
      />
    );

    fireEvent.click(screen.getByText('Contact'));
    expect(mockOnContact).toHaveBeenCalledWith(mockAgencyMaid);
  });

  test('navigates to profile when view button is clicked', () => {
    renderComponent(
      <MaidCard
        maid={mockMaid}
        index={0}
        onContact={mockOnContact}
        onBookNow={mockOnBookNow}
        user={{ id: 'user1' }}
        navigate={mockNavigate}
      />
    );

    fireEvent.click(screen.getByText('View'));
    expect(mockNavigate).toHaveBeenCalledWith(`/maid/${mockMaid.id}`);
  });

  test('calls onBookNow when hire now button is clicked (non-agency maid)', () => {
    renderComponent(
      <MaidCard
        maid={mockMaid}
        index={0}
        onContact={mockOnContact}
        onBookNow={mockOnBookNow}
        user={{ id: 'user1' }}
        navigate={mockNavigate}
      />
    );

    fireEvent.click(screen.getByText('Hire Now'));
    expect(mockOnBookNow).toHaveBeenCalledWith(mockMaid);
  });

  test('adds ARIA attributes for accessibility', () => {
    renderComponent(
      <MaidCard
        maid={mockMaid}
        index={0}
        onContact={mockOnContact}
        onBookNow={mockOnBookNow}
        user={{ id: 'user1' }}
        navigate={mockNavigate}
      />
    );

    // Check for ARIA attributes on the article element
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute(
      'aria-labelledby',
      `maid-${mockMaid.id}-name`
    );

    // Check for View and Hire Now buttons
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Hire Now')).toBeInTheDocument();
  });
});
