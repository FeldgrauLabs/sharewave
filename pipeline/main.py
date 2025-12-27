from dotenv import load_dotenv

load_dotenv()

from db import push_to_turso
from pipe import combine_periods_pipe, fetch_pipe, process_pipe
from datetime import datetime
import sys
from pathlib import Path

years = [3,5,10]
max_year = max(years)

# default fallback tickers (used when no input file provided)
DEFAULT_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NFLX", "RKLB", "NVDA", "NOW", "LLY", "DUOL", "V", "META", "AMD", "ARM", "AVGO", "TSM", "INTC", "COIN", "HOOD"]

def load_tickers_from_file(path: str) -> list[str]:
    """Load tickers from a file. Filename must be country-code[-index-name].txt.

    For country code "au" we append the ".AX" suffix to each ticker for yfinance.
    Lines starting with '#' or empty lines are ignored.
    """
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Ticker file not found: {path}")

    # parse country code from filename (before first '-' or '.')
    base = p.name
    country = base.split('-', 1)[0].split('.', 1)[0].lower()

    tickers: list[str] = []
    with p.open('r', encoding='utf-8') as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith('#'):
                continue
            t = s.upper()
            if country == 'au' and not t.endswith('.AX'):
                t = f"{t}.AX"
            tickers.append(t)

    print(f"[pre] Loaded tickers from file '{path}'")
    return tickers


def main():
    # allow optional file path argument: python main.py path/to/au-sp500.txt
    tickers = DEFAULT_TICKERS
    if len(sys.argv) > 1:
        fp = sys.argv[1]
        try:
            tickers = load_tickers_from_file(fp)
        except Exception as e:
            print(f"Failed to load tickers from '{fp}': {e}")
            print("Falling back to default tickers.")

    date_now = datetime.now().isoformat(timespec='seconds')
    print(f"[{date_now}] Starting pipeline... (tickers: {len(tickers)})")

    df = fetch_pipe(tickers, max_year)
    period_dfs = {year: process_pipe(df, year) for year in years}
    combined_df = combine_periods_pipe(period_dfs)

    push_to_turso(combined_df, date_now)

    print(f"[{date_now}] Pipeline completed successfully.")

if __name__ == "__main__":
    main()
