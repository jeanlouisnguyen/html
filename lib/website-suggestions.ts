export interface SiteSuggestion {
  name: string;
  domain: string;
  category: string;
}

/**
 * Popular services, providers, retailers, financial entities and utilities
 * likely used by someone living in Montreal. Used to autocomplete the
 * "website" field on password entries and to fetch favicons.
 */
export const SITE_SUGGESTIONS: SiteSuggestion[] = [
  // Telecom / mobile
  { name: "Fizz", domain: "fizz.ca", category: "Telecom" },
  { name: "Videotron", domain: "videotron.com", category: "Telecom" },
  { name: "Bell", domain: "bell.ca", category: "Telecom" },
  { name: "Rogers", domain: "rogers.com", category: "Telecom" },
  { name: "Telus", domain: "telus.com", category: "Telecom" },
  { name: "Koodo", domain: "koodomobile.com", category: "Telecom" },

  // Transit / utilities
  { name: "STM (Metro)", domain: "stm.info", category: "Transit" },
  { name: "Hydro-Québec", domain: "hydroquebec.com", category: "Utility" },
  { name: "Énergir", domain: "energir.com", category: "Utility" },
  { name: "BIXI", domain: "bixi.com", category: "Transit" },
  { name: "Opus", domain: "carteopus.info", category: "Transit" },

  // Banks / finance / fintech
  { name: "Wealthsimple", domain: "wealthsimple.com", category: "Finance" },
  { name: "Neo Financial", domain: "neofinancial.com", category: "Finance" },
  { name: "KOHO", domain: "koho.ca", category: "Finance" },
  { name: "Capital One", domain: "capitalone.ca", category: "Finance" },
  { name: "Desjardins", domain: "desjardins.com", category: "Finance" },
  { name: "RBC Royal Bank", domain: "rbcroyalbank.com", category: "Finance" },
  { name: "TD Canada Trust", domain: "td.com", category: "Finance" },
  { name: "Scotiabank", domain: "scotiabank.com", category: "Finance" },
  { name: "BMO", domain: "bmo.com", category: "Finance" },
  { name: "Tangerine", domain: "tangerine.ca", category: "Finance" },
  { name: "EQ Bank", domain: "eqbank.ca", category: "Finance" },
  { name: "American Express", domain: "americanexpress.com", category: "Finance" },
  { name: "PayPal", domain: "paypal.com", category: "Finance" },

  // Government
  { name: "Canada Revenue Agency", domain: "canada.ca", category: "Government" },
  { name: "Revenu Québec", domain: "revenuquebec.ca", category: "Government" },
  { name: "Service québécois d'authentification", domain: "authentification.quebec.ca", category: "Government" },
  { name: "SAAQ", domain: "saaq.gouv.qc.ca", category: "Government" },
  { name: "RAMQ", domain: "ramq.gouv.qc.ca", category: "Government" },
  { name: "Service Canada", domain: "canada.ca", category: "Government" },

  // Grocery / retail
  { name: "IGA", domain: "iga.net", category: "Grocery" },
  { name: "Metro", domain: "metro.ca", category: "Grocery" },
  { name: "Provigo", domain: "provigo.ca", category: "Grocery" },
  { name: "Maxi", domain: "maxi.ca", category: "Grocery" },
  { name: "Costco", domain: "costco.ca", category: "Retail" },
  { name: "Canadian Tire", domain: "canadiantire.ca", category: "Retail" },
  { name: "Amazon", domain: "amazon.ca", category: "Retail" },
  { name: "Walmart", domain: "walmart.ca", category: "Retail" },
  { name: "Best Buy", domain: "bestbuy.ca", category: "Retail" },
  { name: "SAQ", domain: "saq.com", category: "Retail" },

  // Big tech / accounts
  { name: "Apple", domain: "apple.com", category: "Tech" },
  { name: "Google", domain: "google.com", category: "Tech" },
  { name: "Microsoft", domain: "microsoft.com", category: "Tech" },
  { name: "Amazon", domain: "amazon.com", category: "Tech" },
  { name: "OpenAI", domain: "openai.com", category: "Tech" },
  { name: "X", domain: "x.com", category: "Social" },
  { name: "Notion", domain: "notion.so", category: "Productivity" },
  { name: "Meta / Facebook", domain: "facebook.com", category: "Social" },
  { name: "Instagram", domain: "instagram.com", category: "Social" },
  { name: "LinkedIn", domain: "linkedin.com", category: "Social" },
  { name: "GitHub", domain: "github.com", category: "Tech" },
  { name: "Dropbox", domain: "dropbox.com", category: "Tech" },

  // Entertainment / gaming
  { name: "Steam", domain: "steampowered.com", category: "Gaming" },
  { name: "PlayStation", domain: "playstation.com", category: "Gaming" },
  { name: "Xbox", domain: "xbox.com", category: "Gaming" },
  { name: "Nintendo", domain: "nintendo.com", category: "Gaming" },
  { name: "Netflix", domain: "netflix.com", category: "Streaming" },
  { name: "Spotify", domain: "spotify.com", category: "Streaming" },
  { name: "Disney+", domain: "disneyplus.com", category: "Streaming" },
  { name: "Crave", domain: "crave.ca", category: "Streaming" },

  // Food delivery / misc
  { name: "Uber", domain: "uber.com", category: "Transport" },
  { name: "DoorDash", domain: "doordash.com", category: "Food" },
  { name: "Skip the Dishes", domain: "skipthedishes.com", category: "Food" },
];

/** Favicon URL for a domain (free, no API key). */
export function faviconFor(domain: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/** Fuzzy match site suggestions by name or domain. */
export function searchSites(query: string, limit = 6): SiteSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: SiteSuggestion[] = [];
  const includes: SiteSuggestion[] = [];
  for (const s of SITE_SUGGESTIONS) {
    const name = s.name.toLowerCase();
    const dom = s.domain.toLowerCase();
    if (name.startsWith(q) || dom.startsWith(q)) starts.push(s);
    else if (name.includes(q) || dom.includes(q)) includes.push(s);
  }
  return [...starts, ...includes].slice(0, limit);
}
