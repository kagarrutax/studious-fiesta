/**
 * Visual check: lightbox must cover the full viewport (not the rotated PostCard).
 * Run: node scripts/visual-lightbox.mjs
 */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../tmp-visual')
mkdirSync(outDir, { recursive: true })

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; background: #1a2420; min-height: 100vh; }
    .card {
      margin: 80px auto;
      width: 420px;
      padding: 16px;
      background: #24312c;
      transform: rotate(-0.4deg); /* same trap as rotate-sp-* */
    }
    .thumb { width: 100%; height: 240px; object-fit: cover; cursor: zoom-in; display: block; }
    .lightbox-bad {
      position: fixed; inset: 0; z-index: 80;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,.92);
    }
    .lightbox-good {
      position: fixed; inset: 0; z-index: 100;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,.95);
    }
    .lightbox-good img, .lightbox-bad img {
      max-width: 96vw; max-height: 90vh; object-fit: contain;
    }
  </style>
</head>
<body>
  <article class="card" id="card">
    <img class="thumb" id="thumb" src="https://picsum.photos/seed/studious/1200/800" alt="thumb" />
  </article>
  <script>
    const thumb = document.getElementById('thumb')
    const card = document.getElementById('card')
    const mode = new URLSearchParams(location.search).get('mode') || 'bad'
    thumb.onclick = () => {
      const overlay = document.createElement('div')
      overlay.className = mode === 'good' ? 'lightbox-good' : 'lightbox-bad'
      overlay.id = 'lightbox'
      const img = document.createElement('img')
      img.src = thumb.src
      overlay.appendChild(img)
      if (mode === 'good') document.body.appendChild(overlay)
      else card.appendChild(overlay)
    }
  </script>
</body>
</html>`

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(html)
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const { port } = server.address()
const base = `http://127.0.0.1:${port}`

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

async function measure(mode) {
  await page.goto(`${base}/?mode=${mode}`, { waitUntil: 'networkidle' })
  await page.click('#thumb')
  await page.waitForSelector('#lightbox')
  const metrics = await page.evaluate(() => {
    const box = document.getElementById('lightbox').getBoundingClientRect()
    return {
      width: Math.round(box.width),
      height: Math.round(box.height),
      top: Math.round(box.top),
      left: Math.round(box.left),
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    }
  })
  const shot = join(outDir, `lightbox-${mode}.png`)
  await page.screenshot({ path: shot, fullPage: false })
  return { metrics, shot }
}

const bad = await measure('bad')
const good = await measure('good')

const badCovers =
  bad.metrics.width >= bad.metrics.viewportW - 2 &&
  bad.metrics.height >= bad.metrics.viewportH - 2 &&
  bad.metrics.top === 0 &&
  bad.metrics.left === 0

const goodCovers =
  good.metrics.width >= good.metrics.viewportW - 2 &&
  good.metrics.height >= good.metrics.viewportH - 2 &&
  good.metrics.top === 0 &&
  good.metrics.left === 0

const report = {
  finding:
    'A fixed lightbox inside an element with CSS transform (PostCard rotate-sp-*) is clipped to the card, not the viewport.',
  bad: { ...bad.metrics, coversViewport: badCovers, screenshot: bad.shot },
  good: { ...good.metrics, coversViewport: goodCovers, screenshot: good.shot },
  pass: !badCovers && goodCovers,
}

writeFileSync(join(outDir, 'lightbox-report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))

await browser.close()
server.close()
process.exit(report.pass ? 0 : 1)
