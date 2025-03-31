import React, { createContext, useContext, ReactNode } from 'react';
import { BlockServiceInterface, BlockService } from '../services/blockservice';

interface ServiceContextType {
  blockService: BlockServiceInterface;
}

// Create default services
const defaultServices: ServiceContextType = {
  blockService: new BlockService()
};

// Create context
const ServiceContext = createContext<ServiceContextType>(defaultServices);

// Provider component
interface ServiceProviderProps {
  services?: Partial<ServiceContextType>;
  children: ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ 
  services, 
  children 
}) => {
  // Merge default services with provided services
  const value = {
    ...defaultServices,
    ...services
  };
  
  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
};

// Hook for using services
export const useServices = () => useContext(ServiceContext);

// Specific hooks for individual services
export const useBlockService = () => useContext(ServiceContext).blockService; 