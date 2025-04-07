import { createContext, useContext } from 'react';
import { BlockServiceInterface } from '../services/blockservice';
import { TypeServiceInterface } from '../services/typeservice';
import { ConfigServiceInterface } from '../interfaces/configserviceinterface';

interface ServiceContextType {
    blockService: BlockServiceInterface;
    typeService: TypeServiceInterface;
    configService: ConfigServiceInterface;
  }
  
  export const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

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