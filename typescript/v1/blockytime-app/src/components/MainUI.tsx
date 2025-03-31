import React, { useRef } from 'react';
import { TimeTable } from './TimeTable';
import { TypeSelector } from './TypeSelector';
import './MainUI.css';

interface MainUIProps {
  // Props can be added later if needed
}

export const MainUI: React.FC<MainUIProps> = () => {
  const timeTableContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    // The scroll event will be triggered on the container
    console.log('Container scrolled');
  };

  return (
    <div className="main-ui">
      <div 
        className="time-table-container" 
        ref={timeTableContainerRef}
        onScroll={handleScroll}
      >
        <TimeTable containerRef={timeTableContainerRef} />
      </div>
      <div className="type-selector-container">
        <TypeSelector />
      </div>
    </div>
  );
}; 