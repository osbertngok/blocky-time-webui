import React, { useRef, useState } from 'react';
import { TimeTable } from './TimeTable';
import { TypeSelector } from './TypeSelector';
import { TypeModel } from '../models/type';
import './MainUI.css';

interface MainUIProps {
  // Props can be added later if needed
}

export const MainUI: React.FC<MainUIProps> = () => {
  const timeTableContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTypeUid, setSelectedTypeUid] = useState<number | null>(null);
  const [selectedProjectUid, setSelectedProjectUid] = useState<number | null>(null);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    // The scroll event will be triggered on the container
    console.log('Container scrolled');
  };

  const handleTypeSelect = (typeUid: number, projectUid?: number | null) => {
    setSelectedTypeUid(typeUid);
    setSelectedProjectUid(projectUid || null);
    console.log('Selected type:', typeUid, 'Selected project:', projectUid);
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
    </div>
  );
}; 