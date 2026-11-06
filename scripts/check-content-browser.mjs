// Optional end-to-end check using a locally installed Chromium, without production data.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { openSync, closeSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

async function freePort() { const probe = createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve)); const port = probe.address().port; await new Promise(resolve => probe.close(resolve)); return port }
const frontendPort = await freePort(), browserPort = await freePort()
const origin = `http://127.0.0.1:${frontendPort}`
const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(root, '.qa')
await mkdir(output, { recursive: true })
const directory = await mkdtemp(path.join(tmpdir(), 'arc-content-browser-'))
process.env.NODE_ENV = 'test'
process.env.DATA_DIRECTORY = directory
process.env.CLIENT_URL = origin
delete process.env.MONGODB_URI
const { initializeStorage } = await import('../backend/dist/lib/store.js')
const { createAdmin } = await import('../backend/dist/lib/auth.js')
const { createApp } = await import('../backend/dist/app.js')
await initializeStorage()
const password = randomBytes(24).toString('base64url')
await createAdmin('browser-check@example.com', password)
console.log('Starting isolated browser check')
const server = createApp().listen(0, '127.0.0.1')
await new Promise(resolve => { if (server.listening) resolve(); else server.once('listening', resolve) })
const backendPort = server.address().port
const require = createRequire(new URL('../frontend/package.json', import.meta.url))
const vite = spawn(process.execPath, [path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js'), '--host', '127.0.0.1', '--port', String(frontendPort)], { cwd: path.join(root, 'frontend'), windowsHide: true, stdio: 'ignore', env: { ...process.env, ARC_API_TARGET: `http://127.0.0.1:${backendPort}`, VITE_API_URL: '/api' } })
let browser, socket
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
async function until(fn, description, milliseconds = 30000) {
  const end = Date.now() + milliseconds
  while (Date.now() < end) { try { const result = await fn(); if (result) return result } catch { /* Wait for page readiness. */ } await delay(150) }
  throw new Error(`Timed out: ${description}`)
}
const pending = new Map(), exceptions = []
let sequence = 0
function cdp(method, params = {}) {
  const id = ++sequence
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 30000)
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}
const click = expression => evaluate(`(${expression}).click()`)
const button = text => `Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(text)})`
async function field(label, value) {
  const expression = `Array.from(document.querySelectorAll('.a-content-form label')).find(l => l.firstChild.textContent.trim() === ${JSON.stringify(label)}).querySelector('input,textarea,select')`
  await evaluate(`(() => {const el = ${expression}; const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', {bubbles:true})); })()`)
}
async function navigate(route) {
  const navigation = await cdp('Page.navigate', { url: `${origin}${route}` })
  if (navigation.errorText) throw new Error(`Navigation failed: ${navigation.errorText}`)
  await until(() => evaluate(`location.pathname === ${JSON.stringify(route)} && Boolean(document.querySelector('main')) && Boolean(document.querySelector('h1'))`), route)
}
async function screenshot(name, selector) {
  await evaluate('document.fonts.ready')
  const clip = selector ? await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1} })()`) : undefined
  const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, ...(clip ? {clip} : {}) })
  await writeFile(path.join(output, name), Buffer.from(data, 'base64'))
}
try {
  await until(async () => (await fetch(origin, {signal: AbortSignal.timeout(2000)})).ok, 'Vite')
  let executable = process.env.ARC_BROWSER_EXECUTABLE
  if (!executable) {
    const cache = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright')
    const version = (await readdir(cache)).filter(name => /^chromium-\d+$/.test(name)).sort().at(-1)
    if (!version) throw new Error('Set ARC_BROWSER_EXECUTABLE to a local Chromium executable.')
    executable = path.join(cache, version, 'chrome-win64/chrome.exe')
  }
  const browserLog = openSync(path.join(output, 'browser-stderr.log'), 'w')
  browser = spawn(executable, ['--headless=new', '--no-sandbox', '--no-proxy-server', '--disable-features=NetworkServiceSandbox', '--disable-gpu', `--remote-debugging-port=${browserPort}`, `--user-data-dir=${path.join(directory, 'browser')}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', browserLog] })
  closeSync(browserLog)
  browser.on('error', () => {})
  const target = await until(async () => (await (await fetch(`http://127.0.0.1:${browserPort}/json/list`, {signal: AbortSignal.timeout(2000)})).json()).find(item => item.type === 'page'), 'Chromium')
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text)
    const task = pending.get(message.id)
    if (task) { clearTimeout(task.timer); pending.delete(message.id); message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result) }
  })
  socket.addEventListener('close', () => { for (const task of pending.values()) { clearTimeout(task.timer); task.reject(new Error('Browser connection closed')) } pending.clear() })
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable')
  await cdp('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] })
  if (process.argv.includes('--layout-only')) {
    for (const width of [320, 390, 639]) {
      await cdp('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true })
      await navigate('/')
      await evaluate('document.querySelector("#sight-for-kids").scrollIntoView({block:"center",behavior:"instant"})')
      await until(() => evaluate('document.querySelector(".sight-feature-background").complete && document.querySelector(".sight-feature-background").naturalWidth > 0'), 'kids background')
      const layout = await evaluate('(() => { const bounds = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom} }; return { section:bounds(".sight-feature"), image:bounds(".sight-feature-background"), copy:bounds(".sight-feature-copy"), overflow:document.documentElement.scrollWidth > innerWidth } })()')
      assert.equal(layout.overflow, false)
      assert.equal(Math.round(layout.image.height), Math.round(layout.section.height))
      assert(layout.copy.width < layout.section.width * .65)
      console.log(`Mobile kids layout ${width}px passed`)
      await screenshot(`kids-mobile-${width}.png`, '.sight-feature')
      await evaluate('document.querySelector("#site-footer").scrollIntoView({block:"start",behavior:"instant"})')
      console.log('Footer layout', width, await evaluate('({headings:Array.from(document.querySelectorAll("#site-footer section > button")).map(el => getComputedStyle(el).color), socialIcons:document.querySelectorAll("#site-footer a[title]").length, overflow:document.documentElement.scrollWidth > innerWidth})'))
      await screenshot(`footer-mobile-${width}.png`, '#site-footer > .container-shell')
    }
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
    await navigate('/about')
    assert.equal(await evaluate('getComputedStyle(document.querySelector("main .text-justify")).textAlign'), 'justify')
    await screenshot('about-desktop.png')
    console.log('About alignment and mobile feature checks passed.')
  } else {
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  for (const route of ['/', '/about', '/team', '/programs', '/gallery', '/academy', '/research', '/donate', '/news', '/join', '/contact']) {
    console.log(`Checking ${route}`)
    await navigate(route)
    await until(() => evaluate('document.images.length === 0 || Array.from(document.images).filter(i => i.loading !== "lazy").every(i => i.complete)'), `${route} images`)
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, `Desktop overflow: ${route}`)
    assert.equal(await evaluate('Boolean(document.querySelector("h1"))'), true, `Missing heading: ${route}`)
    if (['/about', '/programs', '/donate'].includes(route)) await screenshot(`${route.slice(1)}-desktop.png`)
  }
  await navigate('/gallery')
  await click('document.querySelector(".photo-grid button")')
  assert.equal(await evaluate('Boolean(document.querySelector("dialog[open]"))'), true)
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' })
  assert.equal(await evaluate('document.querySelector("dialog p").textContent'), '2 / 18')
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' })
  await navigate('/admin/news')
  console.log('Checking admin sign-in and article editing')
  await until(() => evaluate('Boolean(document.querySelector("input[name=email]"))'), 'login form')
  await evaluate(`(() => {const inputs = document.querySelectorAll('.a-access-form input'); inputs[0].value = 'browser-check@example.com'; inputs[1].value = ${JSON.stringify(password)}; document.querySelector('.a-access-form').requestSubmit()})()`)
  await until(() => evaluate('Boolean(document.querySelector(".a-content-manager"))'), 'content manager')
  await click(button('Write a story'))
  await field('Headline', 'Clearer vision, together: a community story')
  await field('Short summary', 'A story about the people bringing eye care closer to home.')
  await field('Paragraph text', 'Our volunteers came together to support eye health in the community. Every screening starts a conversation and opens a path to care.')
  await field('Image description', 'Arc Optical Club community volunteers')
  const doc = await cdp('DOM.getDocument')
  const fileInput = await cdp('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '.a-content-form input[type=file]' })
  await cdp('DOM.setFileInputFiles', { nodeId: fileInput.nodeId, files: [path.join(root, 'frontend/public/images/arc-team-hero.jpg')] })
  await until(() => evaluate('document.querySelector(".a-content-form .a-image-preview")?.getAttribute("src")?.includes("/content/images/") && !document.querySelector(".a-content-form fieldset").disabled'), 'cover upload')
  await click(button('Add photo'))
  const imageFields = 'Array.from(document.querySelectorAll(".a-story-blocks .a-image-field input"))'
  await evaluate(`(() => {const inputs = ${imageFields}; for (const [el, value] of [[inputs[0], '/images/arc-screening-session.jpg'], [inputs[2], 'Community eye screening']]) {Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el,value); el.dispatchEvent(new Event('input',{bubbles:true}))}})()`)
  await click(button('Preview article'))
  assert.equal(await evaluate('Boolean(document.querySelector(".a-article-preview .news-article"))'), true)
  await click(button('Continue editing'))
  await click(button('Save draft'))
  await until(() => evaluate('document.querySelector(".a-feature-success")?.textContent.includes("Draft saved")'), 'draft saved')
  assert.equal((await (await fetch(`http://127.0.0.1:${backendPort}/api/content/news`)).json()).data.length, 0)
  await click(button('Edit')); await field('Visibility', 'published'); await click(button('Save & publish'))
  await until(() => evaluate('document.querySelector(".a-feature-success")?.textContent.includes("published")'), 'published')
  const story = (await (await fetch(`http://127.0.0.1:${backendPort}/api/content/news`)).json()).data[0]
  await navigate(`/news/${story.id}`)
  await until(() => evaluate('Boolean(document.querySelector(".news-article"))'), 'published article')
  await until(() => evaluate('Array.from(document.querySelectorAll(".news-article img")).every(i => i.complete && i.naturalWidth > 0)'), 'article photos')
  await screenshot('news-desktop.png')
  await navigate('/admin/programs')
  console.log('Checking program editing')
  await until(() => evaluate('Boolean(document.querySelector(".a-content-records article"))'), 'programs loaded')
  await click(button('Edit')); await field('Program title', 'Sight For Kids — updated'); await click(button('Save program'))
  await until(() => evaluate('Boolean(document.querySelector(".a-feature-success"))'), 'program saved')
  await navigate('/programs'); await until(() => evaluate('document.body.textContent.includes("Sight For Kids — updated")'), 'public program edit')
  await navigate('/'); await until(() => evaluate('document.querySelector("#our-programs")?.textContent.includes("Sight For Kids — updated")'), 'homepage program edit')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  for (const route of ['/gallery', '/academy', '/research', '/donate', '/programs', '/news', `/news/${story.id}`, '/admin/news']) {
    await navigate(route)
    if (route.includes(story.id)) await until(() => evaluate('Boolean(document.querySelector(".news-article"))'), 'mobile article')
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, `Mobile overflow: ${route}`)
    if (route.includes(story.id)) await screenshot('news-mobile.png')
  }
  assert.deepEqual(exceptions, [], 'Browser runtime errors')
  console.log('Browser checks passed: public routes, desktop/mobile overflow, gallery keyboard controls, image upload, article preview, draft/publish and program edits on both public pages.')
  console.log('Screenshots: .qa/news-desktop.png, .qa/news-mobile.png')
  }
} catch (error) {
  if (socket?.readyState === WebSocket.OPEN) {
    console.error('Browser diagnostics:', await evaluate('({url:location.href, state:document.readyState, title:document.title, body:document.body.innerText.slice(0,500)})').catch(() => null), exceptions)
    await screenshot('browser-failure.png').catch(() => {})
  }
  throw error
} finally {
  if (socket?.readyState === WebSocket.OPEN) { try { await cdp('Browser.close') } catch { /* Browser may already be closed. */ } socket.close() }
  if (browser && !browser.killed) browser.kill()
  vite.kill()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
  assert(path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(directory).startsWith('arc-content-browser-'))
  await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {})
}
