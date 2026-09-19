const { chromium } = require('playwright');

const routes = [
  { path: '/', name: 'play', wait: 'text=Level 42' },
  { path: '/stages', name: 'stages', wait: 'text=Prismatic Laboratory' },
  { path: '/themes', name: 'themes', wait: 'text=Vial Collections' },
  { path: '/rank', name: 'rank', wait: 'text=FluidMaster_99' },
  { path: '/level-complete', name: 'level-complete', wait: 'text=CLEARED!' },
];

(async () => {
  const browser = await chromium.launch();
  for (const r of routes) {
    const page = await browser.newPage({ viewport: { width: 402, height: 900 } });
    page.on('pageerror', (err) => console.log(r.name, 'PAGEERROR', err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log(r.name, 'CONSOLE ERROR', msg.text());
    });
    await page.goto(`http://localhost:8123${r.path}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector(r.wait, { timeout: 20000 }).catch((e) => console.log(r.name, 'selector wait failed', e.message));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `C:/Users/ranod/Downloads/water sort/WaterSortApp/.shots/${r.name}.png` });
    await page.close();
  }
  await browser.close();
})();
