import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { BlockModel } from '../models/block';
import { useBlockService, useConfigService } from '../contexts/ServiceHooks';
import './WeekView.css';
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
import { getColorFromDecimal } from '../utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_ROW_HEIGHT = 20;
const MIN_ROW_HEIGHT = 5;
const MAX_ROW_HEIGHT = 40;
const STORAGE_KEY_ROW_HEIGHT = 'weekViewRowHeight';

// Get Monday of the week containing the given date
const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface WeekViewProps {
  // no extra props needed for now
}

export const WeekView = forwardRef<{ goToCurrentWeek: () => void }, WeekViewProps>((_props, ref) => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [blocks, setBlocks] = useState<Record<string, BlockModel[]>>({});
  const [config, setConfig] = useState<BlockyTimeConfig>({
    mainTimePrecision: 'QUARTER_HOUR',
    disablePixelate: false,
    specialTimePeriod: []
  });
  const [rowHeight, setRowHeight] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_ROW_HEIGHT);
    return stored ? parseInt(stored, 10) : DEFAULT_ROW_HEIGHT;
  });
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const blockService = useBlockService();
  const configService = useConfigService();
  const dispatch = useAppDispatch();
  const { selectedBlocks, isDragging, refreshCounter } = useAppSelector(state => state.selection);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevRefreshCounterRef = useRef(0);

  // Expose goToCurrentWeek
  useImperativeHandle(ref, () => ({
    goToCurrentWeek: () => {
      setWeekStart(getMondayOfWeek(new Date()));
    }
  }), []);

  // Fetch config
  useEffect(() => {
    const fetchConfig = async () => {
      const fetchedConfig = await configService.getConfigAsync();
      setConfig(fetchedConfig);
    };
    fetchConfig();
  }, [configService]);

  // Fetch blocks for current week
  const fetchWeekBlocks = useCallback(async (monday: Date) => {
    const endDate = new Date(monday);
    endDate.setDate(endDate.getDate() + 7);
    try {
      const fetchedBlocks = await blockService.getBlocks(monday, endDate);
      const byDate: Record<string, BlockModel[]> = {};
      fetchedBlocks.forEach(block => {
        const dateStr = formatDateString(new Date(block.date * 1000));
        if (!byDate[dateStr]) byDate[dateStr] = [];
        byDate[dateStr].push(block);
      });
      setBlocks(byDate);
    } catch (err) {
      console.error('Error fetching week blocks:', err);
    }
  }, [blockService]);

  useEffect(() => {
    fetchWeekBlocks(weekStart);
  }, [weekStart, fetchWeekBlocks]);

  // Re-fetch on refresh
  useEffect(() => {
    if (refreshCounter > prevRefreshCounterRef.current) {
      fetchWeekBlocks(weekStart);
      prevRefreshCounterRef.current = refreshCounter;
    }
  }, [refreshCounter, weekStart, fetchWeekBlocks]);

  // Update current time every 30s
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Persist row height
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROW_HEIGHT, String(rowHeight));
  }, [rowHeight]);

  // Clean up long press on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    };
  }, []);

  // Global mouseup
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) dispatch(endDragSelection());
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

  const isHalfHour = config.mainTimePrecision === 'HALF_HOUR';
  const slotMinutes = isHalfHour ? 30 : 15;
  const slotsPerDay = (24 * 60) / slotMinutes; // 96 or 48

  // Build week date strings
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    weekDates.push(d);
  }
  const weekDateStrings = weekDates.map(formatDateString);

  // Block lookup
  const getBlock = (dateStr: string, hour: number, minute: number): BlockModel | undefined => {
    const dateBlocks = blocks[dateStr] || [];
    return dateBlocks.find(b => {
      const bd = new Date(b.date * 1000);
      return bd.getHours() === hour && Math.floor(bd.getMinutes() / slotMinutes) * slotMinutes === minute;
    });
  };

  // Mouse handlers
  const handleBlockMouseDown = (blockId: TimeBlockId) => {
    setIsMouseDown(true);
    longPressTimeoutRef.current = setTimeout(() => {
      dispatch(startDragSelection({ block: blockId, isHalfHour }));
    }, 200);
  };

  const handleBlockMouseMove = (blockId: TimeBlockId) => {
    if (isDragging && isMouseDown) {
      dispatch(updateDragSelection({ block: blockId, isHalfHour }));
    }
  };

  const handleBlockMouseUp = (blockId: TimeBlockId) => {
    setIsMouseDown(false);
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    if (isDragging) {
      dispatch(endDragSelection());
    } else {
      dispatch(toggleBlockSelection({ block: blockId, isHalfHour }));
    }
  };

  const handleBlockMouseLeave = () => {
    if (!isDragging) {
      setIsMouseDown(false);
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    }
  };

  // Current time indicator position
  const todayStr = formatDateString(currentTime);
  const currentSlotIndex = (currentTime.getHours() * 60 + currentTime.getMinutes()) / slotMinutes;
  const currentTimeTopPx = currentSlotIndex * rowHeight;

  // Navigation
  const goToPrevWeek = () => {
    setWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };
  const goToNextWeek = () => {
    setWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };
  const goToCurrentWeek = () => setWeekStart(getMondayOfWeek(new Date()));

  // Format week range for display
  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${weekEndDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Render a single cell
  const renderCell = (dateStr: string, slotIndex: number) => {
    const hour = Math.floor((slotIndex * slotMinutes) / 60);
    const minute = (slotIndex * slotMinutes) % 60;
    const block = getBlock(dateStr, hour, minute);
    const blockId: TimeBlockId = { dateStr, hour, minute };
    const formattedId = formatTimeBlockId(blockId);
    const isSelected = !!selectedBlocks[formattedId];
    const backgroundColor = getColorFromDecimal(block?.type_?.color);
    const blockText = block?.project?.abbr || '';

    return (
      <div
        key={`${dateStr}-${slotIndex}`}
        className={`wv-cell ${block ? 'has-data' : ''} ${isSelected ? 'selected' : ''}`}
        style={{ backgroundColor, height: `${rowHeight}px` }}
        onMouseDown={e => { e.stopPropagation(); handleBlockMouseDown(blockId); }}
        onMouseMove={e => { e.stopPropagation(); handleBlockMouseMove(blockId); }}
        onMouseUp={e => { e.stopPropagation(); handleBlockMouseUp(blockId); }}
        onMouseLeave={handleBlockMouseLeave}
        onTouchStart={e => { e.stopPropagation(); handleBlockMouseDown(blockId); }}
        onTouchEnd={e => { e.stopPropagation(); handleBlockMouseUp(blockId); }}
        data-block-id={`${dateStr}-${hour}-${minute}`}
      >
        {blockText && <span className="wv-block-text">{blockText}</span>}
        {block && (
          <div className="wv-block-info">
            <div className="type">{block.type_?.name || 'No Type'}</div>
            <div className="project">{block.project?.name || 'No Project'}</div>
            {block.comment && <div className="comment">{block.comment}</div>}
          </div>
        )}
        {isSelected && <div className="selection-overlay" />}
      </div>
    );
  };

  // Build hour label rows (one per slot)
  const renderHourLabel = (slotIndex: number) => {
    const totalMinutes = slotIndex * slotMinutes;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    // Show label only on hour boundary or every 4 slots at small zoom
    const showLabel = minute === 0 || (rowHeight >= 15 && minute % 30 === 0);
    return (
      <div
        key={`label-${slotIndex}`}
        className="wv-hour-label"
        style={{ height: `${rowHeight}px` }}
      >
        {showLabel && (
          <span>{String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}</span>
        )}
      </div>
    );
  };

  return (
    <div className="week-view">
      {/* Toolbar */}
      <div className="wv-toolbar">
        <button className="wv-nav-btn" onClick={goToPrevWeek}>&#8249; Prev</button>
        <button className="wv-nav-btn wv-today-btn" onClick={goToCurrentWeek}>Today</button>
        <button className="wv-nav-btn" onClick={goToNextWeek}>Next &#8250;</button>
        <span className="wv-week-label">{weekLabel}</span>
        <label className="wv-zoom-label">
          Zoom
          <input
            type="range"
            min={MIN_ROW_HEIGHT}
            max={MAX_ROW_HEIGHT}
            value={rowHeight}
            onChange={e => setRowHeight(parseInt(e.target.value, 10))}
            className="wv-zoom-slider"
          />
          <span className="wv-zoom-value">{rowHeight}px</span>
        </label>
      </div>

      {/* Grid wrapper (scrollable) */}
      <div className="wv-grid-wrapper">
        {/* Sticky header row */}
        <div className="wv-header-row">
          <div className="wv-corner" />
          {weekDates.map((date, i) => {
            const dateStr = weekDateStrings[i];
            const isToday = dateStr === formatDateString(new Date());
            return (
              <div key={dateStr} className={`wv-day-header ${isToday ? 'is-today' : ''}`}>
                <div className="wv-day-name">{WEEKDAYS[i]}</div>
                <div className="wv-day-date">{date.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Scrollable body */}
        <div className="wv-body">
          {/* Hour label column */}
          <div className="wv-labels-col">
            {Array.from({ length: slotsPerDay }, (_, i) => renderHourLabel(i))}
          </div>

          {/* Day columns */}
          {weekDateStrings.map((dateStr, _colIndex) => (
            <div key={dateStr} className="wv-day-col" style={{ position: 'relative' }}>
              {Array.from({ length: slotsPerDay }, (_, slotIndex) => renderCell(dateStr, slotIndex))}
              {/* Current time indicator */}
              {dateStr === todayStr && (
                <div
                  className="wv-time-indicator"
                  style={{ top: `${currentTimeTopPx}px` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
