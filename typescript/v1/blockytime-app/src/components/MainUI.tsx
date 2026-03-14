import React, { useRef, useState, forwardRef, useEffect } from 'react';
import { TimeTable } from './TimeTable';
import { WeekView } from './WeekView';
import { TypeSelector } from './TypeSelector';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearSelection, triggerRefresh } from '../store/selectionSlice';
import './MainUI.css';
import { DebugPanel } from './DebugPanel';
import { useBlockService } from '../contexts/ServiceHooks';
import { useConfigService } from '../contexts/ServiceHooks';
import { BlockyTimeConfig } from '../models/blockytimeconfig';
import { BlockModel } from '../models/block';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MainUIProps {
  // Props can be added later if needed
}

type ViewMode = 'week' | 'scroll';

const STORAGE_KEY_VIEW_MODE = 'blockytimeViewMode';

const keyToTimestamp = (key: string): number => {
  const [year, month, day, hour, minute] = key.split('-');
  return new Date(`${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`).getTime() / 1000;
}

export const MainUI = forwardRef<{ scrollToCurrentTime: () => void }, MainUIProps>((_props, ref) => {
  const timeTableContainerRef = useRef<HTMLDivElement | null>(null);
  const timeTableRef = useRef<{ setCurrentDate: (date: Date) => void }>(null);
  const weekViewRef = useRef<{ goToCurrentWeek: () => void }>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [config, setConfig] = useState<BlockyTimeConfig>({
    mainTimePrecision: "QUARTER_HOUR",
    disablePixelate: false,
    specialTimePeriod: []
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
    return (stored === 'scroll' || stored === 'week') ? stored : 'week';
  });

  const dispatch = useAppDispatch();
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

  // Persist view mode
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW_MODE, viewMode);
  }, [viewMode]);

  // Count selected blocks, adjusting for 30-minute precision
  const displayBlockCount = config.mainTimePrecision === "HALF_HOUR"
    ? Math.ceil(Object.keys(selectedBlocks).length / 2)
    : Object.keys(selectedBlocks).length;

  // Set today's date and scroll to current time when component mounts (scroll view only)
  useEffect(() => {
    if (viewMode !== 'scroll') return;

    const initializeView = async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      timeTableRef.current?.setCurrentDate(now);

      const checkTodayContainer = (): Element | null => {
        if (!timeTableContainerRef.current) return null;
        const container = timeTableContainerRef.current.querySelector(`[data-date="${today}"]`);
        if (container && container.children.length > 0) {
          const allDateContainers = timeTableContainerRef.current.querySelectorAll('[data-date]');
          const dates = Array.from(allDateContainers).map(el => el.getAttribute('data-date'));
          const todayIndex = dates.indexOf(today);
          if (todayIndex === 1) return container;
        }
        return null;
      };

      let attempts = 0;
      const maxAttempts = 50;
      const retryInterval = 200;

      const attemptScroll = () => {
        timeTableRef.current?.setCurrentDate(now);
        const todayContainer = checkTodayContainer();
        if (todayContainer) {
          scrollToTime(todayContainer, now.getHours(), now.getMinutes());
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(attemptScroll, retryInterval);
        }
      };

      attemptScroll();
    };

    initializeView();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const handleScroll = (_event: React.UIEvent<HTMLDivElement>) => {
    // scroll handler reserved for future use
  };

  const handleTypeSelect = async (typeUid: number, projectUid?: number | null) => {
    const blocksToUpsert: BlockModel[] = Object.entries(selectedBlocks).filter(([_, value]) => !!value).map(([key, _]) => {
      return {
        date: keyToTimestamp(key),
        type_: { uid: typeUid },
        project: projectUid ? { uid: projectUid } : null,
        comment: '',
        operation: 'upsert',
      }
    });
    try {
      const result = await blockService.updateBlocks(blocksToUpsert);
      if (result) {
        dispatch(clearSelection());
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
      const blocksToDelete: BlockModel[] = Object.entries(selectedBlocks)
        .filter(([_, value]) => !!value)
        .map(([key, _]) => ({
          date: keyToTimestamp(key),
          type_: null,
          project: null,
          comment: '',
          operation: 'delete' as const,
        }));
      await blockService.updateBlocks(blocksToDelete);
      dispatch(clearSelection());
      dispatch(triggerRefresh());
    } catch (error) {
      console.error('Error deleting blocks:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const scrollToCurrentTime = () => {
    if (viewMode === 'week') {
      weekViewRef.current?.goToCurrentWeek();
      return;
    }

    if (!timeTableContainerRef.current) return;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = now.toISOString().split('T')[0];

    timeTableRef.current?.setCurrentDate(now);

    setTimeout(() => {
      const todayContainer = timeTableContainerRef.current?.querySelector(`[data-date="${today}"]`);
      if (todayContainer) {
        scrollToTime(todayContainer, currentHour, currentMinute);
      }
    }, 100);
  };

  const scrollToTime = (container: Element, hour: number, minute: number) => {
    if (!timeTableContainerRef.current) return;
    const hourHeight = 40;
    const timeScrollPosition = (hour * hourHeight) + (minute / 60 * hourHeight);
    const containerRect = container.getBoundingClientRect();
    const containerOffsetTop = containerRect.top;
    const viewportHeight = timeTableContainerRef.current.clientHeight;
    const finalScrollPosition = containerOffsetTop + timeScrollPosition - (viewportHeight / 2);
    timeTableContainerRef.current.scrollTo({ top: finalScrollPosition, behavior: 'smooth' });
  };

  React.useImperativeHandle(ref, () => ({
    scrollToCurrentTime
  }));

  const handleSwitchToWeek = () => {
    setViewMode('week');
  };

  const handleSwitchToScroll = () => {
    setViewMode('scroll');
  };

  return (
    <div className="main-ui">
      <div className="view-toggle-bar">
        <button
          className={`view-toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
          onClick={handleSwitchToWeek}
        >
          Week View
        </button>
        <button
          className={`view-toggle-btn ${viewMode === 'scroll' ? 'active' : ''}`}
          onClick={handleSwitchToScroll}
        >
          Scroll View
        </button>
      </div>

      <div className="main-ui-content">
        {viewMode === 'week' ? (
          <div className="time-table-container week-view-container">
            <WeekView ref={weekViewRef} />
          </div>
        ) : (
          <div className="time-table-container" ref={timeTableContainerRef} onScroll={handleScroll}>
            <TimeTable
              ref={timeTableRef}
              containerRef={timeTableContainerRef}
            />
          </div>
        )}

        <div className="type-selector-container">
          <TypeSelector onTypeSelect={handleTypeSelect} />
        </div>
      </div>

      {displayBlockCount > 0 && (
        <div className="selection-info-fixed">
          <span>{displayBlockCount} {config.mainTimePrecision === "HALF_HOUR" ? 'half-hour' : 'quarter-hour'} block{displayBlockCount !== 1 ? 's' : ''} selected</span>
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
