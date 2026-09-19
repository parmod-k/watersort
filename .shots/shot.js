const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 402, height: 900 } });
  page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR', err.message));
  await page.goto('http://localhost:8123/', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForSelector('text=Level 42', { timeout: 30000 }).catch((e) => console.log('selector wait failed', e.message));
  await page.waitForTimeout(1000);

  const diag = await page.evaluate(() => {
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
    };
  });
  console.log('DIAG', JSON.stringify(diag));

  const html = await page.content();
  require('fs').writeFileSync('C:/Users/ranod/Downloads/water sort/WaterSortApp/.shots/page.html', html);
  await page.screenshot({ path: 'C:/Users/ranod/Downloads/water sort/WaterSortApp/.shots/play-pw.png' });
  await browser.close();
})();
