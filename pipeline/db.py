import os
import libsql
import pandas as pd

def push_to_turso(df: pd.DataFrame, now: str):
    TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL")
    TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

    if not TURSO_DATABASE_URL or not TURSO_AUTH_TOKEN:
        raise ValueError("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in environment variables.")
    
    conn = libsql.connect(
        TURSO_DATABASE_URL,
        auth_token=TURSO_AUTH_TOKEN,
    )

    # Create table if not exists
    create_table_query = """
        CREATE TABLE IF NOT EXISTS stock_metrics (
            ticker TEXT,
            cagr_3yr REAL,
            cagr_5yr REAL,
            cagr_10yr REAL,
            risk_3yr REAL,
            risk_5yr REAL,
            risk_10yr REAL,
            
            earliest_datapoint TEXT,
            updated_at TEXT,

            PRIMARY KEY (ticker)
        );
    """

    try:
      conn.execute(create_table_query)

      # Upsert data
      for _, row in df.iterrows():
          upsert_query = """
              INSERT INTO stock_metrics (ticker, cagr_3yr, cagr_5yr, cagr_10yr, risk_3yr, risk_5yr, risk_10yr, earliest_datapoint, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(ticker) DO UPDATE SET
                  cagr_3yr=excluded.cagr_3yr,
                  cagr_5yr=excluded.cagr_5yr,
                  cagr_10yr=excluded.cagr_10yr,
                  risk_3yr=excluded.risk_3yr,
                  risk_5yr=excluded.risk_5yr,
                  risk_10yr=excluded.risk_10yr,
                  earliest_datapoint=excluded.earliest_datapoint,
                  updated_at=excluded.updated_at;
          """
          conn.execute(upsert_query, (
              row['Ticker'],
              row.get('Annualized Return 3Y (%)'),
              row.get('Annualized Return 5Y (%)'),
              row.get('Annualized Return 10Y (%)'),
              row.get('Annualized Risk 3Y (%)'),
              row.get('Annualized Risk 5Y (%)'),
              row.get('Annualized Risk 10Y (%)'),
              row.get('First Data Point').isoformat() if pd.notnull(row.get('First Data Point')) else None,
              now
          ))

          conn.commit()
    except Exception as e:
      print(f"Error pushing data to Turso: {e}")
    finally:
      conn.close()