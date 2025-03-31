import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define a type for a time block cell identifier
export interface TimeBlockId {
  dateStr: string;
  hour: number;
  minute: number;
}

// Format: dateStr-hour-minute (e.g., "2023-05-01-14-30")
export const formatTimeBlockId = (id: TimeBlockId): string => 
  `${id.dateStr}-${id.hour}-${id.minute}`;

export const parseTimeBlockId = (id: string): TimeBlockId => {
  const parts = id.split('-');
  return {
    dateStr: `${parts[0]}-${parts[1]}-${parts[2]}`,
    hour: parseInt(parts[3]),
    minute: parseInt(parts[4])
  };
};

interface SelectionState {
  selectedBlocks: Record<string, boolean>; // Map of block IDs to selection state
  dragStartBlock: TimeBlockId | null;
  isDragging: boolean;
}

const initialState: SelectionState = {
  selectedBlocks: {},
  dragStartBlock: null,
  isDragging: false,
};

export const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    toggleBlockSelection: (state, action: PayloadAction<TimeBlockId>) => {
      const blockId = formatTimeBlockId(action.payload);
      state.selectedBlocks[blockId] = !state.selectedBlocks[blockId];
      
      // If the block is now unselected, delete it from the map
      if (!state.selectedBlocks[blockId]) {
        delete state.selectedBlocks[blockId];
      }
    },
    
    startDragSelection: (state, action: PayloadAction<TimeBlockId>) => {
      // Clear existing selections when starting a new drag
      state.selectedBlocks = {};
      state.dragStartBlock = action.payload;
      state.isDragging = true;
      
      // Select the starting block
      const blockId = formatTimeBlockId(action.payload);
      state.selectedBlocks[blockId] = true;
    },
    
    updateDragSelection: (state, action: PayloadAction<TimeBlockId>) => {
      if (!state.isDragging || !state.dragStartBlock) return;
      
      // Clear previous selections
      state.selectedBlocks = {};
      
      // Get the range of blocks to select
      const start = state.dragStartBlock;
      const end = action.payload;
      
      // If dates are different, only select blocks on the start date for now
      // (This can be enhanced to handle multi-day selections if needed)
      if (start.dateStr !== end.dateStr) {
        // Select all blocks in the start date from start time to end of day
        for (let hour = start.hour; hour < 24; hour++) {
          for (let minute = 0; minute < 60; minute += 15) {
            // Skip times before the start time
            if (hour === start.hour && minute < start.minute) continue;
            
            const blockId = formatTimeBlockId({
              dateStr: start.dateStr,
              hour,
              minute
            });
            state.selectedBlocks[blockId] = true;
          }
        }
        
        // Select all blocks in the end date from start of day to end time
        for (let hour = 0; hour <= end.hour; hour++) {
          for (let minute = 0; minute < 60; minute += 15) {
            // Skip times after the end time
            if (hour === end.hour && minute > end.minute) continue;
            
            const blockId = formatTimeBlockId({
              dateStr: end.dateStr,
              hour,
              minute
            });
            state.selectedBlocks[blockId] = true;
          }
        }
      } else {
        // Same date - select all blocks between start and end times
        const startTime = start.hour * 60 + start.minute;
        const endTime = end.hour * 60 + end.minute;
        
        // Determine actual start and end (in case of backwards selection)
        const minTime = Math.min(startTime, endTime);
        const maxTime = Math.max(startTime, endTime);
        
        for (let totalMinutes = minTime; totalMinutes <= maxTime; totalMinutes += 15) {
          const hour = Math.floor(totalMinutes / 60);
          const minute = totalMinutes % 60;
          
          const blockId = formatTimeBlockId({
            dateStr: start.dateStr,
            hour,
            minute
          });
          state.selectedBlocks[blockId] = true;
        }
      }
    },
    
    endDragSelection: (state) => {
      state.isDragging = false;
      state.dragStartBlock = null;
    },
    
    clearSelection: (state) => {
      state.selectedBlocks = {};
      state.isDragging = false;
      state.dragStartBlock = null;
    }
  },
});

export const { 
  toggleBlockSelection, 
  startDragSelection, 
  updateDragSelection, 
  endDragSelection,
  clearSelection
} = selectionSlice.actions;

export default selectionSlice.reducer; 