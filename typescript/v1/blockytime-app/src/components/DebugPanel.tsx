import React from 'react';
import { useAppSelector } from '../store/hooks';

export const DebugPanel: React.FC = () => {
  const { selectedBlocks, isDragging, dragStartBlock } = useAppSelector(state => state.selection);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      maxWidth: '300px',
      maxHeight: '200px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <div><strong>isDragging:</strong> {isDragging ? 'true' : 'false'}</div>
      <div><strong>dragStartBlock:</strong> {dragStartBlock ? JSON.stringify(dragStartBlock) : 'null'}</div>
      <div><strong>Selected Blocks:</strong> {Object.keys(selectedBlocks).length}</div>
      <div style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
        {Object.keys(selectedBlocks).map(blockId => (
          <div key={blockId}>{blockId}</div>
        ))}
      </div>
    </div>
  );
}; 