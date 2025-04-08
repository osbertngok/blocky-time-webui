import logging
import os
from datetime import date, datetime, timedelta
from typing import List

from blockytime.dtos.sleep_dto import SleepStatsDTO
from blockytime.services.sleepservice import SleepService
from pytest import fixture
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

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

    def test_get_sleep_stats(self, engine: Engine) -> None:
        # Get blocks from the engine
        tomorrow = date.today() + timedelta(days=1)
        sleep_stats: List[SleepStatsDTO] = SleepService(engine).get_sleep_stats(
            date(2025, 1, 1), tomorrow
        )
        # Plot sleep duration using matplotlib
        import matplotlib.pyplot as plt
        import numpy as np

        # Extract sleep durations
        sime_day_tuple = [
            (
                stat.date,
                ((stat.start_time) % (24 * 3600)) / 3600.0 + 8.0,
                ((stat.end_time - 6 * 3600) % (24 * 3600)) / 3600.0 + 14.0,
                stat.duration,
            )
            for stat in sleep_stats
        ]
        # Filtering
        sime_day_tuple = [
            (date, start_hour, end_hour, duration)
            for date, start_hour, end_hour, duration in sime_day_tuple
            if start_hour > 20.0 and end_hour > 24.0 + 3.0
        ]
        # Sort by date
        sime_day_tuple.sort(key=lambda x: x[0])

        # Separate dates and hours
        dates = np.array([x[0] for x in sime_day_tuple])
        start_hours = np.array([x[1] for x in sime_day_tuple])
        end_hours = np.array([x[2] for x in sime_day_tuple])
        durations = np.array([x[3] for x in sime_day_tuple])

        # Calculate moving averages
        window_size = 7
        start_moving_avg = np.convolve(
            start_hours, np.ones(window_size) / window_size, mode="valid"
        )
        end_moving_avg = np.convolve(
            end_hours, np.ones(window_size) / window_size, mode="valid"
        )
        duration_moving_avg = np.convolve(
            durations, np.ones(window_size) / window_size, mode="valid"
        )
        moving_avg_dates = dates[window_size - 1 :]  # Align dates with moving average

        # Create the plot with two y-axes
        fig, ax1 = plt.subplots(figsize=(12, 6))

        # Plot start/end times on the left y-axis
        ax1.plot(dates, start_hours, "b.", alpha=0.3, label="Daily Start Time")
        ax1.plot(dates, end_hours, "g.", alpha=0.3, label="Daily End Time")
        ax1.plot(
            moving_avg_dates,
            start_moving_avg,
            "r-",
            linewidth=2,
            label=f"{window_size}-Day Moving Average (Start)",
        )
        ax1.plot(
            moving_avg_dates,
            end_moving_avg,
            "m-",
            linewidth=2,
            label=f"{window_size}-Day Moving Average (End)",
        )

        # Create second y-axis for duration
        ax2 = ax1.twinx()
        # ax2.plot(dates, durations, 'c.', alpha=0.3, label='Daily Duration')
        ax2.plot(
            moving_avg_dates,
            duration_moving_avg,
            "y-",
            linewidth=2,
            label=f"{window_size}-Day Moving Average (Duration)",
        )
        ax2.set_ylim(0, 16)  # Set y-axis limits for duration from 0 to 16 hours

        # Convert days since 1970 to months for x-axis labels
        base_date = datetime(1970, 1, 1)
        month_ticks = []
        month_labels = []
        current_date = datetime(2025, 1, 1)  # Start from January 2025
        while True:
            days_to_next_month = (current_date - base_date).days
            if days_to_next_month > dates[-1]:
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
