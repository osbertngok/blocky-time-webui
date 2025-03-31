import React from 'react';
import './TypeSelector.css';

interface TypeSelectorProps {
  // Props will be added later when implementing functionality
}

export const TypeSelector: React.FC<TypeSelectorProps> = () => {
  return (
    <div className="type-selector">
      <div className="type-selector-header">
        <h2>Activity Types</h2>
      </div>
      <div className="type-selector-content">
        <p className="placeholder-text">Type selector will be implemented here</p>
        <div className="type-category">
          <h3>Work</h3>
          <div className="type-list">
            <div className="type-item placeholder">Coding</div>
            <div className="type-item placeholder">Meetings</div>
            <div className="type-item placeholder">Planning</div>
          </div>
        </div>
        <div className="type-category">
          <h3>Personal</h3>
          <div className="type-list">
            <div className="type-item placeholder">Exercise</div>
            <div className="type-item placeholder">Reading</div>
            <div className="type-item placeholder">Relaxation</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 