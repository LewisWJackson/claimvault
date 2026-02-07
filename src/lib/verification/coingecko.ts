import type { PriceData } from './types';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function getXRPPriceData(): Promise<PriceData> {
  const apiKey = process.env.COINGECKO_API_KEY;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey && !apiKey.startsWith('http')) {
    headers['x-cg-demo-api-key'] = apiKey;
  }

  const res = await fetch(
    `${COINGECKO_BASE}/coins/ripple?localization=false&tickers=false&community_data=false&developer_data=false`,
    { headers, next: { revalidate: 300 } }
  );

  if (!res.ok) throw new Error(`CoinGecko error (${res.status})`);
  const data = await res.json();
  const md = data.market_data;

  return {
    currentPrice: md.current_price.usd,
    currency: 'USD',
    priceAtClaimDate: null,
    percentChange1y: md.price_change_percentage_1y,
    allTimeHigh: md.ath.usd,
    allTimeHighDate: md.ath_date.usd,
    marketCap: md.market_cap.usd,
  };
}
