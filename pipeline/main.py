from dotenv import load_dotenv

load_dotenv()

from db import push_to_turso
from pipe import combine_periods_pipe, fetch_pipe, process_pipe
from datetime import datetime

years = [3,5,10]
max_year = max(years)
tickers = tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NFLX", "RKLB", "NVDA", "NOW", "LLY", "DUO", "V", "META", "AMD", "ARM", "AVGO", "TSM", "INTC", "COIN", "HOOD"]


def main():
    date_now = datetime.now().isoformat(timespec='seconds')
    print(f"[{date_now}] Starting pipeline...")

    df = fetch_pipe(tickers, max_year)
    period_dfs = {year: process_pipe(df, year) for year in years}
    combined_df = combine_periods_pipe(period_dfs)

    push_to_turso(combined_df, date_now)

    print(f"[{date_now}] Pipeline completed successfully.")

if __name__ == "__main__":
    main()
