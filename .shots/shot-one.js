const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 402, height: 900 } });
  page.on('pageerror', (err) => console.log('PAGEERROR', err.message));
  await page.goto('http://localhost:8123/level-complete', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('text=CLEARED!', { timeout: 20000 }).catch((e) => console.log('wait failed', e.message));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/ranod/Downloads/water sort/WaterSortApp/.shots/level-complete2.png' });
  await browser.close();
})();
