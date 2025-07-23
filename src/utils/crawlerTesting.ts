/**
 * Utility for testing crawler detection and routing
 * This helps validate that the Netlify redirects work correctly
 */

export interface CrawlerTestResult {
  userAgent: string;
  isCrawler: boolean;
  expectedRoute: string;
  platform: string;
}

export const CRAWLER_USER_AGENTS = {
  // Facebook/Meta
  facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  facebot: 'Facebot',
  
  // Twitter/X
  twitterbot: 'Twitterbot/1.0',
  twitterbot_lower: 'twitterbot/1.0',
  
  // LinkedIn
  linkedinbot: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  linkedin_lower: 'linkedin bot',
  
  // WhatsApp
  whatsapp: 'WhatsApp/2.19.81 A',
  
  // Slack
  slackbot: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  
  // Discord
  discordbot: 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  
  // Telegram
  telegram: 'TelegramBot (like TwitterBot)',
  
  // Search engines
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  
  // Generic patterns
  generic_bot: 'SomeBot/1.0',
  generic_crawler: 'WebCrawler/1.0',
  generic_spider: 'Spider/1.0',
  crawling_agent: 'CrawlingAgent/1.0',
  
  // Regular browsers (should NOT be detected as crawlers)
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
};

/**
 * Test if a user agent should be detected as a crawler
 */
export function testCrawlerDetection(userAgent: string): boolean {
  return /bot|crawler|spider|crawling|facebook|twitter|linkedin|whatsapp|telegram|slack|discord/i.test(userAgent);
}

/**
 * Get expected route for a given user agent
 */
export function getExpectedRoute(userAgent: string, slug: string): string {
  const isCrawler = testCrawlerDetection(userAgent);
  return isCrawler ? `/blog/${slug}.html` : '/index.html';
}

/**
 * Identify the platform from user agent
 */
export function identifyPlatform(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('facebook') || ua.includes('facebot')) return 'Facebook';
  if (ua.includes('twitter')) return 'Twitter/X';
  if (ua.includes('linkedin')) return 'LinkedIn';
  if (ua.includes('whatsapp')) return 'WhatsApp';
  if (ua.includes('slack')) return 'Slack';
  if (ua.includes('discord')) return 'Discord';
  if (ua.includes('telegram')) return 'Telegram';
  if (ua.includes('google')) return 'Google';
  if (ua.includes('bing')) return 'Bing';
  if (ua.includes('bot')) return 'Generic Bot';
  if (ua.includes('crawler')) return 'Generic Crawler';
  if (ua.includes('spider')) return 'Generic Spider';
  if (ua.includes('chrome')) return 'Chrome Browser';
  if (ua.includes('firefox')) return 'Firefox Browser';
  if (ua.includes('safari')) return 'Safari Browser';
  if (ua.includes('edge')) return 'Edge Browser';
  
  return 'Unknown';
}

/**
 * Run comprehensive crawler detection tests
 */
export function runCrawlerTests(slug = 'test-post'): CrawlerTestResult[] {
  return Object.entries(CRAWLER_USER_AGENTS).map(([key, userAgent]) => ({
    userAgent,
    isCrawler: testCrawlerDetection(userAgent),
    expectedRoute: getExpectedRoute(userAgent, slug),
    platform: identifyPlatform(userAgent)
  }));
}

/**
 * Generate test report
 */
export function generateTestReport(slug = 'test-post'): string {
  const results = runCrawlerTests(slug);
  const crawlers = results.filter(r => r.isCrawler);
  const browsers = results.filter(r => !r.isCrawler);
  
  let report = '# Crawler Detection Test Report\n\n';
  
  report += `## Summary\n`;
  report += `- Total tests: ${results.length}\n`;
  report += `- Detected as crawlers: ${crawlers.length}\n`;
  report += `- Detected as browsers: ${browsers.length}\n\n`;
  
  report += `## Crawlers (should get /blog/${slug}.html)\n`;
  crawlers.forEach(result => {
    report += `- ${result.platform}: ${result.expectedRoute}\n`;
  });
  
  report += `\n## Browsers (should get /index.html)\n`;
  browsers.forEach(result => {
    report += `- ${result.platform}: ${result.expectedRoute}\n`;
  });
  
  report += `\n## Netlify Testing\n`;
  report += `Test these URLs with different user agents:\n`;
  report += `- https://yoursite.netlify.app/blog/${slug}\n`;
  report += `- Use browser dev tools to modify User-Agent header\n`;
  report += `- Check network tab to see which file is served\n\n`;
  
  report += `## Expected Behavior\n`;
  report += `- Crawlers: Get static HTML with OG tags immediately\n`;
  report += `- Browsers: Get SPA, then client-side routing\n`;
  
  return report;
}

/**
 * Console test runner for development
 */
export function runTestsInConsole(slug = 'test-post'): void {
  console.group('🔍 Crawler Detection Tests');
  
  const results = runCrawlerTests(slug);
  
  console.log('📊 Summary:');
  console.log(`Total tests: ${results.length}`);
  console.log(`Crawlers: ${results.filter(r => r.isCrawler).length}`);
  console.log(`Browsers: ${results.filter(r => !r.isCrawler).length}`);
  
  console.group('🤖 Crawlers (get static HTML)');
  results.filter(r => r.isCrawler).forEach(result => {
    console.log(`✅ ${result.platform}: ${result.expectedRoute}`);
  });
  console.groupEnd();
  
  console.group('🌐 Browsers (get SPA)');
  results.filter(r => !r.isCrawler).forEach(result => {
    console.log(`✅ ${result.platform}: ${result.expectedRoute}`);
  });
  console.groupEnd();
  
  console.groupEnd();
}

// Export for easy testing
export default {
  testCrawlerDetection,
  getExpectedRoute,
  identifyPlatform,
  runCrawlerTests,
  generateTestReport,
  runTestsInConsole,
  CRAWLER_USER_AGENTS
};