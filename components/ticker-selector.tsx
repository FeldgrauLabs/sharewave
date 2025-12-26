"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { XIcon } from "lucide-react";
import { Data, ValidRange } from "@/lib/db";
import { Input } from "./ui/input";
import { Field, FieldContent } from "./ui/field";
import { ButtonGroup } from "./ui/button-group";
import { MaxTickers } from "@/app/page";

interface TickerSelectorProps {
  tickers: Data[];
  range: ValidRange;
}

function SearchBox({
  onAdd,
  selectedTickers,
  maxReached,
}: {
  onAdd: (item: { ticker: string; name: string }) => void;
  selectedTickers: string[];
  maxReached: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ ticker: string; name: string }>>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    // don't trigger server-side search when we've hit the max limit
    if (maxReached) {
      setResults([]);
      setOpen(false);
      return;
    }

    const id = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          const list = data ?? [];
          // filter out already-selected tickers so we don't show duplicates
          const filtered = list.filter((item: { ticker: string }) => !selectedTickers.includes(item.ticker));
          setResults(filtered);
          setOpen(true);
        })
        .catch(() => {
          setResults([]);
        });
    }, 250);

    return () => clearTimeout(id);
  }, [query]);

  // close dropdown when clicking outside the container
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative mb-2">
      <Field>
        <FieldContent>
          <Input
            aria-label="Search tickers"
            placeholder={maxReached ? `Maximum ${MaxTickers} tickers selected` : "Search ticker or name"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={maxReached}
          />
        </FieldContent>
      </Field>

      {open && results.length > 0 && (
        <div className="absolute left-0 top-full mt-2 w-full max-h-60 overflow-auto text-xs z-50 border border-slate-200 bg-white rounded-md shadow-md">
          <div className="p-2">
            <div className="flex flex-col">
              {results.map((item) => (
                <Button
                  key={item.ticker}
                  variant='ghost'
                  size='sm'
                  className="justify-start"
                  onClick={() => {
                    onAdd(item);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  {item.ticker} - {item.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TickerSelector({ tickers, range: initialRange }: TickerSelectorProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [selected, setSelected] = useState<Data[]>(() => {
    return [...tickers].sort((a, b) => a.ticker.localeCompare(b.ticker));
  });
  const [range, setRange] = useState<ValidRange>(initialRange ?? '3y');

  const handleRemove = (ticker: string) => {
    setSelected((prev) => {
      const next = prev.filter((t) => t.ticker !== ticker);
      return [...next].sort((a, b) => a.ticker.localeCompare(b.ticker));
    });
  };

  const handleAdd = (item: { ticker: string; name: string }) => {
    setSelected((prev) => {
      if (prev.find((p) => p.ticker === item.ticker)) return prev;
      if (prev.length >= MaxTickers) return prev;
      const next = [...prev, { ticker: item.ticker, name: item.name, cagr: {} as any, risk: {} as any, last_updated: '', earliest_data: '' }];
      return [...next].sort((a, b) => a.ticker.localeCompare(b.ticker));
    });
  };

  const handleApply = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const qs = new URLSearchParams();
    const tickersOnly = selected.map((s) => s.ticker);
    if (tickersOnly.length) qs.set("tickers", tickersOnly.join(","));
    if (range) qs.set("range", range);
    const url = qs.toString() ? `${pathname}?${qs.toString()}` : pathname;
    router.push(url);
  };

  return (
    <form onSubmit={handleApply} className="w-full">
      <Card className="min-h-[560px] flex flex-col w-full z-50 max-h-screen overflow-auto">
        <CardHeader>
          <div className="flex flex-row items-center">
            <h2 className="text-lg font-medium">Configuration</h2>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto py-2">
          <div>
            <SearchBox
              onAdd={handleAdd}
              selectedTickers={selected.map((s) => s.ticker)}
              maxReached={selected.length >= MaxTickers}
            />
            <div>
              {selected.length === 0 ? (
                <p className="text-sm text-slate-500">No tickers selected</p>
              ) : (
                selected.map((ticker) => (
                  <div
                    key={ticker.ticker}
                    className="flex flex-row items-center gap-2"
                  >
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      type='button'
                      aria-label={`Remove ${ticker.ticker}`}
                      onClick={() => handleRemove(ticker.ticker)}
                    >
                      <XIcon className="text-red-500" />
                    </Button>
                    <span className="text-slate-900">{ticker.ticker}</span>
                  </div>
                ))
              )}
            </div>
            {selected.length >= MaxTickers && (
              <p className="text-sm text-red-500 mt-2">Maximum {MaxTickers} tickers selected.</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <ButtonGroup>
            <Button
              type='button'
              onClick={() => setRange('3y')}
              variant={range === '3y' ? 'default' : 'outline'}
            >
              3Y
            </Button>
            <Button
              type='button'
              onClick={() => setRange('5y')}
              variant={range === '5y' ? 'default' : 'outline'}
            >
              5Y
            </Button>
            <Button
              type='button'
              onClick={() => setRange('10y')}
              variant={range === '10y' ? 'default' : 'outline'}
            >
              10Y
            </Button>
          </ButtonGroup>
          <Button
            type="submit"
            variant='default'
          >
            Apply
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}