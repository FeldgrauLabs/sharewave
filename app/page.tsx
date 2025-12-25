import MetricsChart from "@/components/metrics-chart";
import { TickerSelector } from "@/components/ticker-selector";
import Dataset, { Data, ValidRange } from "@/lib/dataset";

export const MaxTickers = 10;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;

  const tickers: Data[] = [];
  let range: ValidRange = '3y';
  if (typeof params.range === 'string') {
    if (params.range === '3y' || params.range === '5y' || params.range === '10y') {
      range = params.range;
    }
  }

  if (typeof params.tickers === 'string') {
    // decode and split by comma
    const rawTickers = decodeURIComponent(params.tickers).split(',');
    for (const rt of rawTickers) {
      const lower = rt.toLowerCase();
      const match = Dataset.find(d => d.ticker.toLowerCase() === lower);
      if (!match) {
        continue;
      };

      tickers.push(match);
    }

    // sort by ticker
    tickers.sort((a, b) => a.ticker.localeCompare(b.ticker));
  }

  const cappedTickers = tickers.slice(0, MaxTickers);

  return (
    <div className="h-screen py-8 w-full max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Stock Data Viewer</h1>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-4">
          <TickerSelector tickers={tickers} range={range} />
        </div>

        <div className="col-span-8">
          <MetricsChart tickers={tickers} range={range} />
        </div>
      </div>
    </div>
  )
}