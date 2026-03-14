import { createContext, useContext } from 'react';
import { BlockServiceInterface } from '../services/blockservice';
import { TypeServiceInterface } from '../services/typeservice';
import { ConfigServiceInterface } from '../interfaces/configserviceinterface';
import { StatsServiceInterface } from '../interfaces/statisticsserviceinterface';
import { TrendServiceInterface } from '../interfaces/trendserviceinterface';
import { AdminServiceInterface } from '../services/adminservice';


interface ServiceContextType {
    blockService: BlockServiceInterface;
    typeService: TypeServiceInterface;
    configService: ConfigServiceInterface;
    statsService: StatsServiceInterface;
    trendService: TrendServiceInterface;
    adminService: AdminServiceInterface;
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

  export const useStatsService = (): StatsServiceInterface => {
    const context = useContext(ServiceContext);
    if (!context) {
      throw new Error('useStatsService must be used within a ServiceProvider');
    }
    return context.statsService;
  };

  export const useTrendService = (): TrendServiceInterface => {
    const context = useContext(ServiceContext);
    if (!context) {
      throw new Error('useTrendService must be used within a ServiceProvider');
    }
    return context.trendService;
  };

  export const useAdminService = (): AdminServiceInterface => {
    const context = useContext(ServiceContext);
    if (!context) {
      throw new Error('useAdminService must be used within a ServiceProvider');
    }
    return context.adminService;
  };