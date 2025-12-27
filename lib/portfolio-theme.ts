export interface PortfolioTheme {
  name: string;
  description: string;

  tickers: string[];
}

export const PortfolioThemes: PortfolioTheme[] = [
  {
    name: "Magnificent Seven",
    description: "The seven largest and most dominant tech companies in the U.S. stock market.",
    tickers: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"],
  },
  {
    name: "Semiconductor Leaders",
    description: "Leading companies in the semiconductor industry driving innovation and technology.",
    tickers: ["NVDA", "AMD", "INTC", "TXN", "QCOM", "AVGO", "ASML"],
  },
  {
    name: "Financial Leaders",
    description: "Top financial institutions in the U.S. known for their market influence and stability.",
    tickers: ["JPM", "BAC", "AXP", "V", "MA", "C", "GS", "XYZ"],
  },
  {
    name: "Consumer Discretionary",
    description: "Major players in the consumer discretionary sector, known for their strong market presence.",
    tickers: ["AMZN", "TSLA", "HD", "MCD", "NKE", "SBUX", "LOW", "NFLX"],
  }
];

