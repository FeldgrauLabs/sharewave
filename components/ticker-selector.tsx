"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Columns2Icon, XIcon } from "lucide-react";
import { Data, ValidRange } from "@/lib/db";
import { Input } from "./ui/input";
import { Field, FieldContent } from "./ui/field";
import { ButtonGroup } from "./ui/button-group";
import { MaxTickers } from "@/app/page";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { PortfolioThemes } from "@/lib/portfolio-theme";
import { SideCard } from "./side-card";

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
            placeholder={maxReached ? `Maximum ${MaxTickers} tickers selected` : "Search tickers..."}
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
                  {item.ticker}
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
    return tickers.sort((a, b) => a.ticker.localeCompare(b.ticker));
  });
  const [range, setRange] = useState<ValidRange>(initialRange ?? '3y');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    router.replace(url);
    router.refresh();
  };

  const handlePortfolioThemeApply = (themeTickers: string[]) => {
    // update local selected state immediately so the UI rerenders
    const next = themeTickers.slice(0, MaxTickers).map((t) => ({
      ticker: t,
      name: t,
      cagr: {} as any,
      risk: {} as any,
      last_updated: '',
      earliest_data: '',
    }));
    setSelected(() => [...next].sort((a, b) => a.ticker.localeCompare(b.ticker)));
    setIsDialogOpen(false);

    const qs = new URLSearchParams();
    if (range) qs.set("range", range);
    qs.set("tickers", themeTickers.slice(0, MaxTickers).join(","));
    const url = qs.toString() ? `${pathname}?${qs.toString()}` : pathname;
    router.replace(url);
    router.refresh();
  }

  return (
    <form onSubmit={handleApply} className="w-full">
      <SideCard
        title="Configuration"
        headerAction={
          <PortfolioSelectDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onApplyTheme={handlePortfolioThemeApply}
          />
        }
        children={
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
        }
        footer={
          <>
            <div className="flex items-center space-x-2">
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
            </div>

            <div className="flex items-center space-x-4">
              <Button
                type="submit"
                variant='default'
                disabled={selected.length === 0}
              >
                Apply
              </Button>
            </div>
          </>
        }
      />
    </form >
  );
}

function PortfolioSelectDialog({
  isOpen,
  onOpenChange,
  onApplyTheme,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTheme: (themeTickers: string[]) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <Button
        type='button'
        variant='outline'
        size='icon-sm'
        onClick={() => onOpenChange(true)}
      >
        <Columns2Icon />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Portfolio Theme</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3 max-h-64 overflow-auto">
          {PortfolioThemes.map((theme) => (
            <div
              key={theme.name}
              className={`p-3 rounded border cursor-pointer border-transparent hover:border-slate-200`}
              onClick={() => {
                onApplyTheme(theme.tickers)
                onOpenChange(false);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{theme.name}</div>
                <div className="text-xs text-slate-500">{theme.tickers.length} tickers</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {theme.tickers.map((t) => (
                  <div
                    key={t}
                    className="px-2 py-1 rounded bg-slate-100 text-slate-700"
                  >{t}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
