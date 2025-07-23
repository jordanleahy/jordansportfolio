/**
 * Production debugging utility for OG routing
 * Add this to your blog pages to help debug crawler detection
 */

// Type declarations for global analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export interface RoutingDebugInfo {
  userAgent: string;
  isCrawlerDetected: boolean;
  currentPath: string;
  expectedBehavior: string;
  timestamp: string;
  referrer: string;
}

/**
 * Detect if current request is from a crawler
 */
function detectCrawler(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return /bot|crawler|spider|crawling|facebook|twitter|linkedin|whatsapp|telegram|slack|discord/i.test(userAgent);
}

/**
 * Get debugging information about current request
 */
export function getRoutingDebugInfo(): RoutingDebugInfo {
  const isCrawler = detectCrawler();
  const currentPath = window.location.pathname;
  
  return {
    userAgent: navigator.userAgent,
    isCrawlerDetected: isCrawler,
    currentPath,
    expectedBehavior: isCrawler ? 'Should have been served static HTML' : 'Correctly served SPA',
    timestamp: new Date().toISOString(),
    referrer: document.referrer
  };
}

/**
 * Log routing debug info to console (development only)
 */
export function logRoutingDebug(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const info = getRoutingDebugInfo();
  
  console.group('🔍 OG Routing Debug Info');
  console.log('User Agent:', info.userAgent);
  console.log('Is Crawler:', info.isCrawlerDetected);
  console.log('Current Path:', info.currentPath);
  console.log('Expected Behavior:', info.expectedBehavior);
  console.log('Referrer:', info.referrer);
  console.log('Timestamp:', info.timestamp);
  
  if (info.isCrawlerDetected) {
    console.warn('⚠️ Crawler detected in SPA - this might indicate routing issue');
    console.log('💡 Crawlers should get static HTML, not the SPA');
  } else {
    console.log('✅ Regular user correctly served SPA');
  }
  
  console.groupEnd();
}

/**
 * Add debug banner for crawlers that somehow reach the SPA
 */
export function addCrawlerDebugBanner(): void {
  if (!detectCrawler()) return;
  
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff6b6b;
    color: white;
    padding: 10px;
    text-align: center;
    z-index: 9999;
    font-family: monospace;
    font-size: 14px;
  `;
  banner.textContent = '⚠️ CRAWLER DETECTED IN SPA - Check Netlify redirects';
  
  document.body.appendChild(banner);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    banner.remove();
  }, 10000);
}

/**
 * Send debug info to analytics (if configured)
 */
export function trackRoutingDebug(): void {
  const info = getRoutingDebugInfo();
  
  // Example: Send to your analytics service
  if (window.gtag) {
    window.gtag('event', 'og_routing_debug', {
      custom_parameter_1: info.isCrawlerDetected ? 'crawler' : 'browser',
      custom_parameter_2: info.currentPath
    });
  }
  
  // Example: Send to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('OG Routing Debug:', info);
  }
}

/**
 * Initialize routing debug utilities
 * Call this in your blog components
 */
export function initRoutingDebug(): void {
  // Log debug info
  logRoutingDebug();
  
  // Add visual warning for crawlers in SPA
  addCrawlerDebugBanner();
  
  // Track for analytics
  trackRoutingDebug();
}

/**
 * Test different user agents (development only)
 */
export function testUserAgents(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const testAgents = [
    'facebookexternalhit/1.1',
    'Twitterbot/1.0',
    'LinkedInBot/1.0',
    'Mozilla/5.0 (compatible; Discordbot/2.0)',
    'WhatsApp/2.19.81',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  ];
  
  console.group('🧪 User Agent Tests');
  testAgents.forEach(ua => {
    const isCrawler = /bot|crawler|spider|crawling|facebook|twitter|linkedin|whatsapp|telegram|slack|discord/i.test(ua);
    console.log(`${isCrawler ? '🤖' : '🌐'} ${ua}: ${isCrawler ? 'CRAWLER' : 'BROWSER'}`);
  });
  console.groupEnd();
}

export default {
  getRoutingDebugInfo,
  logRoutingDebug,
  addCrawlerDebugBanner,
  trackRoutingDebug,
  initRoutingDebug,
  testUserAgents
};