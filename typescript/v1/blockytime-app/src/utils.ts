  // Convert decimal color to CSS hex color
  export const getColorFromDecimal = (decimalColor?: number): string => {
    if (decimalColor === undefined || decimalColor === null) {
      return 'transparent';
    }
    
    // Convert decimal to hex string and ensure it has 6 digits
    const hexColor = decimalColor.toString(16).padStart(6, '0');
    return `#${hexColor}`;
  };