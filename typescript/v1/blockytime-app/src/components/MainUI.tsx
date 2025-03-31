import React, { useRef, useState } from 'react';
import { TimeTable } from './TimeTable';
import { TypeSelector } from './TypeSelector';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearSelection } from '../store/selectionSlice';
import './MainUI.css';
import { DebugPanel } from './DebugPanel';
import { useBlockService } from '../contexts/ServiceContext';
import { BlockModel } from '../models/block';

interface MainUIProps {
  // Props can be added later if needed
}

const keyToTimestamp = (key: string): number => {
  const [year, month, day, hour, minute] = key.split('-');
  return new Date(`${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`).getTime() / 1000;
}

export const MainUI: React.FC<MainUIProps> = () => {
  const timeTableContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTypeUid, setSelectedTypeUid] = useState<number | null>(null);
  const [selectedProjectUid, setSelectedProjectUid] = useState<number | null>(null);
  
  const dispatch = useAppDispatch();
  // keys of selectedBlocks are things like
  // 2025-03-28-2-0
  // 2025-03-28-2-15
  // 2025-03-28-2-30
  // 2025-03-28-2-45
  const { selectedBlocks } = useAppSelector(state => state.selection);
  const blockService = useBlockService();
  
  // Count selected blocks
  const selectedBlockCount = Object.keys(selectedBlocks).length;
  
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    // The scroll event handler can be simplified or removed if not needed
  };

  const handleTypeSelect = (typeUid: number, projectUid?: number | null) => {
    setSelectedTypeUid(typeUid);
    setSelectedProjectUid(projectUid || null);

    blockService.updateBlocks(Object.entries(selectedBlocks).filter(([_, value]) => !!value).map(([key, _]) => {
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
    }));
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