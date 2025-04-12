import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
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
  format
} from 'date-fns';
import './Trends.css';
import { TrendsChart } from './TrendsChart';

type ViewType = 'weekly' | 'monthly' | 'yearly';

interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export const Trends: React.FC = () => {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<ViewType>('monthly');
  
  // Add logging when ranges are generated
  const timeRanges = useMemo(() => {
    console.log('Generating time ranges for viewType:', viewType);
    const ranges = getTimeRanges(viewType);
    console.log('Generated ranges:', ranges.map(r => ({
      label: r.label,
      start: format(r.start, 'yyyy-MM-dd'),
      end: format(r.end, 'yyyy-MM-dd')
    })));
    return ranges;
  }, [viewType]);

  // Add logging when current range is selected
  const [selectedRange, setSelectedRange] = useState(() => {
    const current = getCurrentRange(viewType);
    console.log('Initial selected range:', {
      label: current.label,
      start: format(current.start, 'yyyy-MM-dd'),
      end: format(current.end, 'yyyy-MM-dd')
    });
    return current;
  });

  // Add logging for range changes
  useEffect(() => {
    console.log('Selected range changed:', {
      label: selectedRange.label,
      start: format(selectedRange.start, 'yyyy-MM-dd'),
      end: format(selectedRange.end, 'yyyy-MM-dd')
    });
  }, [selectedRange]);

  function getCurrentRange(type: ViewType): TimeRange {
    const now = new Date();
    console.log('getCurrentRange input:', { type, now });
    let result: TimeRange;
    
    switch (type) {
      case 'weekly':
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        result = {
          start: weekStart,
          end: startOfWeek(addWeeks(weekStart, 1), { weekStartsOn: 1 }),
          label: format(now, "'Week of' MMM d, yyyy")
        };
        break;
      case 'monthly':
        const monthStart = startOfMonth(now);
        result = {
          start: monthStart,
          end: startOfMonth(addMonths(monthStart, 1)),
          label: format(now, 'MMMM yyyy')
        };
        break;
      case 'yearly':
        const yearStart = startOfYear(now);
        result = {
          start: yearStart,
          end: startOfYear(addYears(yearStart, 1)),
          label: format(now, 'yyyy')
        };
        break;
    }
    console.log('getCurrentRange output:', { 
      result,
      startFormatted: format(result.start, 'yyyy-MM-dd'),
      endFormatted: format(result.end, 'yyyy-MM-dd')
    });
    return result;
  }

  function getTimeRanges(type: ViewType): TimeRange[] {
    const now = new Date();
    console.log('getTimeRanges input:', { type, now });
    
    const ranges: TimeRange[] = [];
    for (let i = -6; i <= 6; i++) {
      let date = now;
      let start: Date;
      let end: Date;
      let label: string;

      switch (type) {
        case 'weekly':
          date = addWeeks(now, i);
          start = startOfWeek(date, { weekStartsOn: 1 });  // Start on Monday
          end = endOfWeek(date, { weekStartsOn: 1 });  // End on Sunday
          label = format(date, "'Week of' MMM d, yyyy");
          break;
        case 'monthly':
          date = addMonths(now, i);
          start = startOfMonth(date);
          // For end date, we should use start of next month instead of end of current month
          end = startOfMonth(addMonths(date, 1));
          label = format(date, 'MMMM yyyy');
          break;
        case 'yearly':
          date = addYears(now, i);
          start = startOfYear(date);
          // Similarly, use start of next year instead of end of current year
          end = startOfYear(addYears(date, 1));
          label = format(date, 'yyyy');
          break;
      }
      
      console.log(`Range ${i}:`, {
        date: format(date, 'yyyy-MM-dd'),
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
        label
      });

      ranges.push({ start, end, label });
    }
    return ranges;
  }

  const handleViewChange = useCallback((event: React.SyntheticEvent, newValue: ViewType) => {
    console.log('View type changing from', viewType, 'to', newValue);
    setViewType(newValue);
    const newRange = getCurrentRange(newValue);
    console.log('New range after view change:', {
      label: newRange.label,
      start: format(newRange.start, 'yyyy-MM-dd'),
      end: format(newRange.end, 'yyyy-MM-dd')
    });
    setSelectedRange(newRange);
  }, [viewType]);

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

        <div className="date-range-selector">
          <IconButton 
            onClick={() => {
              const ranges = getTimeRanges(viewType);
              const currentIndex = ranges.findIndex(r => r.label === selectedRange.label);
              if (currentIndex > 0) {
                setSelectedRange(ranges[currentIndex - 1]);
              }
            }}
          >
            <ChevronLeft />
          </IconButton>
          <span className="date-range">{selectedRange.label}</span>
          <IconButton 
            onClick={() => {
              const ranges = getTimeRanges(viewType);
              const currentIndex = ranges.findIndex(r => r.label === selectedRange.label);
              if (currentIndex < ranges.length - 1) {
                setSelectedRange(ranges[currentIndex + 1]);
              }
            }}
          >
            <ChevronRight />
          </IconButton>
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
