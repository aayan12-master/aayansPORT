import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--window-size=1536,1024'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 1024 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  const info = await page.evaluate(() => {
    const elOverview = document.getElementById('overview');
    const images = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      rect: img.getBoundingClientRect(),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      computedDisplay: window.getComputedStyle(img).display,
      computedPos: window.getComputedStyle(img).position,
      computedWidth: window.getComputedStyle(img).width,
      computedHeight: window.getComputedStyle(img).height,
    }));

    const bodyRect = document.body.getBoundingClientRect();
    const overviewRect = elOverview ? elOverview.getBoundingClientRect() : null;

    return {
      bodyHeight: document.body.scrollHeight,
      bodyRect,
      overviewRect,
      images,
    };
  });

  console.log('DIAGNOSTIC INFO:');
  console.log('Body scrollHeight:', info.bodyHeight);
  console.log('Overview rect:', info.overviewRect);
  console.log('Images count:', info.images.length);
  info.images.slice(0, 10).forEach((img, i) => {
    console.log(`Image ${i}:`, img.src.split('/').pop(), 'rect:', img.rect, 'pos:', img.computedPos, 'w/h:', img.computedWidth, img.computedHeight);
  });

  await browser.close();
}

main().catch(console.error);
