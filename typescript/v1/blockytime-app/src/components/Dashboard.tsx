import React, { useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { StatsChart } from './StatsChart';
import { subDays, format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const timeSlot = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const timeSlotMinutes = 30;
    const currentMinute = now.getMinutes();
    const minute = Math.floor(currentMinute / timeSlotMinutes) * timeSlotMinutes;
    console.log(`Current time ${hour}:${currentMinute} rounded to ${hour}:${minute}`);
    return { hour, minute, timeSlotMinutes };
  }, []); // Empty deps since we want this to be static for each render

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
        <div className="time-slot-section">
          <StatsChart 
            startDate={subDays(new Date(), 100)} 
            endDate={new Date()} 
            chartType="pie"
            timeSlot={timeSlot}
            title={`Current Time Slot (${format(new Date(), `${timeSlot.hour.toString().padStart(2, '0')}:${timeSlot.minute.toString().padStart(2, '0')}`)})`}
          />
        </div>
        {/* WeeklyGrid will go here */}
      </div>
    </div>
  );
};

export default Dashboard;
