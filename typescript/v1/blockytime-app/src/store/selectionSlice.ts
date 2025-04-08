import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define a type for a time block cell identifier
export interface TimeBlockId {
  dateStr: string;
  hour: number;
  minute: number;
}

// Define payload type for actions that need to handle half-hour blocks
interface TimeBlockPayload {
  block: TimeBlockId;
  isHalfHour: boolean;
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

export interface SelectionState {
  selectedBlocks: Record<string, boolean>;
  dragStartBlock: TimeBlockPayload | null;
  isDragging: boolean;
  refreshCounter: number;
}

const initialState: SelectionState = {
  selectedBlocks: {},
  dragStartBlock: null,
  isDragging: false,
  refreshCounter: 0,
};

// Helper function to select a block and its pair if needed
const selectBlockAndPair = (
  state: SelectionState, 
  block: TimeBlockId, 
  isHalfHour: boolean, 
  selected: boolean = true
) => {
  const blockId = formatTimeBlockId(block);
  if (selected) {
    state.selectedBlocks[blockId] = true;
    if (isHalfHour && block.minute % 30 === 0) {
      // If it's the first block of a 30-minute pair, select the next one
      const nextBlock = {
        ...block,
        minute: block.minute + 15
      };
      state.selectedBlocks[formatTimeBlockId(nextBlock)] = true;
    } else if (isHalfHour && block.minute % 30 === 15) {
      // If it's the second block of a 30-minute pair, select the previous one
      const prevBlock = {
        ...block,
        minute: block.minute - 15
      };
      state.selectedBlocks[formatTimeBlockId(prevBlock)] = true;
    }
  } else {
    delete state.selectedBlocks[blockId];
    if (isHalfHour) {
      if (block.minute % 30 === 0) {
        delete state.selectedBlocks[formatTimeBlockId({ ...block, minute: block.minute + 15 })];
      } else if (block.minute % 30 === 15) {
        delete state.selectedBlocks[formatTimeBlockId({ ...block, minute: block.minute - 15 })];
      }
    }
  }
};

export const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    toggleBlockSelection: (state, action: PayloadAction<TimeBlockPayload>) => {
      const { block, isHalfHour } = action.payload;
      const blockId = formatTimeBlockId(block);
      const isSelected = !state.selectedBlocks[blockId];
      selectBlockAndPair(state, block, isHalfHour, isSelected);
    },
    
    startDragSelection: (state, action: PayloadAction<TimeBlockPayload>) => {
      state.selectedBlocks = {};
      state.dragStartBlock = action.payload;
      state.isDragging = true;
      selectBlockAndPair(state, action.payload.block, action.payload.isHalfHour, true);
    },
    
    updateDragSelection: (state, action: PayloadAction<TimeBlockPayload>) => {
      if (!state.isDragging || !state.dragStartBlock) return;
      
      state.selectedBlocks = {};
      const { block: endBlock, isHalfHour } = action.payload;
      const { block: startBlock } = state.dragStartBlock;
      
      // Calculate time ranges
      const startTime = startBlock.hour * 60 + startBlock.minute;
      const endTime = endBlock.hour * 60 + endBlock.minute;
      
      const minTime = Math.min(startTime, endTime);
      const maxTime = Math.max(startTime, endTime);
      
      // Select all blocks in the range
      for (let time = minTime; time <= maxTime; time += (isHalfHour ? 30 : 15)) {
        const hour = Math.floor(time / 60);
        const minute = time % 60;
        
        selectBlockAndPair(
          state,
          { dateStr: startBlock.dateStr, hour, minute },
          isHalfHour,
          true
        );
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
    },
    
    triggerRefresh: (state) => {
      state.refreshCounter += 1;
    }
  },
});

export const { 
  toggleBlockSelection, 
  startDragSelection, 
  updateDragSelection, 
  endDragSelection,
  clearSelection,
  triggerRefresh
} = selectionSlice.actions;

export default selectionSlice.reducer;