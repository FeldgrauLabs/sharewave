import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import numpy as np

def fetch_pipe(
    tickers: list[str],
    years: int = 20
) -> pd.DataFrame:
    """
    Fetch adjusted close prices for a list of tickers.

    Parameters
    ----------
    tickers : list[str]
    years : int, default=20
        Number of years of data to fetch (max window)

    Returns
    -------
    pd.DataFrame
        Adjusted close prices (columns = tickers)
    """

    end_date = datetime.today()
    start_date = end_date - timedelta(days=years * 365)

    prices = yf.download(
        tickers,
        start=start_date,
        end=end_date,
        auto_adjust=True,
        progress=False
    )["Close"]

    # Ensure DataFrame even for single ticker
    if isinstance(prices, pd.Series):
        prices = prices.to_frame()

    prices = prices.sort_index()
    return prices

def process_pipe(
    prices: pd.DataFrame,
    years: int,
    trading_days: int = 252,
    tickers: list[str] = None
) -> pd.DataFrame:
    """
    Calculate annualized return (CAGR), risk (volatility),
    and return-to-risk ratio for a given price DataFrame.

    Parameters
    ----------
    prices : pd.DataFrame
        Adjusted close prices (output of fetch_pipe)
    years : int
        Number of years to analyze (rolling window from today)
    trading_days : int, default=252
    tickers: list[str], default=None
        List of tickers to filter (None for all)

    Returns
    -------
    pd.DataFrame
    """

    if tickers:
        prices = prices[tickers]

    today = pd.Timestamp.today().normalize()
    start_cutoff = today - pd.Timedelta(days=years * 365)

    # Slice to requested window
    prices_window = prices.loc[prices.index >= start_cutoff]

    daily_returns = prices_window.pct_change()
    results = []

    for ticker in prices_window.columns:
        price_series = prices_window[ticker].dropna()
        return_series = daily_returns[ticker].dropna()

        if return_series.empty:
            continue

        first_date = price_series.index.min().normalize()
        years_of_data = (today - first_date).days / 365.25

        # Calculate CAGR
        cagr = ((price_series.iloc[-1] / price_series.iloc[0]) ** (1 / years_of_data) - 1) * 100

        # Annualized volatility
        annual_risk = return_series.std() * np.sqrt(trading_days) * 100

        # Return-to-Risk Ratio
        return_to_risk = cagr / annual_risk if annual_risk != 0 else np.nan

        results.append({
            "Ticker": ticker,
            "First Data Point": first_date.date(),
            "Years of Data": years_of_data,
            "Younger Than Requested": years_of_data < (years - 0.3),
            "Annualized Return (%)": cagr,
            "Annualized Risk (%)": annual_risk,
            "Return-to-Risk Ratio": return_to_risk
        })

    return (
        pd.DataFrame(results)
        .set_index("Ticker")
        .sort_values("Return-to-Risk Ratio", ascending=False)
    )

def combine_periods_pipe(dfs: dict[int, pd.DataFrame]) -> pd.DataFrame:
    # unique tickers across all dfs
    tickers = set()
    for df in dfs.values():
        tickers.update(df.index.tolist())
    years = sorted(dfs.keys())

    combined_data = []
    for ticker in tickers:
        ticker_data = {"Ticker": ticker}
        first_data_points = []
        for year in years:
            period_df = dfs[year].copy()
            period_df.reset_index(inplace=True)
            ticker_row = period_df[period_df["Ticker"] == ticker]
            if not ticker_row.empty:
                first_data_points.append(ticker_row["First Data Point"].values[0])
                ticker_data[f"Annualized Return {year}Y (%)"] = ticker_row["Annualized Return (%)"].values[0]
                ticker_data[f"Annualized Risk {year}Y (%)"] = ticker_row["Annualized Risk (%)"].values[0]
            else:
                ticker_data[f"Annualized Return {year}Y (%)"] = None
                ticker_data[f"Annualized Risk {year}Y (%)"] = None
        ticker_data["First Data Point"] = min(first_data_points) if first_data_points else None
        combined_data.append(ticker_data)

    combined_df = pd.DataFrame(combined_data)
    return combined_df