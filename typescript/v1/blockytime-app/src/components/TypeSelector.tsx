import React, { useState, useEffect } from 'react';
import { TypeModel } from '../models/type';
import { useTypeService } from '../contexts/ServiceContext';
import './TypeSelector.css';

interface TypeSelectorProps {
  onTypeSelect?: (type: TypeModel) => void;
}

export const TypeSelector: React.FC<TypeSelectorProps> = ({ onTypeSelect }) => {
  const [types, setTypes] = useState<TypeModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<TypeModel | null>(null);
  const typeService = useTypeService();

  useEffect(() => {
    const fetchTypes = async () => {
      setLoading(true);
      try {
        const fetchedTypes = await typeService.getTypes();
        setTypes(fetchedTypes);
      } catch (error) {
        console.error('Error fetching types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTypes();
  }, [typeService]);

  const handleTypeClick = (type: TypeModel) => {
    setSelectedType(type);
    if (onTypeSelect) {
      onTypeSelect(type);
    }
  };

  // Group types by category
  const groupedTypes: Record<string, TypeModel[]> = {};
  types.forEach(type => {
    const categoryName = type.category?.name || 'Uncategorized';
    if (!groupedTypes[categoryName]) {
      groupedTypes[categoryName] = [];
    }
    groupedTypes[categoryName].push(type);
  });

  return (
    <div className="type-selector">
      <div className="type-selector-header">
        <h2>Activity Types</h2>
      </div>
      <div className="type-selector-content">
        {loading ? (
          <div className="loading">Loading types...</div>
        ) : types.length === 0 ? (
          <p className="placeholder-text">No activity types found</p>
        ) : (
          Object.entries(groupedTypes).map(([categoryName, categoryTypes]) => (
            <div key={categoryName} className="type-category">
              <h3>{categoryName}</h3>
              <div className="type-list">
                {categoryTypes.map(type => (
                  <div
                    key={type.uid}
                    className={`type-item ${selectedType?.uid === type.uid ? 'selected' : ''}`}
                    style={{
                      backgroundColor: type.color ? `#${type.color.toString(16).padStart(6, '0')}` : undefined
                    }}
                    onClick={() => handleTypeClick(type)}
                  >
                    <span className="type-name">{type.name}</span>
                    {type.projects && type.projects.length > 0 && (
                      <div className="type-projects">
                        <span className="projects-count">{type.projects.length} projects</span>
                        <div className="projects-list">
                          {type.projects.map(project => (
                            <div key={project.uid} className="project-item">
                              {project.abbr ? `${project.abbr}: ` : ''}{project.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 