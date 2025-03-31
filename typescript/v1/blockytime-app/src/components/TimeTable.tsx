import React, { useEffect, useRef, useState } from 'react';
import { TimeBlock } from './TimeBlock';
import './TimeTable.css';

interface BlockData {
  id: number;
  leftColor: string;
  rightColor: string;
  timestamp: string;
}

export const TimeTable: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState(new Date());

  const BLOCK_HEIGHT = 30; // height of each 30-minute block in pixels
  const BUFFER_BLOCKS = 48; // 24 hours worth of blocks

  const fetchBlocks = async (date: Date, direction: 'before' | 'after') => {
    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/blocks?date=${date.toISOString()}&direction=${direction}`);
      const newBlocks = await response.json();
      
      setBlocks(prevBlocks => {
        if (direction === 'before') {
          return [...newBlocks, ...prevBlocks];
        } else {
          return [...prevBlocks, ...newBlocks];
        }
      });
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    // Load more when scrolling up
    if (scrollTop < BLOCK_HEIGHT * 2) {
      const newStartDate = new Date(startDate);
      newStartDate.setDate(startDate.getDate() - 1);
      setStartDate(newStartDate);
      fetchBlocks(newStartDate, 'before');
    }

    // Load more when scrolling down
    if (scrollHeight - (scrollTop + clientHeight) < BLOCK_HEIGHT * 2) {
      const newStartDate = new Date(startDate);
      newStartDate.setDate(startDate.getDate() + 1);
      setStartDate(newStartDate);
      fetchBlocks(newStartDate, 'after');
    }
  };

  useEffect(() => {
    // Initial load
    fetchBlocks(startDate, 'after');
  }, []);

  return (
    <div 
      ref={containerRef}
      className="time-table-container"
      onScroll={handleScroll}
    >
      {loading && <div className="loading">Loading...</div>}
      <div className="time-table">
        {blocks.map((block) => (
          <TimeBlock
            key={block.id}
            leftColor={block.leftColor}
            rightColor={block.rightColor}
            timestamp={block.timestamp}
          />
        ))}
      </div>
    </div>
  );
}; 