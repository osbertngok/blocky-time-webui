import React, { createContext, useContext } from 'react';
import { BlockService, BlockServiceInterface } from '../services/blockservice';
import { TypeService, TypeServiceInterface } from '../services/typeservice';
import { ConfigService } from '../services/configservice';
import { ConfigServiceInterface } from '../interfaces/configserviceinterface';

interface ServiceContextType {
  blockService: BlockServiceInterface;
  typeService: TypeServiceInterface;
  configService: ConfigServiceInterface;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const blockService = new BlockService();
  const typeService = new TypeService();
  const configService = new ConfigService()

  return (
    <ServiceContext.Provider value={{ blockService, typeService, configService }}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useBlockService = (): BlockServiceInterface => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useBlockService must be used within a ServiceProvider');
  }
  return context.blockService;
};

export const useConfigService = (): ConfigServiceInterface => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useConfigService must be used within a ServiceProvider');
  }
  return context.configService;
};

export const useTypeService = (): TypeServiceInterface => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useTypeService must be used within a ServiceProvider');
  }
  return context.typeService;
}; 