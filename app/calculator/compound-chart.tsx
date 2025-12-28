import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  LineChart,
  ReferenceLine,
  Tooltip,
  Legend,
  Line,
} from 'recharts';

import { MainCard } from "@/components/main-card";
import { Frequency } from "./page";
import { Separator } from '@/components/ui/separator';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FlagIcon, FlagOffIcon, Grid2X2Icon, Grid2X2XIcon, ImageIcon, MoreHorizontalIcon, PaperclipIcon, SheetIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export interface CompoundChartProps {
  data: Array<{ year: number; total: number; totalContributed: number }>;
}

export default function CompoundChart({
  data: dataPoints,
}: CompoundChartProps) {
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showMilestone, setShowMilestone] = useState<boolean>(true);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const exportCSV = () => {
    const header = 'Year,Total,Total Contributed\n';
    const rows = dataPoints.map(d => `${d.year},${d.total},${d.totalContributed}`).join('\n');
    const csvContent = header + rows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'compound_growth.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainCard
      title="Compound Growth Over Time"
      children={<Chart ref={chartRef} data={dataPoints} showGrid={showGrid} showMilestone={showMilestone} />}
      headerAction={
        <div data-testid='controls' className='flex flex-row gap-2 items-center'>
          <Button
            variant='outline'
            size='sm'
            type='button'
            aria-label='Toggle Mean Lines'
            onClick={() => setShowMilestone(!showMilestone)}
          >
            Milestone {showMilestone ? <FlagIcon /> : <FlagOffIcon />}
          </Button>
          <Button
            variant='outline'
            size='sm'
            type='button'
            aria-label='Toggle Grid'
            onClick={() => setShowGrid(!showGrid)}
          >
            Grid {showGrid ? <Grid2X2Icon /> : <Grid2X2XIcon />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="More Options">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => exportCSV()}
                  disabled={dataPoints.length === 0}
                >
                  <SheetIcon />
                  Export as CSV/Excel
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  )
}

const formatNumbers = (value: number) => {
  if (value === 0) return '$0';

  const inT = value / 1_000_000_000_000;
  const inB = value / 1_000_000_000;
  const inM = value / 1_000_000;
  const inK = value / 1000;

  if (inT >= 1) return `$${inT.toFixed(1)}T`;
  if (inB >= 1) return `$${inB.toFixed(1)}B`;
  if (inM >= 1) return `$${inM.toFixed(1)}M`;
  if (inK >= 1) return `$${inK.toFixed(0)}k`;
  return `$${value.toFixed(1)}`;
};

function Chart({ data, showGrid, showMilestone, ref }: { ref: React.RefObject<HTMLDivElement | null>, data: Array<{ year: number; total: number; totalContributed: number }>, showGrid: boolean; showMilestone: boolean }) {
  // show x-axis ticks every 4 years (1,5,9,...)
  const xTicks = data.map(d => d.year).filter((y) => ((y - 1) % 4) === 0);

  // milestone: first million
  const MILESTONE = 1_000_000;
  const milestoneYear = data.find(d => d.total >= MILESTONE)?.year ?? null;

  return (
    <div ref={ref} className="relative w-full h-full overflow-hidden">
      {data.length === 0 && (
        <div className='absolute top-4 right-4 inset-10 flex items-center justify-center z-10'>
          <div className="bg-gray-50 border rounded-lg p-6 flex flex-col items-center justify-center h-24 z-10">
            <p className="text-lg font-medium text-slate-700">No data to display</p>
            <p className="text-sm text-slate-500">Fill in the fields to populate the chart.</p>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          {showGrid &&
            <CartesianGrid strokeDasharray="3 3" />
          }
          {showMilestone && milestoneYear && (
            <ReferenceLine
              x={milestoneYear}
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="3 3"
              label={{
                value: `Year ${milestoneYear}`,
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#92400e'
              }} />
          )}
          {showMilestone &&
            <ReferenceLine
              y={MILESTONE}
              stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1}
              label={{ value: '1M', position: 'insideTopRight', fontSize: 10, fill: '#7f1d1d' }}
            />
          }
          <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottomRight', offset: -10 }} ticks={xTicks} />
          <YAxis tickFormatter={formatNumbers} />
          <ChartTooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const d = payload[0].payload;
                const year = d.year;

                return (
                  <div className="rounded-md border bg-white p-2 shadow min-w-48">
                    <p className="font-semibold">{`Year ${year}`}</p>
                    <Separator className='my-1' />
                    <div className='flex flex-col'>
                      <div className='flex flex-row items-center justify-between'>
                        <p>Contribution</p>
                        <div className='font-mono'>{formatNumbers(d.totalContributed)}</div>
                      </div>
                      <div className='flex flex-row items-center justify-between'>
                        <p>Total</p>
                        <div className='font-mono'>{formatNumbers(d.total)}</div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend verticalAlign="top" height={36} />
          <Line type="monotone" dataKey="total" stroke="green" name="Total Value" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="totalContributed" stroke="blue" name="Total Contributed" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
