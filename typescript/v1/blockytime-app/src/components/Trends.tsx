import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addWeeks,
  addMonths,
  addYears,
  subWeeks,
  subMonths,
  subYears,
  format,
} from 'date-fns';
import { TrendsChart } from './TrendsChart';

type ViewType = 'weekly' | 'monthly' | 'yearly';

interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export const Trends: React.FC = () => {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<ViewType>('weekly');
  const [selectedRange, setSelectedRange] = useState<TimeRange>(getCurrentRange('weekly'));

  function getCurrentRange(type: ViewType): TimeRange {
    const now = new Date();
    switch (type) {
      case 'weekly':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
          label: format(now, "'Week of' MMM d, yyyy")
        };
      case 'monthly':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: format(now, 'MMMM yyyy')
        };
      case 'yearly':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
          label: format(now, 'yyyy')
        };
    }
  }

  const getTimeRanges = useCallback((type: ViewType): TimeRange[] => {
    const ranges: TimeRange[] = [];
    const now = new Date();
    let current: Date;
    
    switch (type) {
      case 'weekly':
        for (let i = -26; i <= 26; i++) {
          current = i < 0 ? subWeeks(now, Math.abs(i)) : addWeeks(now, i);
          ranges.push({
            start: startOfWeek(current, { weekStartsOn: 1 }),
            end: endOfWeek(current, { weekStartsOn: 1 }),
            label: format(current, "'Week of' MMM d, yyyy")
          });
        }
        break;
      case 'monthly':
        for (let i = -12; i <= 12; i++) {
          current = i < 0 ? subMonths(now, Math.abs(i)) : addMonths(now, i);
          ranges.push({
            start: startOfMonth(current),
            end: endOfMonth(current),
            label: format(current, 'MMMM yyyy')
          });
        }
        break;
      case 'yearly':
        for (let i = -5; i <= 5; i++) {
          current = i < 0 ? subYears(now, Math.abs(i)) : addYears(now, i);
          ranges.push({
            start: startOfYear(current),
            end: endOfYear(current),
            label: format(current, 'yyyy')
          });
        }
        break;
    }
    return ranges;
  }, []);

  const handleViewChange = (_: React.SyntheticEvent, newValue: ViewType) => {
    setViewType(newValue);
    setSelectedRange(getCurrentRange(newValue));
  };

  return (
    <div className="trends-page">
      <div className="trends-header">
        <div className="top-row">
          <IconButton onClick={() => navigate('/')} aria-label="back">
            <ArrowBack />
          </IconButton>
          <h2>Trends</h2>
        </div>

        <Tabs
          value={viewType}
          onChange={handleViewChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab value="weekly" label="Weekly View" />
          <Tab value="monthly" label="Monthly View" />
          <Tab value="yearly" label="Yearly View" />
        </Tabs>

        <div className="time-range-selector">
          <Select
            value={selectedRange.label}
            onChange={(event) => {
              const newRange = getTimeRanges(viewType).find(
                range => range.label === event.target.value
              );
              if (newRange) {
                setSelectedRange(newRange);
              }
            }}
            fullWidth
          >
            {getTimeRanges(viewType).map((range) => (
              <MenuItem key={range.label} value={range.label}>
                {range.label}
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className="chart-container">
          <TrendsChart
            startDate={selectedRange.start}
            endDate={selectedRange.end}
            groupBy={viewType === 'yearly' ? 'month' : 'day'}
          />
        </div>
      </div>
    </div>
  );
};
