import React, { useRef, useState, forwardRef, useEffect } from 'react';
import { TimeTable } from './TimeTable';
import { TypeSelector } from './TypeSelector';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearSelection, triggerRefresh } from '../store/selectionSlice';
import './MainUI.css';
import { DebugPanel } from './DebugPanel';
import { useBlockService } from '../contexts/ServiceHooks';
import { useConfigService } from '../contexts/ServiceHooks';
import { BlockyTimeConfig } from '../models/blockytimeconfig';


// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MainUIProps {
  // Props can be added later if needed
}

const keyToTimestamp = (key: string): number => {
  const [year, month, day, hour, minute] = key.split('-');
  return new Date(`${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`).getTime() / 1000;
}

export const MainUI = forwardRef<{ scrollToCurrentTime: () => void }, MainUIProps>((props, ref) => {
  const timeTableContainerRef = useRef<HTMLDivElement>(null);
  const timeTableRef = useRef<{ setCurrentDate: (date: Date) => void }>(null);
  const [selectedTypeUid, setSelectedTypeUid] = useState<number | null>(null);
  const [selectedProjectUid, setSelectedProjectUid] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [config, setConfig] = useState<BlockyTimeConfig>({
    mainTimePrecision: 1,
    disablePixelate: false,
    specialTimePeriod: []
  });
  
  const dispatch = useAppDispatch();
  // keys of selectedBlocks are things like
  // 2025-03-28-2-0
  // 2025-03-28-2-15
  // 2025-03-28-2-30
  // 2025-03-28-2-45
  const { selectedBlocks } = useAppSelector(state => state.selection);
  const blockService = useBlockService();
  const configService = useConfigService();
  
  useEffect(() => {
    const fetchConfig = async () => {
      const fetchedConfig = await configService.getConfigAsync();
      setConfig(fetchedConfig);
    };
    fetchConfig();
  }, [configService]);

  // Count selected blocks, adjusting for 30-minute precision
  const displayBlockCount = config.mainTimePrecision === 2 
    ? Math.ceil(Object.keys(selectedBlocks).length / 2)  // Show half the number for 30-minute blocks
    : Object.keys(selectedBlocks).length;  // Show actual count for 15-minute blocks
  
  // Set today's date and scroll to current time when component mounts
  useEffect(() => {
    const initializeView = async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // First set the current date in TimeTable
      timeTableRef.current?.setCurrentDate(now);
      
      // Function to check if today's container exists and is properly rendered
      const checkTodayContainer = (): Element | null => {
        if (!timeTableContainerRef.current) return null;
        const container = timeTableContainerRef.current.querySelector(`[data-date="${today}"]`);
        
        // Additional check to ensure the container has content and is at the expected position
        if (container && container.children.length > 0) {
          // Get all date containers
          const allDateContainers = timeTableContainerRef.current.querySelectorAll('[data-date]');
          const dates = Array.from(allDateContainers).map(el => el.getAttribute('data-date'));
          
          // Check if today's container is in the expected position
          const todayIndex = dates.indexOf(today);
          
          // Only return the container if today is in the correct position
          if (todayIndex === 1) {
            return container;
          }
        }
        return null;
      };

      // Try to find today's container with retries
      let attempts = 0;
      const maxAttempts = 50;
      const retryInterval = 200;

      const attemptScroll = () => {
        // Set current date each attempt to ensure it stays on today
        timeTableRef.current?.setCurrentDate(now);
        
        const todayContainer = checkTodayContainer();
        
        if (todayContainer) {
          scrollToTime(todayContainer, now.getHours(), now.getMinutes());
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(attemptScroll, retryInterval);
        }
      };

      // Start the attempts
      attemptScroll();
    };

    initializeView();
  }, []);

  const handleScroll = (_event: React.UIEvent<HTMLDivElement>) => {
    // The scroll event handler can be simplified or removed if not needed
  };

  const handleTypeSelect = async (typeUid: number, projectUid?: number | null) => {
    setSelectedTypeUid(typeUid);
    setSelectedProjectUid(projectUid || null);

    const blocksToUpsert = Object.entries(selectedBlocks).filter(([_, value]) => !!value).map(([key, _]) => {
      return {
        date: keyToTimestamp(key),
        type_: {
          uid: typeUid
        },
        project: projectUid ? {
          uid: projectUid
        } : null,
        comment: '',
        operation: 'upsert',
      }
    });
    try {
      const result = await blockService.updateBlocks(blocksToUpsert);
      if (result) {
        dispatch(clearSelection());
        // Trigger a refresh of the time table
        dispatch(triggerRefresh());
      }
    } catch (error) {
      console.error('Error upserting blocks:', error);
    }
  };
  
  const handleClearSelection = () => {
    dispatch(clearSelection());
  };
  
  const handleDeleteBlocks = async () => {
    if (displayBlockCount === 0) return;
    
    try {
      setIsDeleting(true);
      
      // Create an array of block models with delete operation
      const blocksToDelete = Object.entries(selectedBlocks)
        .filter(([_, value]) => !!value)
        .map(([key, _]) => {
          return {
            date: keyToTimestamp(key),
            comment: '',
            operation: 'delete' as const,
          };
        });
      
      // Call the API to delete the blocks
      await blockService.updateBlocks(blocksToDelete);
      
      // Clear the selection after successful deletion
      dispatch(clearSelection());
      // Trigger a refresh of the time table
      dispatch(triggerRefresh());
      
    } catch (error) {
      console.error('Error deleting blocks:', error);
      // Optionally show an error message to the user
    } finally {
      setIsDeleting(false);
    }
  };

  const scrollToCurrentTime = () => {
    if (!timeTableContainerRef.current) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Format today's date as YYYY-MM-DD
    const today = now.toISOString().split('T')[0];
    
    // Always set current date to today first
    timeTableRef.current?.setCurrentDate(now);
    
    // Wait for the DOM to update and then scroll
    setTimeout(() => {
      const todayContainer = timeTableContainerRef.current?.querySelector(`[data-date="${today}"]`);
      if (todayContainer) {
        scrollToTime(todayContainer, currentHour, currentMinute);
      } else {
        console.error(`Today container not found for date ${today}`);
      }
    }, 100);
  };

  // Helper function to handle the actual scrolling
  const scrollToTime = (container: Element, hour: number, minute: number) => {
    if (!timeTableContainerRef.current) return;
    
    // Calculate the scroll position based on the current time
    const hourHeight = 40;
    const timeScrollPosition = (hour * hourHeight) + (minute / 60 * hourHeight);
    
    // Use offsetTop instead of getBoundingClientRect().top for relative positioning
    const containerOffsetTop = container.offsetTop;
    
    // Get the viewport height
    const viewportHeight = timeTableContainerRef.current.clientHeight;
    
    // Calculate the position to center the current time in the viewport
    // Using containerOffsetTop instead of containerTop
    const finalScrollPosition = containerOffsetTop + timeScrollPosition - (viewportHeight / 2);
    
    // Scroll to the current time, centered in the viewport
    timeTableContainerRef.current.scrollTo({
      top: finalScrollPosition,
      behavior: 'smooth'
    });
  };
  
  // Expose the scroll function to parent components
  React.useImperativeHandle(ref, () => ({
    scrollToCurrentTime
  }));

  return (
    <div className="main-ui">
      <div 
        className="time-table-container" 
        ref={timeTableContainerRef}
        onScroll={handleScroll}
      >
        <TimeTable 
          ref={timeTableRef}
          containerRef={timeTableContainerRef}
          selectedTypeUid={selectedTypeUid}
          selectedProjectUid={selectedProjectUid}
        />
      </div>
      <div className="type-selector-container">
        <TypeSelector onTypeSelect={handleTypeSelect} />
      </div>
      
      {/* Fixed selection info at bottom of screen */}
      {displayBlockCount > 0 && (
        <div className="selection-info-fixed">
          <span>{displayBlockCount} {config.mainTimePrecision === 2 ? 'half-hour' : 'quarter-hour'} block{displayBlockCount !== 1 ? 's' : ''} selected</span>
          <div className="selection-buttons">
            <button 
              className="delete-button" 
              onClick={handleDeleteBlocks}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button 
              className="clear-button" 
              onClick={handleClearSelection}
              disabled={isDeleting}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
      
      <DebugPanel />
    </div>
  );
}); 