import { createClient, Row } from "@libsql/client";

export type ValidRange = '3y' | '5y' | '10y';

export interface Data {
  ticker: string;
  name: string;
  cagr: Record<ValidRange, number | null>;
  risk: Record<ValidRange, number | null>;
  last_updated: string;
  earliest_data: string;
}

let dbClient: ReturnType<typeof createClient> | null = null;
const tursoClient = () => {
  if (dbClient) return dbClient;
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error("Missing TURSO_DATABASE_URL");
  }
  if (!process.env.TURSO_AUTH_TOKEN) {
    throw new Error("Missing TURSO_AUTH_TOKEN");
  }

  dbClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return dbClient;
}

export const searchTicker = async (query: string): Promise<Data[]> => {
  const rows = await tursoClient().execute(
    `SELECT ticker, cagr_3yr, cagr_5yr, cagr_10yr, risk_3yr, risk_5yr, risk_10yr, updated_at, earliest_datapoint
      FROM stock_metrics
      WHERE LOWER(ticker) LIKE ?
      LIMIT 5`,
    [`%${query.toLowerCase()}%`]
  );

  return rows.rows.map(convertToData);
}

export const getDataset = async (tickers: string[]): Promise<Data[]> => {
  if (tickers.length === 0) return [];

  const sqlIn = tickers
    .sort((a, b) => a.localeCompare(b))
    .map(t => t.toUpperCase())
    .map(() => '?')
    .join(',');

  const rows = await tursoClient().execute(
    `SELECT ticker, cagr_3yr, cagr_5yr, cagr_10yr, risk_3yr, risk_5yr, risk_10yr, updated_at, earliest_datapoint
     FROM stock_metrics
     WHERE ticker IN (${sqlIn})`,
    tickers
  );

  return rows.rows.map(convertToData);
}

const convertToData = (row: Row): Data => {
  return {
    ticker: row[0] as string,
    name: row[0] as string,
    cagr: {
      '3y': row[1] as number | null,
      '5y': row[2] as number | null,
      '10y': row[3] as number | null,
    },
    risk: {
      '3y': row[4] as number | null,
      '5y': row[5] as number | null,
      '10y': row[6] as number | null,
    },
    last_updated: row[7] as string,
    earliest_data: row[8] as string,
  };
}