import React, { useMemo } from 'react';
import { subDays, format, addMinutes, isSameDay } from 'date-fns';
import { StatsChart } from './StatsChart';
import './TimeSlotCharts.css';

interface TimeSlot {
  hour: number;
  minute: number;
  timeSlotMinutes: number;
}

export const TimeSlotCharts: React.FC = () => {
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
      isNextDaySlot: !isSameDay(now, nextSlotDate)
    };
  }, []);

  const formatTimeSlot = (slot: TimeSlot) => {
    const hour = slot.hour.toString().padStart(2, '0');
    const minute = slot.minute.toString().padStart(2, '0');
    const endTime = addMinutes(
      new Date().setHours(slot.hour, slot.minute),
      slot.timeSlotMinutes
    );
    const endHour = endTime.getHours().toString().padStart(2, '0');
    const endMinute = endTime.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}-${endHour}:${endMinute}`;
  };

  return (
    <div className="time-slots-container">
      <div className="time-slot-section">
        <StatsChart 
          startDate={subDays(new Date(), 100)} 
          endDate={new Date()} 
          chartType="pie"
          timeSlot={timeSlots.current}
          title={`Current Time Slot (${formatTimeSlot(timeSlots.current)})`}
        />
      </div>
      <div className="time-slot-section">
        <StatsChart 
          startDate={timeSlots.isNextDaySlot ? subDays(new Date(), 99) : subDays(new Date(), 100)} 
          endDate={timeSlots.isNextDaySlot ? new Date() : subDays(new Date(), -1)} 
          chartType="pie"
          timeSlot={timeSlots.next}
          title={`Next Time Slot (${formatTimeSlot(timeSlots.next)})`}
        />
      </div>
    </div>
  );
};
