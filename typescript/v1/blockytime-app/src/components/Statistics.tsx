import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import ArrowBack from '@mui/icons-material/ArrowBack';
import BarChart from '@mui/icons-material/BarChart';
import PieChart from '@mui/icons-material/PieChart';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { format, addDays, subDays, startOfWeek, endOfWeek, 
         startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

type ChartType = 'pie' | 'bar';
type StatisticsType = 
  | 'today' 
  | 'this-week' 
  | 'this-month' 
  | 'this-season' 
  | 'this-year'
  | 'last-7-days'
  | 'last-30-days'
  | 'since-inception';

interface StatisticsState {
  chartType: ChartType;
  statisticsType: StatisticsType;
  selectedDate: Date;
}

export const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<StatisticsState>({
    chartType: 'pie',
    statisticsType: 'today',
    selectedDate: new Date(),
  });

  const getDateRange = useCallback((): { start: Date; end: Date; canNavigate: boolean } => {
    const today = new Date();
    switch (state.statisticsType) {
      case 'today':
        return {
          start: state.selectedDate,
          end: addDays(state.selectedDate, 1),
          canNavigate: true
        };
      case 'this-week':
        const weekStart = startOfWeek(state.selectedDate, { weekStartsOn: 1 });
        return {
          start: weekStart,
          end: addDays(weekStart, 7),
          canNavigate: true
        };
      case 'this-month':
        return {
          start: startOfMonth(state.selectedDate),
          end: endOfMonth(state.selectedDate),
          canNavigate: true
        };
      case 'this-season':
        const month = state.selectedDate.getMonth();
        const seasonStart = new Date(state.selectedDate.getFullYear(), Math.floor(month / 3) * 3, 1);
        const seasonEnd = new Date(seasonStart.getFullYear(), seasonStart.getMonth() + 3, 0);
        return {
          start: seasonStart,
          end: seasonEnd,
          canNavigate: true
        };
      case 'this-year':
        return {
          start: startOfYear(state.selectedDate),
          end: endOfYear(state.selectedDate),
          canNavigate: true
        };
      case 'last-7-days':
        return {
          start: subDays(today, 7),
          end: today,
          canNavigate: false
        };
      case 'last-30-days':
        return {
          start: subDays(today, 30),
          end: today,
          canNavigate: false
        };
      case 'since-inception':
        return {
          start: new Date(2020, 0, 1), // Adjust this to your actual inception date
          end: today,
          canNavigate: false
        };
    }
  }, [state.statisticsType, state.selectedDate]);

  const formatDateRange = useCallback((): string => {
    const { start, end } = getDateRange();
    switch (state.statisticsType) {
      case 'today':
        return format(state.selectedDate, 'MMMM d, yyyy');
      case 'this-week':
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      case 'this-month':
        return format(state.selectedDate, 'MMMM yyyy');
      case 'this-season':
        return `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`;
      case 'this-year':
        return format(state.selectedDate, 'yyyy');
      case 'last-7-days':
        return 'Last 7 Days';
      case 'last-30-days':
        return 'Last 30 Days';
      case 'since-inception':
        return 'All Time';
    }
  }, [state.statisticsType, state.selectedDate, getDateRange]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    const amount = direction === 'prev' ? -1 : 1;
    setState(prev => {
      const newDate = new Date(prev.selectedDate);
      switch (prev.statisticsType) {
        case 'today':
          newDate.setDate(newDate.getDate() + amount);
          break;
        case 'this-week':
          newDate.setDate(newDate.getDate() + (7 * amount));
          break;
        case 'this-month':
          newDate.setMonth(newDate.getMonth() + amount);
          break;
        case 'this-season':
          newDate.setMonth(newDate.getMonth() + (3 * amount));
          break;
        case 'this-year':
          newDate.setFullYear(newDate.getFullYear() + amount);
          break;
      }
      return { ...prev, selectedDate: newDate };
    });
  };

  return (
    <div className="statistics-page">
      <div className="statistics-header">
        <div className="top-row">
          <IconButton onClick={() => navigate('/')} aria-label="back">
            <ArrowBack />
          </IconButton>
          <h2>Statistics</h2>
          <IconButton 
            onClick={() => setState(prev => ({
              ...prev, 
              chartType: prev.chartType === 'pie' ? 'bar' : 'pie'
            }))}
          >
            {state.chartType === 'pie' ? <BarChart /> : <PieChart />}
          </IconButton>
        </div>
        
        <ToggleButtonGroup
          value={state.statisticsType}
          exclusive
          onChange={(_, value) => value && setState(prev => ({ ...prev, statisticsType: value }))}
          className="statistics-type-selector"
        >
          <ToggleButton value="today">Today</ToggleButton>
          <ToggleButton value="this-week">This Week</ToggleButton>
          <ToggleButton value="this-month">This Month</ToggleButton>
          <ToggleButton value="this-season">This Season</ToggleButton>
          <ToggleButton value="this-year">This Year</ToggleButton>
          <ToggleButton value="last-7-days">Last 7 Days</ToggleButton>
          <ToggleButton value="last-30-days">Last 30 Days</ToggleButton>
          <ToggleButton value="since-inception">Since Inception</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <div className="date-range-selector">
        {getDateRange().canNavigate && (
          <IconButton onClick={() => handleNavigate('prev')}>
            <ChevronLeft />
          </IconButton>
        )}
        <span className="date-range">{formatDateRange()}</span>
        {getDateRange().canNavigate && (
          <IconButton onClick={() => handleNavigate('next')}>
            <ChevronRight />
          </IconButton>
        )}
      </div>

      <div className="chart-container">
        {/* Chart component will be added here */}
      </div>
    </div>
  );
};
