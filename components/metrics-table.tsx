import { Data, ValidRange } from "@/lib/db";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card, CardContent } from "./ui/card";
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Tooltip, TooltipTrigger } from "./ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { InfoIcon } from "lucide-react";

interface MetricsTableProps {
  tickers: Data[];
  range: ValidRange;
}

const formatDate = (dateStr: string, includeDay: boolean = true) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
  };

  if (includeDay) {
    options.day = '2-digit';
  }

  return date.toLocaleDateString(undefined, options);
};

const mean = (arr: Array<number | 'N/A'>): number | 'N/A' => {
  const filtered = arr.filter((v): v is number => v !== 'N/A');
  if (filtered.length === 0) return 'N/A';
  const sum = filtered.reduce((a, b) => a + b, 0);
  return +(sum / filtered.length).toFixed(2);
};

const formatMetric = (v: number | 'N/A') => {
  if (v === 'N/A' || v == null) return 'N/A';
  return v.toFixed(2);
};

const highlightImmatureData = (dateStr: string, targetRange: ValidRange) => {
  const date = new Date(dateStr);
  const now = new Date();

  let requiredYears = parseInt(targetRange.replace('y', ''));
  if (!isFinite(requiredYears)) return false;

  // 1 month buffer
  const bufferMs = 30 * 24 * 60 * 60 * 1000;
  const requiredDate = new Date(now.getFullYear() - requiredYears, now.getMonth(), now.getDate() - 1);
  return date.getTime() + bufferMs > requiredDate.getTime();
}

export const MetricsTable = ({ tickers, range }: MetricsTableProps) => {
  const cagrMean = mean(
    tickers.map(t => t.cagr[range] !== null ? +(t.cagr[range]!).toFixed(2) : 'N/A')
  );
  const riskMean = mean(
    tickers.map(t => t.risk[range] !== null ? +(t.risk[range]!).toFixed(2) : 'N/A')
  );
  const rrMean = mean(
    tickers.map(t => {
      if (t.cagr[range] !== null && t.risk[range] !== null) {
        return t.risk[range]! > 0
          ? +((t.cagr[range]! / t.risk[range]!).toFixed(2))
          : +((t.cagr[range]! * 1000).toFixed(2));
      }
      return 'N/A';
    })
  );

  return (
    <Card>
      <CardContent>
        <Table>
          <TableCaption>Metrics for selected tickers over <span className="font-bold">{range}</span> range</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead className="text-right">CAGR (%)</TableHead>
              <TableHead className="text-right">Risk (%)</TableHead>
              <TableHead className="text-right">Return/Risk</TableHead>
              <TableHead className="text-right">Earliest Data Point</TableHead>
              <TableHead className="text-right">Last Updated</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {tickers.map((t) => {
              const cagr = t.cagr[range] !== null ? t.cagr[range]! : 'N/A';
              const risk = t.risk[range] !== null ? t.risk[range]! : 'N/A';
              const rr =
                t.cagr[range] !== null && t.risk[range] !== null
                  ? t.risk[range]! > 0
                    ? t.cagr[range]! / t.risk[range]!
                    : t.cagr[range]! * 1000
                  : 'N/A';
              const isMature = !highlightImmatureData(t.earliest_data, range);

              // Must NOT be before the requested range
              const earliestData = new Date(t.earliest_data);
              const now = new Date();
              const requiredStartDate = new Date(now.getFullYear() - parseInt(range.replace('y', '')), now.getMonth(), now.getDate() - 1);
              if (earliestData > requiredStartDate) {
                // Data does not cover the requested range, treat as immature
                earliestData.setTime(earliestData.getTime() + 1000 * 60 * 60 * 24); // add 1 day to trigger immature
              }

              return (
                <TableRow key={t.ticker}>
                  <TableCell className="font-medium">{t.ticker}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMetric(cagr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMetric(risk)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMetric(rr)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${isMature ? '' : 'text-yellow-500'}`}>
                    {formatDate(t.earliest_data, false)}
                  </TableCell>
                  <TableCell className="text-right">{formatDate(t.last_updated)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            {/* Show the mean values for each metric */}
            <TableRow>
              <TableCell className="font-medium">
                <div className="flex gap-2">
                  <span className="italic">Mean</span>
                  {/* Sample mean notation */}
                  <InlineMath math="(\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i)" />
                </div>
              </TableCell>
              <TableCell className="italic text-right tabular-nums">{formatMetric(cagrMean)}</TableCell>
              <TableCell className="italic text-right tabular-nums">{formatMetric(riskMean)}</TableCell>
              <TableCell className="italic text-right tabular-nums">{formatMetric(rrMean)}</TableCell>
              <TableCell className="italic text-right">-</TableCell>
              <TableCell className="italic text-right">-</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
