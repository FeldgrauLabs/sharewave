'use client';

import { Data, ValidRange } from '@/lib/db';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Separator } from './ui/separator';
import { BookmarkIcon, BookmarkXIcon, EqualIcon, EqualNotIcon, Grid2X2Icon, Grid2X2XIcon, ImageIcon, MoreHorizontalIcon, PaperclipIcon, SheetIcon, TriangleAlertIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner';
import { MainCard } from './main-card';

interface RiskReturnChartProps {
  tickers: Data[];
  range: ValidRange;
}

const MeanLineColor = 'blue';

export default function RiskReturnChart({ tickers, range }: RiskReturnChartProps) {
  const [showMean, setShowMean] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const share = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  }

  const exportCSV = () => {
    const header = ['Ticker', 'Name', 'Risk (%)', 'CAGR (%)', 'Return/Risk'];
    const rows = tickers
      .filter((t) => t.cagr[range] !== null && t.risk[range] !== null)
      .map((t) => {
        const riskPct = +(t.risk[range]!).toFixed(2);
        const returnPct = +(t.cagr[range]!).toFixed(2);
        const rr = t.risk[range]! > 0 ? t.cagr[range]! / t.risk[range]! : t.cagr[range]! * 1000;
        const returnRiskRatio = +rr.toFixed(2);
        return [t.ticker, t.name, riskPct, returnPct, returnRiskRatio];
      });

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += header.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `risk_return_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const chartRef = useRef<HTMLDivElement | null>(null);

  const data = tickers
    .filter((t) => t.cagr[range] !== null && t.risk[range] !== null)
    .map((t) => {
      const riskPct = +(t.risk[range]!).toFixed(2);
      const returnPct = +(t.cagr[range]!).toFixed(2);
      const rr = t.risk[range]! > 0 ? t.cagr[range]! / t.risk[range]! : t.cagr[range]! * 1000;
      const returnRiskRatio = +rr.toFixed(2);
      return {
        ticker: t.ticker,
        name: t.name,
        risk: riskPct,
        return: returnPct,
        returnRiskRatio,
      };
    });

  // compute common domain so both axes use the same scale (1:1)
  const values = data.flatMap((d) => [d.risk, d.return]);
  const maxVal = values.length ? Math.max(...values) : 1;
  // pad a small percentage of the max (or at least 1) to give breathing room
  const pad = Math.max(maxVal * 0.05, 1);
  const top = Math.ceil(maxVal + pad);
  const domain: [number, number] = [0, top];

  // prepare gradient coloring based on return/risk ratio
  const ratios = data.map((d) => d.returnRiskRatio).filter((v) => Number.isFinite(v));
  const minRatio = ratios.length ? Math.min(...ratios) : 0;
  const maxRatio = ratios.length ? Math.max(...ratios) : 1;
  const rangeRatio = Math.max(maxRatio - minRatio, 1e-6);

  const points = data.map(d => ({ ...d, color: colorForT((d.returnRiskRatio - minRatio) / rangeRatio) }));

  const meanRisk = data.length ? data.reduce((sum, d) => sum + d.risk, 0) / data.length : 0;
  const meanReturn = data.length ? data.reduce((sum, d) => sum + d.return, 0) / data.length : 0;

  const mainContent = (
    <div ref={chartRef} className="relative w-full h-full overflow-hidden">
      {data.length === 0 && (
        <div className='absolute top-4 right-4 inset-10 flex items-center justify-center z-10'>
          <div className="bg-gray-50 border rounded-lg p-6 flex flex-col items-center justify-center h-24 z-10">
            <p className="text-lg font-medium text-slate-700">No data to display</p>
            <p className="text-sm text-slate-500">Select tickers and/or change the range to populate the chart.</p>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={450}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" />
          )}
          {showMean && (
            <>
              <ReferenceLine
                x={meanRisk}
                stroke={MeanLineColor}
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: `Mean ${meanRisk.toFixed(2)}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                }} />
              <ReferenceLine
                y={meanReturn}
                stroke={MeanLineColor}
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{ value: `Mean ${meanReturn.toFixed(2)}`, position: 'insideTopRight', fontSize: 10 }}
              />
            </>
          )}
          <XAxis
            type="number"
            dataKey="risk"
            name="Risk (%)"
            domain={domain}
            label={{ value: 'Risk (%)', position: 'bottom', offset: 0 }}
          />
          <YAxis
            type="number"
            dataKey="return"
            name="CAGR (%)"
            domain={domain}
            label={{ value: 'CAGR (%)', angle: -90, position: 'insideLeft', offset: 0 }}
          />
          <div className="flex items-center gap-4 mb-2">
            <div className="text-sm text-muted-foreground">Return/Risk</div>
            <div className="w-44 h-2 rounded-md" style={{ background: 'linear-gradient(90deg, #ef4444, #f59e0b, #16a34a)' }} />
            <div className="text-xs text-muted-foreground">{minRatio.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground ml-auto">{maxRatio.toFixed(2)}</div>
          </div>
          <ChartTooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const d = payload[0].payload;
                return (
                  <div className="rounded-md border bg-white p-2 shadow min-w-48">
                    <p className="font-semibold mb-2">{d.ticker}</p>
                    <div className='flex flex-col'>
                      <div className='flex flex-row items-center justify-between'>
                        <p>Risk (%)</p>
                        <div className='font-mono'>{d.risk}</div>
                      </div>
                      <div className='flex flex-row items-center justify-between'>
                        <p>CAGR (%)</p>
                        <div className='font-mono'>{d.return}</div>
                      </div>
                    </div>
                    <Separator className='my-1' />
                    <div className='flex flex-row items-center justify-between'>
                      <p>Return/Risk</p>
                      <div className='font-mono'>{d.returnRiskRatio}</div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {/* Render all labels first so dots draw on top */}
          {showLabels && (
            <Scatter
              data={points}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                if (cx == null || cy == null) return null;
                return (
                  <text
                    x={cx + 8}
                    y={cy}
                    fill="#0f172a"
                    fontSize={10}
                    dominantBaseline="middle"
                    textAnchor="start"
                    style={{ pointerEvents: 'none' }}
                  >
                    {payload.ticker}
                  </text>
                );
              }}
            />
          )}

          {/* Render dots after labels so they appear above */}
          <Scatter
            data={points}
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              if (cx == null || cy == null) return null;
              return (
                <circle cx={cx} cy={cy} r={5} fill={payload.color} stroke="#111827" strokeWidth={0.5} />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );

  const title = `Risk vs. CAGR (${range.toUpperCase()})`;

  return (
    <MainCard
      title={title}
      headerAction={
        <div data-testid='controls' className='flex flex-row gap-2 items-center'>
          <Button
            variant='outline'
            size='sm'
            type='button'
            aria-label='Toggle Mean Lines'
            onClick={() => setShowMean(!showMean)}
          >
            Mean {showMean ? <EqualIcon /> : <EqualNotIcon />}
          </Button>
          <Button
            variant='outline'
            size='sm'
            type='button'
            aria-label='Toggle Labels'
            onClick={() => setShowLabels(!showLabels)}
          >
            Label {showLabels ? <BookmarkIcon /> : <BookmarkXIcon />}
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
                  onClick={() => share()}
                  disabled={data.length === 0}
                >
                  <PaperclipIcon />
                  Share
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => exportCSV()}
                  disabled={data.length === 0}
                >
                  <SheetIcon />
                  Export as CSV/Excel
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportImage(chartRef, `risk_return_${range}_${new Date().toISOString()}.png`)}
                  disabled={data.length === 0}
                >
                  <ImageIcon />
                  Export as Image
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
      children={mainContent}
    />
  )
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hexToRgb = (hex: string) => {
  const p = hex.replace('#', '');
  return [parseInt(p.substring(0, 2), 16), parseInt(p.substring(2, 4), 16), parseInt(p.substring(4, 6), 16)];
};
const rgbToHex = (c: number[]) => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const colorForT = (t: number) => {
  const red = '#ef4444';
  const yellow = '#f59e0b';
  const green = '#16a34a';
  if (t <= 0.5) {
    const tt = t / 0.5;
    const c1 = hexToRgb(red);
    const c2 = hexToRgb(yellow);
    return rgbToHex([lerp(c1[0], c2[0], tt), lerp(c1[1], c2[1], tt), lerp(c1[2], c2[2], tt)]);
  }
  const tt = (t - 0.5) / 0.5;
  const c1 = hexToRgb(yellow);
  const c2 = hexToRgb(green);
  return rgbToHex([lerp(c1[0], c2[0], tt), lerp(c1[1], c2[1], tt), lerp(c1[2], c2[2], tt)]);
};

const exportImage = async (chartRef: React.RefObject<HTMLDivElement | null>, title: string) => {
  try {
    if (!chartRef.current) {
      toast.error('Chart not found');
      return;
    }
    const svg = chartRef.current.querySelector('svg') as SVGSVGElement | null;
    if (!svg) {
      toast.error('SVG element not found');
      return;
    }

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    // add name spaces if they are missing
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+xmlns:xlink=/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    const width = svg.clientWidth || svg.getBoundingClientRect().width;
    const height = svg.clientHeight || svg.getBoundingClientRect().height;
    const ratio = window.devicePixelRatio || 1;

    const img = new Image();
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        // white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Failed to export image');
            URL.revokeObjectURL(url);
            return;
          }
          const link = document.createElement('a');
          const blobUrl = URL.createObjectURL(blob);
          link.href = blobUrl;
          link.download = title;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          URL.revokeObjectURL(url);
          toast.success('Image exported');
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        toast.error('Failed to export image');
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error('Failed to load SVG for export');
    };
    img.src = url;
  } catch (err) {
    toast.error('Unexpected error exporting image');
  }
}
