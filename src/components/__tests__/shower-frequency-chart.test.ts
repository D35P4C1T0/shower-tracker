import { fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShowerFrequencyChart, getLast30DaysShowerFrequency } from '../shower-frequency-chart';

const defaultProps = {
  firstDayOfWeek: 0 as const,
  onShowerGoalsChange: vi.fn(),
  showerGoals: {
    weekly: 4,
    monthly: 16,
  },
};

afterEach(() => {
  vi.useRealTimers();
  defaultProps.onShowerGoalsChange.mockReset();
});

describe('getLast30DaysShowerFrequency', () => {
  it('counts showers per local day for the last 30 days', () => {
    const today = new Date(2026, 3, 22, 12, 0, 0, 0);
    const data = getLast30DaysShowerFrequency([
      { id: '1', timestamp: new Date(2026, 3, 22, 8, 0, 0, 0) },
      { id: '2', timestamp: new Date(2026, 3, 22, 20, 0, 0, 0) },
      { id: '3', timestamp: new Date(2026, 3, 21, 12, 0, 0, 0) },
      { id: '4', timestamp: new Date(2026, 2, 1, 12, 0, 0, 0) },
    ], today);

    expect(data).toHaveLength(30);
    expect(data[data.length - 1]).toMatchObject({ count: 2 });
    expect(data[data.length - 2]).toMatchObject({ count: 1 });
    expect(data.reduce((total, point) => total + point.count, 0)).toBe(3);
  });
});

describe('ShowerFrequencyChart', () => {
  it('shows the week interval tooltip when a weekly column is clicked or hovered', () => {
    render(createElement(ShowerFrequencyChart, { ...defaultProps, showers: [] }));

    const firstBar = screen.getAllByTestId('shower-frequency-bar')[0];

    fireEvent.click(firstBar);
    expect(screen.getByTestId('shower-frequency-tooltip')).toHaveTextContent('-');

    fireEvent.mouseLeave(firstBar);
    expect(screen.queryByTestId('shower-frequency-tooltip')).not.toBeInTheDocument();

    fireEvent.mouseEnter(firstBar);
    expect(screen.getByTestId('shower-frequency-tooltip')).toHaveTextContent('-');
  });

  it('does not fill the days-since ring when no showers are recorded', () => {
    render(createElement(ShowerFrequencyChart, { ...defaultProps, showers: [] }));

    expect(screen.getByTestId('days-since-shower-ring')).toHaveAttribute('data-progress', '0');
    expect(screen.getByTestId('days-since-shower-ring')).toHaveTextContent('--/7');
  });

  it('opens a reusable goal editor when clicking goal rings', () => {
    render(createElement(ShowerFrequencyChart, { ...defaultProps, showers: [] }));

    fireEvent.click(screen.getByTestId('weekly-shower-ring'));
    expect(screen.getByTestId('goal-edit-dialog')).toBeInTheDocument();
    expect(screen.getByText('Weekly goal')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('goal-edit-input'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByTestId('goal-edit-save'));

    expect(defaultProps.onShowerGoalsChange).toHaveBeenCalledWith({
      weekly: 5,
      monthly: 16,
    });
    expect(screen.queryByTestId('goal-edit-dialog')).not.toBeInTheDocument();
  });

  it('updates goal rings when a newly recorded shower is newer than the initial render time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-22T12:00:00.000Z'));

    const { rerender } = render(createElement(ShowerFrequencyChart, { ...defaultProps, showers: [] }));

    vi.setSystemTime(new Date('2026-04-22T12:01:00.000Z'));
    rerender(createElement(ShowerFrequencyChart, {
      ...defaultProps,
      showers: [{ id: '1', timestamp: new Date('2026-04-22T12:01:00.000Z') }],
    }));

    expect(screen.getByTestId('weekly-shower-ring')).toHaveTextContent('1/4');
    expect(screen.getByTestId('monthly-shower-ring')).toHaveTextContent('1/16');
  });

  it('uses the configured first day of week for the weekly ring', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-26T12:00:00.000Z'));

    const showers = [{ id: '1', timestamp: new Date('2026-04-25T12:00:00.000Z') }];
    const { rerender } = render(createElement(ShowerFrequencyChart, {
      ...defaultProps,
      firstDayOfWeek: 0,
      showers,
    }));

    expect(screen.getByTestId('weekly-shower-ring')).toHaveTextContent('0/4');

    rerender(createElement(ShowerFrequencyChart, {
      ...defaultProps,
      firstDayOfWeek: 1,
      showers,
    }));

    expect(screen.getByTestId('weekly-shower-ring')).toHaveTextContent('1/4');
  });
});
