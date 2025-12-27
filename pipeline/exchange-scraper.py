

import os
import requests
from bs4 import BeautifulSoup

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
}

def scrape_sp100() -> list[str]:
    # Scrape S&P 100 tickers from Wikipedia
    url = "https://en.wikipedia.org/wiki/S%26P_100"
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    table = soup.find('table', {'id': 'constituents'})
    print("Scraping S&P 100 tickers from Wikipedia...")
    tickers = []
    for row in table.find_all('tr')[1:]:
        ticker = row.find_all('td')[0].text.strip()
        tickers.append(ticker)
    return tickers

def scrape_nasdaq100() -> list[str]:
    # Scrape NASDAQ-100 tickers from Wikipedia
    url = "https://en.wikipedia.org/wiki/NASDAQ-100"
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    table = soup.find('table', {'id': 'constituents'})
    print("Scraping NASDAQ-100 tickers from Wikipedia...")
    tickers = []
    for row in table.find_all('tr')[1:]:
        ticker = row.find_all('td')[0].text.strip()
        tickers.append(ticker)
    return tickers

def scrape_asx50() -> list[str]:
    # Scrape ASX 50 tickers from Wikipedia
    url = "https://en.wikipedia.org/wiki/S%26P/ASX_50"
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    table = soup.find('table', {'class': 'wikitable sortable'})
    print("Scraping ASX 50 tickers from Wikipedia...")
    tickers = []
    for row in table.find_all('tr')[1:]:
        ticker = row.find_all('td')[0].text.strip()
        tickers.append(ticker)
    return tickers

class OutputManager():
    def __init__(self, folder="."):
        self.folder = folder
        self.exchanges = {}

    def add_exchange(self, exchange: str, tickers: list[str]):
        self.exchanges[exchange] = tickers

    def save(self):
        for exchange, tickers in self.exchanges.items():
            path = os.path.join(self.folder, f"{exchange}.txt")
            with open(path, "w") as f:
                for ticker in tickers:
                    f.write(f"{ticker}\n")
            print(f"Saved {len(tickers)} tickers to {path}")

if __name__ == "__main__":
    sp100_tickers = scrape_sp100()
    nasdaq100_tickers = scrape_nasdaq100()
    asx50_tickers = scrape_asx50()

    output_manager = OutputManager(folder="../dataset")
    output_manager.add_exchange("us-sp100", sp100_tickers)
    output_manager.add_exchange("us-nasdaq100", nasdaq100_tickers)
    output_manager.add_exchange("au-asx50", asx50_tickers)
    
    output_manager.save()