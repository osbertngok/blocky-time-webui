import React from 'react';
import { BlockService } from '../services/blockservice';
import { TypeService } from '../services/typeservice';
import { ConfigService } from '../services/configservice';
import { StatsService } from '../services/statisticsservice';
import { TrendService } from '../services/trendservice';
import { ServiceContext } from './ServiceHooks';

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const blockService = new BlockService();
  const typeService = new TypeService();
  const configService = new ConfigService()
  const statsService = new StatsService()
  const trendService = new TrendService()
  return (
    <ServiceContext.Provider value={{ blockService, typeService, configService, statsService, trendService }}>
      {children}
    </ServiceContext.Provider>
  );
};

