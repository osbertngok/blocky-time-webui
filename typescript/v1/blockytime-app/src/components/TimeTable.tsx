import React, { useState, useEffect, useRef } from 'react';
import { BlockModel } from '../models/block';
import { useBlockService } from '../contexts/ServiceContext';
import './TimeTable.css';

interface TimeTableProps {
  initialDate?: Date; // Optional initial date
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const TimeTable: React.FC<TimeTableProps> = ({ 
  initialDate = new Date(),
  containerRef
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [blocks, setBlocks] = useState<Record<string, BlockModel[]>>({});
  const [loading, setLoading] = useState(false);
  const [visibleDates, setVisibleDates] = useState<string[]>([]);
  const blockService = useBlockService();

  // Format date as YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get a range of dates (±10 days from current date)
  const getDateRange = (centerDate: Date): Date[] => {
    const dates: Date[] = [];
    const center = new Date(centerDate);
    
    // Add dates before the center date
    for (let i = 10; i > 0; i--) {
      const date = new Date(center);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    
    // Add the center date
    dates.push(new Date(center));
    
    // Add dates after the center date
    for (let i = 1; i <= 10; i++) {
      const date = new Date(center);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  // Fetch blocks for a specific date
  const fetchBlocksForDate = async (date: Date) => {
    const dateStr = formatDateString(date);
    
    // Skip if we already have data for this date
    if (blocks[dateStr]) return;
    
    try {
      setLoading(true);
      
      // Create next day for end date
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const endDateStr = formatDateString(nextDate);
      
      const fetchedBlocks = await blockService.getBlocksByDateString(dateStr, endDateStr);
      
      setBlocks(prev => ({
        ...prev,
        [dateStr]: fetchedBlocks
      }));
    } catch (error) {
      console.error(`Error fetching blocks for ${dateStr}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Prefetch blocks for a range of dates
  const prefetchBlocks = async (dates: Date[]) => {
    for (const date of dates) {
      await fetchBlocksForDate(date);
    }
  };

  // Initial data loading
  useEffect(() => {
    const dates = getDateRange(currentDate);
    prefetchBlocks(dates);
    
    // Set initial visible dates (current date and ±1 day)
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const initialVisibleDates = [
      formatDateString(yesterday),
      formatDateString(currentDate),
      formatDateString(tomorrow)
    ];
    
    // Ensure no duplicates
    setVisibleDates([...new Set(initialVisibleDates)]);
  }, [currentDate]);

  // Convert decimal color to CSS hex color
  const getColorFromDecimal = (decimalColor?: number): string => {
    if (decimalColor === undefined || decimalColor === null) {
      return 'transparent';
    }
    
    // Convert decimal to hex string and ensure it has 6 digits
    const hexColor = decimalColor.toString(16).padStart(6, '0');
    return `#${hexColor}`;
  };

  // Organize blocks by hour and minute for easier lookup
  const getBlocksByTime = (dateStr: string) => {
    const blocksByTime: Record<string, BlockModel> = {};
    const dateBlocks = blocks[dateStr] || [];
    
    dateBlocks.forEach(block => {
      const date = new Date(block.date * 1000);
      const hour = date.getHours();
      const minute = Math.floor(date.getMinutes() / 15) * 15; // Round to nearest 15 min
      const key = `${hour}:${minute}`;
      blocksByTime[key] = block;
    });
    
    return blocksByTime;
  };

  // Format date for display
  const formatDateDisplay = (dateStr: string): { month: string, day: string, weekday: string, daysAgo: string } => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    let daysAgo = '';
    if (diffDays === 0) {
      daysAgo = 'Today';
    } else if (diffDays === 1) {
      daysAgo = 'Yesterday';
    } else if (diffDays === -1) {
      daysAgo = 'Tomorrow';
    } else if (diffDays > 0) {
      daysAgo = `${diffDays} days ago`;
    } else {
      daysAgo = `In ${Math.abs(diffDays)} days`;
    }
    
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate().toString();
    const weekday = date.toLocaleString('default', { weekday: 'short' });
    
    return { month, day, weekday, daysAgo };
  };

  // Render a single time block cell
  const renderTimeBlock = (dateStr: string, hour: number, minute: number) => {
    const blocksByTime = getBlocksByTime(dateStr);
    const key = `${hour}:${minute}`;
    const block = blocksByTime[key];
    
    // Get block display text (project abbreviation if available)
    const blockText = block?.project?.abbr || '';
    const backgroundColor = getColorFromDecimal(block?.type_?.color);
    
    return (
      <div 
        key={`${dateStr}-${key}`} 
        className={`time-block ${block ? 'has-data' : ''}`}
        style={{
          backgroundColor
        }}
      >
        <div className="minute">{minute}</div>
        {blockText && <div className="block-text">{blockText}</div>}
        {block && (
          <div className="block-info">
            <div className="type">{block.type_?.name || 'No Type'}</div>
            <div className="project">{block.project?.name || 'No Project'}</div>
            {block.comment && <div className="comment">{block.comment}</div>}
          </div>
        )}
      </div>
    );
  };

  // Render time blocks for a day organized by hour
  const renderTimeBlocks = (dateStr: string) => {
    const hourRows = [];
    const dateInfo = formatDateDisplay(dateStr);
    
    // Add date header
    hourRows.push(
      <div key={`${dateStr}-header`} className="date-header">
        <div className="date-month">{dateInfo.month}</div>
        <div className="date-day">{dateInfo.day}</div>
        <div className="date-weekday">{dateInfo.weekday}</div>
        <div className="date-relative">{dateInfo.daysAgo}</div>
      </div>
    );
    
    // Loop through 24 hours
    for (let hour = 0; hour < 24; hour++) {
      const hourLabel = hour.toString().padStart(2, '0');
      
      // Create quarter-hour blocks for this hour
      const quarterHourBlocks = [];
      for (let minute = 0; minute < 60; minute += 15) {
        quarterHourBlocks.push(renderTimeBlock(dateStr, hour, minute));
      }
      
      // Create a row for this hour
      hourRows.push(
        <div key={`${dateStr}-${hour}`} className="hour-row">
          <div className="hour-label">{hourLabel}:00</div>
          <div className="quarter-hour-blocks">
            {quarterHourBlocks}
          </div>
        </div>
      );
    }
    
    return (
      <div key={dateStr} className="day-container">
        {hourRows}
      </div>
    );
  };

  // Set up scroll handling
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef?.current) return;
      
      const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
      
      // If scrolled near the top, load more dates before
      if (scrollTop < 200) {
        const firstVisibleDate = new Date(visibleDates[0]);
        const prevDate = new Date(firstVisibleDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = formatDateString(prevDate);
        
        // Only add if not already in the list
        if (!visibleDates.includes(prevDateStr)) {
          fetchBlocksForDate(prevDate);
          
          // Create a new array with unique dates
          const newDates = [prevDateStr, ...visibleDates];
          const uniqueDates = [...new Set(newDates)].slice(0, 5); // Limit to 5 dates to avoid too many
          setVisibleDates(uniqueDates);
        }
      }
      
      // If scrolled near the bottom, load more dates after
      if (scrollHeight - scrollTop - clientHeight < 200) {
        const lastVisibleDate = new Date(visibleDates[visibleDates.length - 1]);
        const nextDate = new Date(lastVisibleDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = formatDateString(nextDate);
        
        // Only add if not already in the list
        if (!visibleDates.includes(nextDateStr)) {
          fetchBlocksForDate(nextDate);
          
          // Create a new array with unique dates
          const newDates = [...visibleDates, nextDateStr];
          const uniqueDates = [...new Set(newDates)].slice(-5); // Limit to 5 dates to avoid too many
          setVisibleDates(uniqueDates);
        }
      }
    };

    // Add scroll event listener to the container
    const container = containerRef?.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    // Clean up
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [containerRef, visibleDates, blocks, fetchBlocksForDate, formatDateString]);

  return (
    <div className="time-table">
      {loading && <div className="loading-indicator">Loading...</div>}
      <div className="time-blocks">
        {[...new Set(visibleDates)].map(dateStr => renderTimeBlocks(dateStr))}
      </div>
    </div>
  );
}; 