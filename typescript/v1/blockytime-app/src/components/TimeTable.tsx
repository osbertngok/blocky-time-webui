import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { BlockModel } from '../models/block';
import { useBlockService } from '../contexts/ServiceContext';
import './TimeTable.css';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  TimeBlockId, 
  formatTimeBlockId, 
  toggleBlockSelection, 
  startDragSelection, 
  updateDragSelection, 
  endDragSelection 
} from '../store/selectionSlice';

interface TimeTableProps {
  initialDate?: Date; // Optional initial date
  containerRef?: React.RefObject<HTMLDivElement>;
  selectedTypeUid?: number | null;
  selectedProjectUid?: number | null;
}

export const TimeTable = forwardRef<{ setCurrentDate: (date: Date) => void }, TimeTableProps>(({ 
  initialDate = new Date(),
  containerRef,
  selectedTypeUid,
  selectedProjectUid
}, ref) => {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [blocks, setBlocks] = useState<Record<string, BlockModel[]>>({});
  const [loading, setLoading] = useState(false);
  const [visibleDates, setVisibleDates] = useState<string[]>([]);
  const blockService = useBlockService();

  // Add Redux hooks
  const dispatch = useAppDispatch();
  const { selectedBlocks, isDragging, refreshCounter } = useAppSelector(state => state.selection);
  
  // Add state for tracking mouse events
  const [isMouseDown, setIsMouseDown] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add state for current time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Add a ref to track initial scroll
  const initialScrollCompleted = useRef(false);

  // Set today's date when component mounts
  useEffect(() => {
    console.log("Setting current date to today in TimeTable");
    setCurrentDate(new Date());
  }, []);

  // Expose setCurrentDate to parent components
  useImperativeHandle(ref, () => ({
    setCurrentDate
  }));

  // Format date as YYYY-MM-DD
  const formatDateString = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

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

  // Fetch blocks for a specific date - using useCallback to avoid dependency cycles
  const fetchBlocksForDate = useCallback(async (date: Date) => {
    const dateStr = formatDateString(date);
    
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
  }, [blockService, formatDateString]);

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

    // After setting visible dates, trigger a scroll to today's position
    // but only do this once when component mounts
    if (!initialScrollCompleted.current && containerRef?.current) {
      const today = formatDateString(new Date());
      
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        // Use another RAF to ensure the dates are rendered
        requestAnimationFrame(() => {
          const todayContainer = containerRef.current?.querySelector(`[data-date="${today}"]`);
          if (todayContainer) {
            // Calculate scroll position to show today's container
            const containerRect = containerRef.current.getBoundingClientRect();
            const todayRect = todayContainer.getBoundingClientRect();
            const scrollTop = todayRect.top - containerRect.top + containerRef.current.scrollTop;
            
            // Scroll to position
            containerRef.current.scrollTop = scrollTop;
            initialScrollCompleted.current = true;
            
            console.log('Initial scroll completed:', {
              today,
              scrollTop,
              containerTop: containerRect.top,
              todayTop: todayRect.top
            });
          }
        });
      });
    }
  }, [currentDate]);

  // Function to refresh all visible dates
  const refreshVisibleDates = useCallback(() => {
    console.log('Refreshing visible dates:', visibleDates);
    
    // Get current visible dates from state
    const currentVisibleDates = [...visibleDates];
    
    // Fetch fresh data for all visible dates
    currentVisibleDates.forEach(dateStr => {
      const date = new Date(dateStr);
      
      // Use a direct fetch instead of the cached function to avoid dependency issues
      const fetchDate = async () => {
        try {
          setLoading(true);
          
          // Create next day for end date
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);
          const endDateStr = formatDateString(nextDate);
          
          const fetchedBlocks = await blockService.getBlocksByDateString(
            formatDateString(date), 
            endDateStr
          );
          
          // Update blocks with fresh data
          setBlocks(prev => ({
            ...prev,
            [formatDateString(date)]: fetchedBlocks
          }));
        } catch (error) {
          console.error(`Error refreshing blocks for ${formatDateString(date)}:`, error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchDate();
    });
  }, [visibleDates, blockService, formatDateString]);

  // Add a ref to track the previous refresh counter value
  const prevRefreshCounterRef = useRef(0);

  // Add a new effect to listen for refresh events
  useEffect(() => {
    // Only refresh if the counter has actually changed and is greater than the previous value
    if (refreshCounter > prevRefreshCounterRef.current) {
      console.log('Refresh counter changed:', refreshCounter, 'Previous:', prevRefreshCounterRef.current);
      refreshVisibleDates();
      prevRefreshCounterRef.current = refreshCounter;
    }
  }, [refreshCounter, refreshVisibleDates]);

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

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle mouse/touch events for time blocks
  const handleBlockMouseDown = (blockId: TimeBlockId) => {
    setIsMouseDown(true);
    
    // Set a timeout to detect long press
    longPressTimeoutRef.current = setTimeout(() => {
      dispatch(startDragSelection(blockId));
    }, 200); // 200ms threshold for long press
  };
  
  const handleBlockMouseMove = (blockId: TimeBlockId) => {
    if (isDragging && isMouseDown) {
      dispatch(updateDragSelection(blockId));
    }
  };
  
  const handleBlockMouseUp = (blockId: TimeBlockId) => {
    setIsMouseDown(false);
    
    // Clear the long press timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    
    if (isDragging) {
      dispatch(endDragSelection());
    } else {
      // If not dragging, it was a simple click - toggle selection
      dispatch(toggleBlockSelection(blockId));
    }
  };
  
  const handleBlockMouseLeave = () => {
    // Only clear if not dragging
    if (!isDragging) {
      setIsMouseDown(false);
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    }
  };
  
  // Add a global mouse up handler to catch mouse releases outside blocks
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        dispatch(endDragSelection());
      }
      setIsMouseDown(false);
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [dispatch, isDragging]);

  // Add effect for updating current time
  useEffect(() => {
    // Update immediately
    setCurrentTime(new Date());

    // Update every 30 seconds
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // 30000ms = 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Function to render time indicator
  const renderTimeIndicator = (dateStr: string, hour: number) => {
    const now = currentTime;
    const today = formatDateString(now);
    
    // Only show indicator for current date and hour
    if (dateStr !== today || now.getHours() !== hour) {
      return null;
    }

    const minutes = now.getMinutes();
    const percentage = (minutes / 60) * 100;

    return (
      <div 
        className="current-time-indicator"
        style={{
          left: `${percentage}%`
        }}
      />
    );
  };

  // Render a single time block cell
  const renderTimeBlock = (dateStr: string, hour: number, minute: number) => {
    const blocksByTime = getBlocksByTime(dateStr);
    const key = `${hour}:${minute}`;
    const block = blocksByTime[key];
    
    // Get block display text (project abbreviation if available)
    const blockText = block?.project?.abbr || '';
    const backgroundColor = getColorFromDecimal(block?.type_?.color);
    
    const blockId: TimeBlockId = { dateStr, hour, minute };
    const formattedBlockId = formatTimeBlockId(blockId);
    const isSelected = !!selectedBlocks[formattedBlockId];
    
    return (
      <div 
        key={`${dateStr}-${key}`} 
        className={`time-block ${block ? 'has-data' : ''} ${isSelected ? 'selected' : ''}`}
        style={{
          backgroundColor,
          position: 'relative'
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleBlockMouseDown(blockId);
        }}
        onMouseMove={(e) => {
          e.stopPropagation();
          handleBlockMouseMove(blockId);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          handleBlockMouseUp(blockId);
        }}
        onMouseLeave={(e) => {
          handleBlockMouseLeave();
        }}
        // Add touch events for mobile
        onTouchStart={(e) => {
          e.stopPropagation();
          handleBlockMouseDown(blockId);
        }}
        onTouchMove={(e) => {
          // Get touch position and find the element at that position
          const touch = e.touches[0];
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          if (element) {
            // Extract block ID from the element if possible
            const dataAttributes = element.getAttribute('data-block-id');
            if (dataAttributes) {
              const [touchDateStr, touchHour, touchMinute] = dataAttributes.split('-');
              const touchBlockId = {
                dateStr: touchDateStr,
                hour: parseInt(touchHour),
                minute: parseInt(touchMinute)
              };
              handleBlockMouseMove(touchBlockId);
            }
          }
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          handleBlockMouseUp(blockId);
        }}
        data-block-id={`${dateStr}-${hour}-${minute}`}
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
        {isSelected && (
          <div className="selection-overlay"></div>
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
            {renderTimeIndicator(dateStr, hour)}
          </div>
        </div>
      );
    }
    
    return (
      <div key={dateStr} className="day-container" data-date={dateStr}>
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
}); 