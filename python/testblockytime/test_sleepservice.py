import pytest
from pytest import fixture
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from blockytime.services.typeservice import TypeService
from blockytime.dtos.type_dto import TypeDTO
from datetime import datetime
from typing import List
import os
import pytz
from blockytime.services.sleepservice import SleepService
from blockytime.dtos.sleep_dto import SleepStatsDTO
from datetime import date

import logging


# Configure SQLAlchemy logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

class TestSleepService:

    @fixture
    def engine(self) -> Engine:
        # Load from data/test_db.db
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_file_path = os.path.join(current_dir, '..', 'blockytime', 'data', 'dynamic', 'DB.db')
        engine = create_engine(f'sqlite:///{db_file_path}')
        return engine
    
    def test_get_sleep_stats(self, engine: Engine) -> None:
        # Get blocks from the engine
        sleep_stats: List[SleepStatsDTO] = SleepService(engine).get_sleep_stats(date(2018, 1, 1), date(2025, 4, 6))
        # Plot sleep duration using matplotlib
        import matplotlib.pyplot as plt
        import numpy as np

        # Extract sleep durations
        start_of_days_tuple = [(stat.date, ((stat.start_time) % (24 * 3600)) / 3600.0 + 8.0) for stat in sleep_stats if ((stat.start_time) % (24 * 3600)) / 3600.0 + 8.0 > 20.0]
        
        # Sort by date
        start_of_days_tuple.sort(key=lambda x: x[0])
        
        # Separate dates and hours
        dates = np.array([x[0] for x in start_of_days_tuple])
        hours = np.array([x[1] for x in start_of_days_tuple])
        
        # Calculate 30-day moving average
        window_size = 30
        moving_avg = np.convolve(hours, np.ones(window_size)/window_size, mode='valid')
        moving_avg_dates = dates[window_size-1:]  # Align dates with moving average
        
        # Create the plot
        plt.figure(figsize=(12, 6))
        plt.plot(dates, hours, 'b.', alpha=0.3, label='Daily Start Time')
        plt.plot(moving_avg_dates, moving_avg, 'r-', linewidth=2, label='30-Day Moving Average')
        
        # Convert days since 1970 to years for x-axis labels, starting from 2017
        base_date = datetime(1970, 1, 1)
        year_ticks = []
        year_labels = []
        current_year = 2017
        while True:
            days_to_next_year = (datetime(current_year, 1, 1) - base_date).days
            if days_to_next_year > dates[-1]:
                break
            year_ticks.append(days_to_next_year)
            year_labels.append(str(current_year))
            current_year += 1
        
        plt.xticks(year_ticks, year_labels)
        
        # Adjust y-axis labels to show 24-hour format
        y_ticks = plt.yticks()[0]
        y_labels = [f"{int(tick%24):02d}:00" if tick >= 24 else f"{int(tick):02d}:00" for tick in y_ticks]
        plt.yticks(y_ticks, y_labels)
        
        plt.title('Sleep Start Time and 30-Day Moving Average')
        plt.xlabel('Year')
        plt.ylabel('Start Time')
        plt.grid(True)
        plt.legend()
        plt.tight_layout()
        plt.show()
