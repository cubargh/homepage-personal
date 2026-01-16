/**
 * Interactive Brokers Flex Web Service API Client
 *
 * Implements the two-step process to fetch Flex Query data:
 * 1. SendRequest - Submit query and get reference code
 * 2. GetStatement - Retrieve the actual data using reference code
 *
 * @see https://www.interactivebrokers.com/en/software/am/am/reports/flex_web_service_version_3.htm
 */

import { cache } from "./cache";

const FLEX_BASE_URL =
  "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService";

// Rate limiting: 1 req/sec, 10 req/min
const MIN_REQUEST_INTERVAL = 1000;
let lastRequestTime = 0;

export interface IbkrPosition {
  symbol: string;
  description: string;
  quantity: number;
  price: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  mtdPnL: number;
  ytdPnL: number;
  currency: string;
  assetClass: string;
}

export interface IbkrPerformance {
  mtdPnL: number;
  mtdReturn: number;
  ytdPnL: number;
  ytdReturn: number;
  dailyPnL?: number;
  dailyReturn?: number;
}

export interface IbkrPortfolioData {
  nav: number;
  cash: number;
  stockValue: number;
  currency: string;
  positions: IbkrPosition[];
  performance: IbkrPerformance;
  lastUpdated: string;
}

/**
 * Rate-limited fetch that ensures we don't exceed IB's rate limits
 */
async function rateLimitedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  return fetch(url, {
    ...options,
    headers: {
      "User-Agent": "PersonalDashboard/1.0",
      ...options?.headers,
    },
  });
}

/**
 * Parse XML response from IB Flex Web Service
 */
function parseXmlValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * Parse all elements with a given tag and extract attributes
 * Handles self-closing elements like <Element attr="val" />
 */
function parseXmlElements(
  xml: string,
  tagName: string
): Record<string, string>[] {
  const results: Record<string, string>[] = [];
  // Match self-closing elements with attributes
  const regex = new RegExp(`<${tagName}\\s+([^>]*?)\\s*/>`, "gi");
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const attributes: Record<string, string> = {};
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(match[1])) !== null) {
      attributes[attrMatch[1]] = attrMatch[2];
    }

    results.push(attributes);
  }

  return results;
}

/**
 * Step 1: Send request to get reference code
 */
async function sendRequest(token: string, queryId: string): Promise<string> {
  const url = `${FLEX_BASE_URL}/SendRequest?t=${encodeURIComponent(token)}&q=${encodeURIComponent(queryId)}&v=3`;

  const response = await rateLimitedFetch(url);
  const text = await response.text();

  // Check for errors
  const errorCode = parseXmlValue(text, "ErrorCode");
  if (errorCode && errorCode !== "0") {
    const errorMessage =
      parseXmlValue(text, "ErrorMessage") || "Unknown error";
    throw new Error(
      `IB SendRequest failed: ${errorMessage} (code: ${errorCode})`
    );
  }

  const referenceCode = parseXmlValue(text, "ReferenceCode");
  if (!referenceCode) {
    throw new Error("No reference code returned from IB");
  }

  return referenceCode;
}

/**
 * Step 2: Get statement using reference code
 * Retries if statement is not ready yet
 */
async function getStatement(
  token: string,
  referenceCode: string,
  maxRetries = 10,
  retryDelay = 3000
): Promise<string> {
  const url = `${FLEX_BASE_URL}/GetStatement?t=${encodeURIComponent(token)}&q=${encodeURIComponent(referenceCode)}&v=3`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await rateLimitedFetch(url);
    const text = await response.text();

    // Check for errors
    const errorCode = parseXmlValue(text, "ErrorCode");
    if (errorCode) {
      const errorMessage =
        parseXmlValue(text, "ErrorMessage") || "Unknown error";

      // Error code 1019 means statement is not ready yet
      if (errorCode === "1019") {
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
        throw new Error("Statement not ready after maximum retries");
      }

      throw new Error(
        `IB GetStatement failed: ${errorMessage} (code: ${errorCode})`
      );
    }

    // Success - return the XML data
    return text;
  }

  throw new Error("Failed to get statement after maximum retries");
}

/**
 * Parse Flex Statement XML into structured portfolio data
 *
 * Expected XML elements:
 * - EquitySummaryByReportDateInBase: Daily equity summary with `total` NAV, `cash`, `stock`
 * - MTMPerformanceSummaryUnderlying: Current positions with `closeQuantity`, `closePrice`, `total`
 * - MTDYTDPerformanceSummaryUnderlying: MTD/YTD P&L per symbol
 */
function parseFlexStatement(xml: string): IbkrPortfolioData {
  // =========================================================================
  // 1. Parse NAV, Cash, Stock from EquitySummaryByReportDateInBase
  // =========================================================================
  let nav = 0;
  let cash = 0;
  let stockValue = 0;
  const currency = "USD"; // IB reports in base currency (USD for US accounts)

  const equitySummaries = parseXmlElements(xml, "EquitySummaryByReportDateInBase");
  if (equitySummaries.length > 0) {
    // Get the most recent summary (last one in the list)
    const latestSummary = equitySummaries[equitySummaries.length - 1];
    nav = parseFloat(latestSummary.total || "0");
    cash = parseFloat(latestSummary.cash || "0");
    stockValue = parseFloat(latestSummary.stock || "0");
  }

  // =========================================================================
  // 2. Parse MTD/YTD Performance from MTDYTDPerformanceSummaryUnderlying
  // =========================================================================
  let totalMtdPnL = 0;
  let totalYtdPnL = 0;

  const mtdYtdPerf = parseXmlElements(xml, "MTDYTDPerformanceSummaryUnderlying");
  const perfBySymbol: Record<string, { mtdPnL: number; ytdPnL: number }> = {};

  for (const perf of mtdYtdPerf) {
    const symbol = perf.symbol || "";
    const mtdPnL = parseFloat(perf.mtmMTD || "0");
    const ytdPnL = parseFloat(perf.mtmYTD || "0");

    totalMtdPnL += mtdPnL;
    totalYtdPnL += ytdPnL;

    if (symbol) {
      perfBySymbol[symbol] = { mtdPnL, ytdPnL };
    }
  }

  // =========================================================================
  // 3. Parse Positions from MTMPerformanceSummaryUnderlying
  //    This has closeQuantity, closePrice for current positions
  // =========================================================================
  const mtmPerf = parseXmlElements(xml, "MTMPerformanceSummaryUnderlying");
  const positions: IbkrPosition[] = [];

  for (const perf of mtmPerf) {
    const symbol = perf.symbol || "";
    const quantity = parseFloat(perf.closeQuantity || "0");
    const price = parseFloat(perf.closePrice || "0");

    // Skip positions with no shares (closed positions have closeQuantity = 0)
    if (!symbol || quantity === 0) continue;

    const marketValue = quantity * price;
    const totalPnL = parseFloat(perf.total || "0");

    // Get MTD/YTD P&L for this symbol
    const ytdPerf = perfBySymbol[symbol] || { mtdPnL: 0, ytdPnL: 0 };

    // Cost basis = market value - unrealized P&L (total includes realized + unrealized)
    // For open positions, priorOpenMtm represents unrealized portion
    const unrealizedPnL = parseFloat(perf.priorOpenMtm || "0") + parseFloat(perf.transactionMtm || "0");
    const costBasis = marketValue - unrealizedPnL;

    positions.push({
      symbol,
      description: perf.description?.replace(/&amp;/g, "&") || symbol,
      quantity,
      price,
      marketValue,
      costBasis,
      unrealizedPnL,
      mtdPnL: ytdPerf.mtdPnL,
      ytdPnL: ytdPerf.ytdPnL,
      currency: "USD",
      assetClass: perf.assetCategory || "STK",
    });
  }

  // Sort positions by market value (largest first)
  positions.sort((a, b) => b.marketValue - a.marketValue);

  // =========================================================================
  // 4. Calculate Performance Returns
  // =========================================================================
  let mtdReturn = 0;
  let ytdReturn = 0;

  // Calculate returns as percentage of NAV
  if (nav > 0) {
    const startOfMonthNav = nav - totalMtdPnL;
    const startOfYearNav = nav - totalYtdPnL;

    if (startOfMonthNav > 0) {
      mtdReturn = (totalMtdPnL / startOfMonthNav) * 100;
    }
    if (startOfYearNav > 0) {
      ytdReturn = (totalYtdPnL / startOfYearNav) * 100;
    }
  }

  return {
    nav,
    cash,
    stockValue,
    currency,
    positions,
    performance: {
      mtdPnL: totalMtdPnL,
      mtdReturn,
      ytdPnL: totalYtdPnL,
      ytdReturn,
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calculate daily change by comparing to cached previous NAV
 */
function calculateDailyChange(
  currentNav: number,
  performance: IbkrPerformance
): IbkrPerformance {
  const today = new Date().toISOString().split("T")[0];

  // Get cached NAV from yesterday
  const cachedNav = cache.get<{ nav: number; date: string }>("ibkr_daily_nav");

  if (cachedNav && cachedNav.date !== today) {
    // We have yesterday's NAV, calculate daily change
    const dailyPnL = currentNav - cachedNav.nav;
    const dailyReturn =
      cachedNav.nav !== 0 ? (dailyPnL / cachedNav.nav) * 100 : 0;

    performance.dailyPnL = dailyPnL;
    performance.dailyReturn = dailyReturn;
  }

  // Cache current NAV for tomorrow's comparison
  // Use a long TTL (48 hours) to survive overnight
  cache.set(
    "ibkr_daily_nav",
    { nav: currentNav, date: today },
    48 * 60 * 60 * 1000
  );

  return performance;
}

/**
 * Fetch IBKR portfolio data using Flex Web Service
 *
 * @param token - Flex Web Service token from IB
 * @param queryId - Activity Flex Query ID from IB
 * @returns Parsed portfolio data
 */
export async function fetchIbkrPortfolio(
  token: string,
  queryId: string
): Promise<IbkrPortfolioData> {
  // Step 1: Get reference code
  const referenceCode = await sendRequest(token, queryId);

  // Step 2: Get statement (with retry logic for "not ready" responses)
  const statementXml = await getStatement(token, referenceCode);

  // Step 3: Parse the XML into structured data
  const portfolioData = parseFlexStatement(statementXml);

  // Step 4: Calculate daily change from cached NAV
  portfolioData.performance = calculateDailyChange(
    portfolioData.nav,
    portfolioData.performance
  );

  return portfolioData;
}

/**
 * Parse IBKR portfolio data from raw XML string
 * Useful for testing or when XML is already available
 */
export function parseIbkrXml(xml: string): IbkrPortfolioData {
  return parseFlexStatement(xml);
}
