import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '@/components/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders the correct label for a valid status', () => {
    render(<StatusBadge status="valide" />);
    expect(screen.getByText('Validé')).toBeInTheDocument();
  });

  it('renders the correct label for a payment status', () => {
    render(<StatusBadge status="paye" />);
    expect(screen.getByText('Payé')).toBeInTheDocument();
  });

  it('renders the status string directly if not in config', () => {
    render(<StatusBadge status="unknown" as any />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('applies smaller padding when size is sm', () => {
    const { container } = render(<StatusBadge status="valide" size="sm" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.padding).toBe('2px 8px');
  });
});
