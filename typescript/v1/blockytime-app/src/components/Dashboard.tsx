import React from 'react';
import IconButton from '@mui/material/IconButton';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { TimeSlotCharts } from './TimeSlotCharts';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="top-row">
          <IconButton onClick={() => navigate('/')}>
            <ArrowBack />
          </IconButton>
          <h2>Dashboard</h2>
        </div>
      </div>
      
      <div className="dashboard-content">
        <TimeSlotCharts />
        {/* WeeklyGrid will go here */}
      </div>
    </div>
  );
};

export default Dashboard;
