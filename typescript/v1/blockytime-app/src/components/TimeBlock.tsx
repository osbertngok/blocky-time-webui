import React from 'react';
import './TimeBlock.css';

interface TimeBlockProps {
  leftColor: string;
  rightColor: string;
  timestamp: string;
}

export const TimeBlock: React.FC<TimeBlockProps> = ({ leftColor, rightColor, timestamp }) => {
  const time = new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="time-block">
      <div className="time-label">{time}</div>
      <div className="block-cells">
        <div className="cell left" style={{ backgroundColor: leftColor }} />
        <div className="cell right" style={{ backgroundColor: rightColor }} />
      </div>
    </div>
  );
}; 