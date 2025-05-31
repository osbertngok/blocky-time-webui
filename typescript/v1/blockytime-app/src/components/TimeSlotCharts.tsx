import React, { useMemo, useState } from 'react';
import { subDays, format, addMinutes, isSameDay, getDay } from 'date-fns';
import { StatsChart } from './StatsChart';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import './TimeSlotCharts.css';

interface TimeSlot {
  hour: number;
  minute: number;
  timeSlotMinutes: number;
}

const DAYS_OPTIONS = [
  { value: 3, label: 'Last 3 days' },
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 100, label: 'Last 100 days' },
  { value: 365, label: 'Last 365 days' },
];

export const TimeSlotCharts: React.FC = () => {
  const [lookbackDays, setLookbackDays] = useState(7);
  const [dayOfWeekOnly, setDayOfWeekOnly] = useState(false);

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

  const currentDayOfWeek = getDay(new Date());

  return (
    <div className="time-slots-section">
      <Box className="time-slots-header" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <FormControl size="small">
            <InputLabel id="lookback-days-label">Time Range</InputLabel>
            <Select
              labelId="lookback-days-label"
              value={lookbackDays}
              label="Time Range"
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              className="days-selector"
            >
              {DAYS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={dayOfWeekOnly}
                onChange={(e) => setDayOfWeekOnly(e.target.checked)}
                color="primary"
              />
            }
            label={<Typography sx={{ color: 'text.primary', fontWeight: 500 }}>Same day of week only</Typography>}
            labelPlacement="end"
            sx={{ ml: 1 }}
          />
        </Stack>
      </Box>
      <div className="time-slots-container">
        <div className="time-slot-section">
          <StatsChart 
            startDate={subDays(new Date(), lookbackDays)} 
            endDate={new Date()} 
            chartType="pie"
            timeSlot={timeSlots.current}
            title={`Current Time Slot (${formatTimeSlot(timeSlots.current)})`}
            dayOfWeek={dayOfWeekOnly ? currentDayOfWeek : null}
          />
        </div>
        <div className="time-slot-section">
          <StatsChart 
            startDate={timeSlots.isNextDaySlot ? subDays(new Date(), lookbackDays - 1) : subDays(new Date(), lookbackDays)} 
            endDate={timeSlots.isNextDaySlot ? new Date() : subDays(new Date(), -1)} 
            chartType="pie"
            timeSlot={timeSlots.next}
            title={`Next Time Slot (${formatTimeSlot(timeSlots.next)})`}
            dayOfWeek={dayOfWeekOnly ? currentDayOfWeek : null}
          />
        </div>
      </div>
    </div>
  );
};
