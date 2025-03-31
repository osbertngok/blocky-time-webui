import React, { useRef, useState } from 'react';
import { TimeTable } from './TimeTable';
import { TypeSelector } from './TypeSelector';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearSelection } from '../store/selectionSlice';
import './MainUI.css';
import { DebugPanel } from './DebugPanel';

interface MainUIProps {
  // Props can be added later if needed
}

export const MainUI: React.FC<MainUIProps> = () => {
  const timeTableContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTypeUid, setSelectedTypeUid] = useState<number | null>(null);
  const [selectedProjectUid, setSelectedProjectUid] = useState<number | null>(null);
  
  const dispatch = useAppDispatch();
  const { selectedBlocks } = useAppSelector(state => state.selection);
  
  // Count selected blocks
  const selectedBlockCount = Object.keys(selectedBlocks).length;
  
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    // The scroll event handler can be simplified or removed if not needed
  };

  const handleTypeSelect = (typeUid: number, projectUid?: number | null) => {
    setSelectedTypeUid(typeUid);
    setSelectedProjectUid(projectUid || null);
  };
  
  const handleClearSelection = () => {
    dispatch(clearSelection());
  };

  return (
    <div className="main-ui">
      <div 
        className="time-table-container" 
        ref={timeTableContainerRef}
        onScroll={handleScroll}
      >
        <TimeTable 
          containerRef={timeTableContainerRef}
          selectedTypeUid={selectedTypeUid}
          selectedProjectUid={selectedProjectUid}
        />
      </div>
      <div className="type-selector-container">
        <TypeSelector onTypeSelect={handleTypeSelect} />
      </div>
      
      {/* Fixed selection info at bottom of screen */}
      {selectedBlockCount > 0 && (
        <div className="selection-info-fixed">
          <span>{selectedBlockCount} blocks selected</span>
          <button onClick={handleClearSelection}>Clear Selection</button>
        </div>
      )}
      
      <DebugPanel />
    </div>
  );
}; 