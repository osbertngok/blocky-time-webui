import React, { useState, useEffect } from 'react';
import { TypeModel } from '../models/type';
import { useTypeService } from '../contexts/ServiceContext';
import { 
  List, 
  ListItemButton, 
  ListItemText, 
  Collapse, 
  Box, 
  Typography, 
  CircularProgress,
  Paper
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import './TypeSelector.css';

interface TypeSelectorProps {
  onTypeSelect?: (typeUid: number, projectUid?: number | null) => void;
}

export const TypeSelector: React.FC<TypeSelectorProps> = ({ onTypeSelect }) => {
  const [types, setTypes] = useState<TypeModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Record<number, boolean>>({});
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

  const handleTypeClick = (typeUid: number, projectUid?: number | null) => {
    if (onTypeSelect) {
      onTypeSelect(typeUid, projectUid);
    }
  };

  const handleToggleExpand = (typeUid: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedTypes(prev => ({
      ...prev,
      [typeUid]: !prev[typeUid]
    }));
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

  const getColorStyle = (color?: number) => {
    if (!color) return {};
    const hexColor = `#${color.toString(16).padStart(6, '0')}`;
    return {
      backgroundColor: hexColor,
      color: isLightColor(hexColor) ? '#000' : '#fff'
    };
  };

  // Helper to determine if a color is light or dark
  const isLightColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  return (
    <Paper elevation={2} className="type-selector">
      <Box className="type-selector-header">
        <Typography variant="h6">Activity Types</Typography>
      </Box>
      
      <Box className="type-selector-content">
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : types.length === 0 ? (
          <Typography variant="body2" color="textSecondary" align="center" p={3}>
            No activity types found
          </Typography>
        ) : (
          Object.entries(groupedTypes).map(([categoryName, categoryTypes]) => (
            <Box key={categoryName} mb={2}>
              <Typography variant="subtitle1" fontWeight="bold" px={2} py={1}>
                {categoryName}
              </Typography>
              <List component="div" disablePadding dense>
                {categoryTypes.map(type => {
                  const isExpanded = !!expandedTypes[type.uid];
                  const hasProjects = type.projects && type.projects.length > 0;
                  const colorStyle = getColorStyle(type.color);
                  
                  return (
                    <React.Fragment key={type.uid}>
                      <ListItemButton 
                        sx={{
                          ...colorStyle,
                          borderRadius: '4px',
                          margin: '2px 8px',
                          '&:hover': {
                            // Remove hover effect
                            backgroundColor: colorStyle.backgroundColor || 'inherit',
                            opacity: 1
                          },
                          '&.Mui-selected': {
                            backgroundColor: colorStyle.backgroundColor || 'inherit',
                          }
                        }}
                        onClick={() => handleTypeClick(type.uid)}
                        disableRipple
                      >
                        <Box 
                          width={24}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          mr={1}
                          onClick={(e) => hasProjects && handleToggleExpand(type.uid, e)}
                          sx={{ cursor: hasProjects ? 'pointer' : 'default' }}
                        >
                          {hasProjects && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
                        </Box>
                        <ListItemText primary={type.name} />
                      </ListItemButton>
                      
                      {hasProjects && (
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding dense>
                            {type.projects?.map(project => (
                              <ListItemButton
                                key={project.uid}
                                sx={{ 
                                  ...colorStyle,
                                  pl: 4,
                                  borderRadius: '4px',
                                  margin: '2px 8px 2px 32px', // Shorter width, aligned right
                                  '&:hover': {
                                    // Remove hover effect
                                    backgroundColor: colorStyle.backgroundColor || 'inherit',
                                    opacity: 1
                                  }
                                }}
                                onClick={() => handleTypeClick(type.uid, project.uid)}
                                disableRipple
                              >
                                <Box width={8} height={8} borderRadius="50%" bgcolor="currentColor" mr={1} />
                                <ListItemText 
                                  primary={
                                    <Typography variant="body2">
                                      {project.abbr ? `${project.abbr}: ` : ''}{project.name}
                                    </Typography>
                                  } 
                                />
                              </ListItemButton>
                            ))}
                          </List>
                        </Collapse>
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
}; 