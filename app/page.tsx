import MetricsChart from "@/components/metrics-chart";
import { MetricsTable } from "@/components/metrics-table";
import { TickerSelector } from "@/components/ticker-selector";
import { getDataset, ValidRange } from "@/lib/db";

export const MaxTickers = 10;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;

  let range: ValidRange = '3y';
  if (typeof params.range === 'string') {
    if (params.range === '3y' || params.range === '5y' || params.range === '10y') {
      range = params.range;
    }
  }

  let rawTickers: string[] = [];
  if (typeof params.tickers === 'string') {
    // decode and split by comma
    rawTickers = decodeURIComponent(params.tickers)
      .split(',')
      .sort((a, b) => a.localeCompare(b))
  }

  const tickers = await getDataset(rawTickers);
  const cappedTickers = tickers.slice(0, MaxTickers);

  console.log(cappedTickers.map(t => t.ticker));

  return (
    <div className="h-screen py-8 w-full max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Stock Data Viewer</h1>
      <div className="flex flex-col gap-4 py-4">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-4">
            <TickerSelector tickers={cappedTickers} range={range} />
          </div>

          <div className="col-span-8">
            <MetricsChart tickers={cappedTickers} range={range} />
          </div>

        </div>
        <MetricsTable tickers={cappedTickers} range={range} />
      </div>
    </div>
  )
}