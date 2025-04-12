import React, { useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { StatsChart } from './StatsChart';
import { subDays, format, addMinutes, isSameDay } from 'date-fns';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const timeSlots = useMemo(() => {
    const now = new Date();
    const timeSlotMinutes = 30;
    
    // Calculate current time slot
    const currentHour = now.getHours();
    const currentMinute = Math.floor(now.getMinutes() / timeSlotMinutes) * timeSlotMinutes;
    
    // Calculate next time slot
    const nextSlotDate = addMinutes(now, timeSlotMinutes);
    const nextHour = nextSlotDate.getHours();
    const nextMinute = Math.floor(nextSlotDate.getMinutes() / timeSlotMinutes) * timeSlotMinutes;

    console.log(`Current slot: ${currentHour}:${currentMinute}, Next slot: ${nextHour}:${nextMinute}`);
    
    return {
      current: {
        hour: currentHour,
        minute: currentMinute,
        timeSlotMinutes,
      },
      next: {
        hour: nextHour,
        minute: nextMinute,
        timeSlotMinutes,
      },
      // If next slot is on the next day, we need different date ranges
      isNextDaySlot: !isSameDay(now, nextSlotDate)
    };
  }, []);

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
        <div className="time-slots-container">
          <div className="time-slot-section">
            <StatsChart 
              startDate={subDays(new Date(), 100)} 
              endDate={new Date()} 
              chartType="pie"
              timeSlot={timeSlots.current}
              title={`Current Time Slot (${timeSlots.current.hour.toString().padStart(2, '0')}:${timeSlots.current.minute.toString().padStart(2, '0')})`}
            />
          </div>
          <div className="time-slot-section">
            <StatsChart 
              startDate={timeSlots.isNextDaySlot ? subDays(new Date(), 99) : subDays(new Date(), 100)} 
              endDate={timeSlots.isNextDaySlot ? new Date() : subDays(new Date(), -1)} 
              chartType="pie"
              timeSlot={timeSlots.next}
              title={`Next Time Slot (${timeSlots.next.hour.toString().padStart(2, '0')}:${timeSlots.next.minute.toString().padStart(2, '0')})`}
            />
          </div>
        </div>
        {/* WeeklyGrid will go here */}
      </div>
    </div>
  );
};

export default Dashboard;
