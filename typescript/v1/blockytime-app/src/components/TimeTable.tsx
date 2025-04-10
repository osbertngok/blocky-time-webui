import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { BlockModel } from '../models/block';
import { useBlockService, useConfigService } from '../contexts/ServiceHooks';
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
import { BlockyTimeConfig } from '../models/blockytimeconfig';

interface TimeTableProps {
  initialDate?: Date;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const TimeTable = forwardRef<{ setCurrentDate: (date: Date) => void }, TimeTableProps>(({ 
  initialDate = new Date(),
  containerRef
}, ref) => {
  const [config, setConfig] = useState<BlockyTimeConfig>({
    mainTimePrecision: "QUARTER_HOUR",
    disablePixelate: false,
    specialTimePeriod: []
  });
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [blocks, setBlocks] = useState<Record<string, BlockModel[]>>({});
  const [loading, setLoading] = useState(false);
  const [visibleDates, setVisibleDates] = useState<string[]>([]);
  const blockService = useBlockService();
  const configService = useConfigService();

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

  // Add a ref to track if we've done the initial fetch
  const initialFetchRef = useRef(false);

  // Format date as YYYY-MM-DD
  const formatDateString = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Expose setCurrentDate to parent components
  useImperativeHandle(ref, () => ({
    setCurrentDate: (date: Date) => {
      // Create a new date at the start of the day
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      
      setCurrentDate(newDate);
      // Reset both flags to force a new fetch and scroll
      initialFetchRef.current = false;
      initialScrollCompleted.current = false;
    }
  }), []);

  // Set today's date when component mounts
  useEffect(() => {
    setCurrentDate(new Date());
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

  // Helper function to organize blocks by date
  const organizeBlocksByDate = useCallback((blocks: BlockModel[]): Record<string, BlockModel[]> => {
    return blocks.reduce((acc: Record<string, BlockModel[]>, block: BlockModel) => {
      const date = new Date(block.date * 1000); // Convert timestamp to Date
      const dateStr = formatDateString(date);
      
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(block);
      return acc;
    }, {});
  }, [formatDateString]);

  // Fetch blocks for a range of dates
  const prefetchBlocks = useCallback(async (dates: Date[]) => {
    if (dates.length === 0) return;
    
    try {
      setLoading(true);
      
      // Find the earliest and latest dates
      const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
      endDate.setDate(endDate.getDate() + 1); // Add one day to include the last date
      
      // Make a single API call
      const fetchedBlocks = await blockService.getBlocks(startDate, endDate);
      
      // Organize blocks by date
      const blocksByDate = organizeBlocksByDate(fetchedBlocks);
      
      // Update state with all fetched blocks
      setBlocks(prev => ({
        ...prev,
        ...blocksByDate
      }));
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setLoading(false);
    }
  }, [blockService, organizeBlocksByDate]);

  // Change the fetchConfig function to be memoized
  const fetchConfig = useCallback(async () => {
    const fetchedConfig = await configService.getConfigAsync();
    setConfig(fetchedConfig);
  }, [configService]);

  // Update the effect to include fetchConfig in dependencies
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]); // Now includes the memoized fetchConfig

  // Handle currentDate changes
  useEffect(() => {
    const dates = getDateRange(currentDate);
    prefetchBlocks(dates);
    
    // Always set visible dates centered on the current date
    const currentDateStr = formatDateString(currentDate);
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const newVisibleDates = [
      formatDateString(yesterday),
      currentDateStr,
      formatDateString(tomorrow)
    ];
    
    setVisibleDates(newVisibleDates);
  }, [currentDate, prefetchBlocks, formatDateString]);

  // Handle initial scroll - runs once
  useEffect(() => {
    if (!initialScrollCompleted.current && containerRef?.current) {
      const targetDateStr = formatDateString(currentDate);
      
      // Use a small timeout to ensure the DOM is ready
      setTimeout(() => {
        requestAnimationFrame(() => {
          const targetContainer = containerRef.current?.querySelector(`[data-date="${targetDateStr}"]`);
          
          if (targetContainer && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const targetRect = targetContainer.getBoundingClientRect();
            
            // Position the target date at the top with a small offset
            const topOffset = 80; // pixels from top
            const newScrollTop = targetRect.top - containerRect.top + containerRef.current.scrollTop - topOffset;
            
            containerRef.current.scrollTop = newScrollTop;
            initialScrollCompleted.current = true;
          }
        });
      }, 50);
    }
  }, [containerRef, formatDateString, currentDate, visibleDates]);

  // Function to refresh all visible dates
  const refreshVisibleDates = useCallback(() => {
    
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
      if (config.mainTimePrecision === "HALF_HOUR") {
        // For 30-minute blocks, select both the current block and the next 15-minute block
        const firstBlock = blockId;
        dispatch(startDragSelection({ block: firstBlock, isHalfHour: true }));
      } else {
        dispatch(startDragSelection({ block: blockId, isHalfHour: false }));
      }
    }, 200); // 200ms threshold for long press
  };
  
  const handleBlockMouseMove = (blockId: TimeBlockId) => {
    if (isDragging && isMouseDown) {
      if (config.mainTimePrecision === "HALF_HOUR") {
        // For 30-minute blocks, update with both blocks
        const firstBlock = blockId;
        dispatch(updateDragSelection({ block: firstBlock, isHalfHour: true }));
      } else {
        dispatch(updateDragSelection({ block: blockId, isHalfHour: false }));
      }
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
      if (config.mainTimePrecision === "HALF_HOUR") {
        // For 30-minute blocks, toggle both blocks
        const firstBlock = blockId;
        dispatch(toggleBlockSelection({ block: firstBlock, isHalfHour: true }));
      } else {
        dispatch(toggleBlockSelection({ block: blockId, isHalfHour: false }));
      }
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
  const renderTimeBlock = (dateStr: string, hour: number, minute: number, _timePrecision: string) => {
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
        onMouseLeave={(_e) => {
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

      if (config.mainTimePrecision === "QUARTER_HOUR") {
      
        // Create quarter-hour blocks for this hour
        const quarterHourBlocks = [];
        for (let minute = 0; minute < 60; minute += 15) {
          quarterHourBlocks.push(renderTimeBlock(dateStr, hour, minute, config.mainTimePrecision));
        }
        
        // Create a row for this hour
        hourRows.push(
          <div key={`${dateStr}-${hour}`} className="hour-row">
            <div className="hour-label">{hourLabel}:00</div>
            <div className="blocks-in-hour">
              {quarterHourBlocks}
              {renderTimeIndicator(dateStr, hour)}
            </div>
          </div>
        );
      } else if (config.mainTimePrecision === "HALF_HOUR") {
        // Create half-hour blocks for this hour
        const halfHourBlocks = [];
        for (let minute = 0; minute < 60; minute += 30) {
          halfHourBlocks.push(renderTimeBlock(dateStr, hour, minute, config.mainTimePrecision));
        }

        // Create a row for this hour
        hourRows.push(
          <div key={`${dateStr}-${hour}`} className="hour-row">
            <div className="hour-label">{hourLabel}:00</div>
            <div className="blocks-in-hour">
              {halfHourBlocks}
              {renderTimeIndicator(dateStr, hour)}
            </div>
          </div>
        );
      }
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
          prefetchBlocks([prevDate]);
          
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
          prefetchBlocks([nextDate]);
          
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
  }, [containerRef, visibleDates, blocks, prefetchBlocks, formatDateString]);

  return (
    <div className="time-table">
      {loading && <div className="loading-indicator">Loading...</div>}
      <div className="time-blocks">
        {[...new Set(visibleDates)].map(dateStr => renderTimeBlocks(dateStr))}
      </div>
    </div>
  );
}); 