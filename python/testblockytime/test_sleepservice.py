import logging
import os
from datetime import date, datetime, timedelta
from typing import List

from blockytime.dtos.sleep_dto import SleepStatsDTO
from blockytime.services.sleepservice import SleepService
from pytest import fixture
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
import pytz
import numpy as np

# Configure SQLAlchemy logging
logging.basicConfig()
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)


class TestSleepService:

    @fixture
    def engine(self) -> Engine:
        # Load from data/test_db.db
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_file_path = os.path.join(
            current_dir, "..", "blockytime", "data", "dynamic", "DB.db"
        )
        engine = create_engine(f"sqlite:///{db_file_path}")
        return engine

    def test_get_date_boundaries(self, engine: Engine) -> None:
        service = SleepService(engine)
        
        # Test case 1: January 1, 2024 with 18:00 Asia/Shanghai
        test_date = date(2024, 1, 1)
        start_ts, end_ts = service._get_date_boundaries(
            test_date, 
            cut_off_hour=18,
            timezone=pytz.timezone("Asia/Shanghai")
        )
        
        # Convert timestamps back to datetime for easier verification
        start_dt = datetime.fromtimestamp(start_ts, tz=pytz.UTC)
        end_dt = datetime.fromtimestamp(end_ts, tz=pytz.UTC)
        
        # Verify the timestamps are 24 hours apart
        assert end_dt - start_dt == timedelta(days=1)
        
        # Verify both timestamps are at 02:00 UTC (which is 18:00 Asia/Shanghai)
        assert start_dt.hour == 2
        assert start_dt.minute == 0
        assert start_dt.second == 0
        assert end_dt.hour == 2
        assert end_dt.minute == 0
        assert end_dt.second == 0
        
        # Verify start is from previous day
        assert start_dt.date() == date(2023, 12, 31)
        assert end_dt.date() == test_date

    def test_get_date_boundaries_different_timezone(self, engine: Engine) -> None:
        service = SleepService(engine)
        
        # Test case: January 1, 2024 with 15:00 New York time
        test_date = date(2024, 1, 1)
        ny_tz = pytz.timezone("America/New_York")
        start_ts, end_ts = service._get_date_boundaries(
            test_date, 
            cut_off_hour=15, 
            timezone=ny_tz
        )
        
        # Convert timestamps back to datetime for easier verification
        start_dt = datetime.fromtimestamp(start_ts, tz=pytz.UTC)
        end_dt = datetime.fromtimestamp(end_ts, tz=pytz.UTC)
        
        # Convert to New York time for verification
        start_dt_ny = start_dt.astimezone(ny_tz)
        end_dt_ny = end_dt.astimezone(ny_tz)
        
        # Verify the timestamps are 24 hours apart
        assert end_dt - start_dt == timedelta(days=1)
        
        # Verify both timestamps are at 15:00 New York time
        assert start_dt_ny.hour == 15
        assert start_dt_ny.minute == 0
        assert start_dt_ny.second == 0
        assert end_dt_ny.hour == 15
        assert end_dt_ny.minute == 0
        assert end_dt_ny.second == 0
        
        # Verify start is from previous day
        assert start_dt_ny.date() == date(2023, 12, 31)
        assert end_dt_ny.date() == test_date

    def test_get_date_boundaries_leap_year(self, engine: Engine) -> None:
        service = SleepService(engine)
        
        # Test case 2: February 29, 2024 (leap year)
        test_date = date(2024, 2, 29)
        start_ts, end_ts = service._get_date_boundaries(
            test_date,
            cut_off_hour=18,
            timezone=pytz.timezone("Asia/Shanghai")
        )
        
        # Convert timestamps back to datetime for easier verification
        start_dt = datetime.fromtimestamp(start_ts, tz=pytz.UTC)
        end_dt = datetime.fromtimestamp(end_ts, tz=pytz.UTC)
        
        # Verify the timestamps are 24 hours apart
        assert end_dt - start_dt == timedelta(days=1)
        
        # Verify both timestamps are at 02:00 UTC (which is 18:00 Asia/Shanghai)
        assert start_dt.hour == 2
        assert start_dt.minute == 0
        assert start_dt.second == 0
        assert end_dt.hour == 2
        assert end_dt.minute == 0
        assert end_dt.second == 0
        
        # Verify start is from previous day
        assert start_dt.date() == date(2024, 2, 28)
        assert end_dt.date() == test_date


    def test_get_sleep_stats(self, engine: Engine) -> None:
        # Get blocks from the engine
        tomorrow = date.today() + timedelta(days=1)
        start_date = date(2025, 1, 1)
        end_date = tomorrow
        cut_off_hour: int = 18
        selected_timezone: pytz.BaseTzInfo = pytz.timezone("Asia/Shanghai")
        start_time_cut_off_hour = 8
        end_time_cut_off_hour = 14
        filter_start_time_after = 20.0  # 8 PM
        filter_end_time_after = 24.0 + 3.0  # 3 AM
        decay_factor = 0.75
        window_size = 14

        # Calculate moving averages
        service = SleepService(engine)
        start_moving_avg, end_moving_avg, duration_moving_avg, moving_avg_dates, start_hours, end_hours, dates = service.calculate_sleep_stats(
            start_date=start_date,
            end_date=end_date,
            cut_off_hour=cut_off_hour,
            timezone=selected_timezone,
            start_time_cut_off_hour=start_time_cut_off_hour,
            end_time_cut_off_hour=end_time_cut_off_hour,
            filter_start_time_after=filter_start_time_after,
            filter_end_time_after=filter_end_time_after,
            decay_factor=decay_factor,
            window_size=window_size
        )

        # Plot sleep duration using matplotlib
        import matplotlib.pyplot as plt
        import numpy as np

        # Create the plot with two y-axes
        fig, ax1 = plt.subplots(figsize=(12, 6))

        # Plot start/end times on the left y-axis
        ax1.plot(dates, start_hours, "b.", alpha=0.3, label="Daily Start Time")
        ax1.plot(dates, end_hours, "g.", alpha=0.3, label="Daily End Time")
        ax1.plot(moving_avg_dates, start_moving_avg, "r-", linewidth=2, label=f"{window_size}-Day Moving Average (Start)")
        ax1.plot(moving_avg_dates, end_moving_avg, "m-", linewidth=2, label=f"{window_size}-Day Moving Average (End)")
        ax1.set_ylim(22, 38)

        # Create second y-axis for duration
        ax2 = ax1.twinx()
        ax2.plot(moving_avg_dates, duration_moving_avg, "y-", linewidth=2, label=f"{window_size}-Day Moving Average (Duration)")
        ax2.set_ylim(-2, 14)  # Set y-axis limits for duration from 0 to 16 hours

        # Convert days since 1970 to months for x-axis labels
        base_date = datetime(1970, 1, 1)
        month_ticks = []
        month_labels = []
        current_date = datetime.combine(start_date, datetime.min.time())  # Convert start_date to datetime
        while True:
            days_to_next_month = (current_date - base_date).days
            if days_to_next_month > moving_avg_dates[-1]:
                break
            month_ticks.append(days_to_next_month)
            month_labels.append(current_date.strftime("%b %Y"))
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)

        ax1.set_xticks(month_ticks)
        ax1.set_xticklabels(month_labels, rotation=45, ha="right")

        # Adjust y-axis labels to show 24-hour format for time
        y_ticks = ax1.get_yticks()
        y_labels = [
            f"{int(tick%24):02d}:00" if tick >= 24 else f"{int(tick):02d}:00"
            for tick in y_ticks
        ]
        ax1.set_yticklabels(y_labels)

        # Set labels and title
        ax1.set_title("Sleep Times and Duration with Moving Averages")
        ax1.set_xlabel("Month")
        ax1.set_ylabel("Time")
        ax2.set_ylabel("Duration (hours)")

        # Combine legends from both axes
        lines1, labels1 = ax1.get_legend_handles_labels()
        lines2, labels2 = ax2.get_legend_handles_labels()
        ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left")

        ax1.grid(True)
        plt.tight_layout()
        plt.show()
