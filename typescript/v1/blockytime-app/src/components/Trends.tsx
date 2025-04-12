import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  startOfYear,
  addWeeks,
  addMonths,
  addYears,
  format,
  parse
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial values from URL or use defaults
  const initialViewType = (searchParams.get('view') as ViewType) || 'monthly';
  const initialStartDate = searchParams.get('start');
  const initialEndDate = searchParams.get('end');
  
  const [viewType, setViewType] = useState<ViewType>(initialViewType);
  
  // Initialize selectedRange from URL params or get current range
  const [selectedRange, setSelectedRange] = useState(() => {
    if (initialStartDate && initialEndDate) {
      return {
        start: parse(initialStartDate, 'yyyy-MM-dd', new Date()),
        end: parse(initialEndDate, 'yyyy-MM-dd', new Date()),
        label: format(parse(initialStartDate, 'yyyy-MM-dd', new Date()), 
          viewType === 'weekly' ? "'Week of' MMM d, yyyy" :
          viewType === 'monthly' ? 'MMMM yyyy' : 'yyyy'
        )
      };
    }
    return getCurrentRange(viewType);
  });

  // Update URL when view type or range changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', viewType);
    newParams.set('start', format(selectedRange.start, 'yyyy-MM-dd'));
    newParams.set('end', format(selectedRange.end, 'yyyy-MM-dd'));
    setSearchParams(newParams, { replace: true });
  }, [viewType, selectedRange, setSearchParams, searchParams]);

  const handleViewChange = useCallback((_event: React.SyntheticEvent, newValue: ViewType) => {
    setViewType(newValue);
    const newRange = getCurrentRange(newValue);
    setSelectedRange(newRange);
  }, []);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    const ranges = getTimeRanges(viewType);
    const currentIndex = ranges.findIndex(r => 
      format(r.start, 'yyyy-MM-dd') === format(selectedRange.start, 'yyyy-MM-dd')
    );
    if (currentIndex > 0) {
      setSelectedRange(ranges[currentIndex - 1]);
    }
  }, [viewType, selectedRange]);

  const handleNext = useCallback(() => {
    const ranges = getTimeRanges(viewType);
    const currentIndex = ranges.findIndex(r => 
      format(r.start, 'yyyy-MM-dd') === format(selectedRange.start, 'yyyy-MM-dd')
    );
    if (currentIndex < ranges.length - 1) {
      setSelectedRange(ranges[currentIndex + 1]);
    }
  }, [viewType, selectedRange]);

  function getCurrentRange(type: ViewType): TimeRange {
    const now = new Date();
    let result: TimeRange;
    
    switch (type) {
      case 'weekly': {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        result = {
          start: weekStart,
          end: startOfWeek(addWeeks(weekStart, 1), { weekStartsOn: 1 }),
          label: format(now, "'Week of' MMM d, yyyy")
        };
        break;
      }
      case 'monthly': {
        const monthStart = startOfMonth(now);
        result = {
          start: monthStart,
          end: startOfMonth(addMonths(monthStart, 1)),
          label: format(now, 'MMMM yyyy')
        };
        break;
      }
      case 'yearly': {
        const yearStart = startOfYear(now);
        result = {
          start: yearStart,
          end: startOfYear(addYears(yearStart, 1)),
          label: format(now, 'yyyy')
        };
        break;
      }
    }
    return result;
  }

  function getTimeRanges(type: ViewType): TimeRange[] {
    const now = new Date();
    
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
      
      ranges.push({ start, end, label });
    }
    return ranges;
  }

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
            onClick={handlePrevious}
          >
            <ChevronLeft />
          </IconButton>
          <span className="date-range">{selectedRange.label}</span>
          <IconButton 
            onClick={handleNext}
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
