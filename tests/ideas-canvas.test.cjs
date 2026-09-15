const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

async function visibleConnectionPoint(page) {
  return page.locator('.idea-connection-hit').first().evaluate(path => {
    const nodeRects = [...document.querySelectorAll('.idea-node')].map(node => node.getBoundingClientRect());
    const matrix = path.getScreenCTM();
    const length = path.getTotalLength();
    for (let offset = 16; offset < length - 16; offset += 8) {
      const point = path.getPointAtLength(offset);
      const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix);
      const covered = nodeRects.some(rect => screenPoint.x >= rect.left && screenPoint.x <= rect.right && screenPoint.y >= rect.top && screenPoint.y <= rect.bottom);
      if (!covered) return { x: screenPoint.x, y: screenPoint.y };
    }
    const fallback = new DOMPoint(...Object.values(path.getPointAtLength(length / 2))).matrixTransform(matrix);
    return { x: fallback.x, y: fallback.y };
  });
}

test('Ideas canvas creates, edits, moves, resizes, connects and restores elements', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.setContent('<style>:root{--bg:#f3f5f3;--surface:#fff;--surface-2:#edf0ed;--text:#172019;--muted:#667069;--accent:#2e604a;--accent-2:#dcebe3;--line:#d8ddd9;--shadow:0 8px 30px #0002}body{margin:0}#ideaBoard{width:100vw;height:100vh}</style><div id="ideaBoard"></div>');
    await page.addStyleTag({ path: path.join(root, 'ideas-canvas.css') });
    await page.addScriptTag({ path: path.join(root, 'ideas-canvas.js') });
    await page.evaluate(() => {
      window.ideaElements = [];
      window.ideaConnections = [];
      IdeasCanvas.render({ container: document.querySelector('#ideaBoard'), elements: ideaElements, connections: ideaConnections, onChange: () => { window.saved = JSON.stringify({ ideaElements, ideaConnections }); } });
    });

    await page.locator('[data-tool="text"]').click();
    await page.locator('[data-add-text="title"]').click();
    await page.locator('.idea-node-content').fill('Problema de pesquisa');
    assert.equal(await page.locator('.idea-node-text.is-title').count(), 1);
    assert.equal(await page.locator('.idea-node-text').evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(0, 0, 0, 0)');
    await page.locator('[data-text-align="center"]').click();
    assert.equal(await page.locator('.idea-node-text .idea-node-content').evaluate(element => getComputedStyle(element).textAlign), 'center');
    assert.equal(await page.evaluate(() => ideaElements[0].textAlign), 'center');
    await page.locator('.idea-node-text .idea-node-content').focus();
    await page.locator('[data-tool="postit"]').focus();
    await page.waitForTimeout(50);
    assert.equal(await page.locator('.idea-text-controls').count(), 0);

    await page.locator('[data-tool="postit"]').click();
    await page.locator('[data-add-postit]').first().click();
    await page.locator('.idea-node-postit .idea-node-content').fill('Hipótese central');
    assert.equal(await page.locator('.idea-node').count(), 2);

    const postitHandle = page.locator('.idea-node-postit .handle-right');
    await page.mouse.move(5, 5);
    assert.equal(await postitHandle.evaluate(handle => getComputedStyle(handle, '::after').opacity), '0');
    await page.locator('.idea-node-postit').hover();
    await page.waitForTimeout(150);
    assert.notEqual(await postitHandle.evaluate(handle => getComputedStyle(handle, '::after').opacity), '0');
    await postitHandle.hover();
    await page.waitForTimeout(150);
    assert.notEqual(await postitHandle.evaluate(handle => getComputedStyle(handle, '::after').opacity), '0');

    const titleNode = page.locator('.idea-node-text');
    const startBox = await titleNode.boundingBox();
    const drag = await titleNode.locator('.idea-node-content').boundingBox();
    await page.mouse.move(drag.x + drag.width / 2, drag.y + drag.height / 2);
    await page.mouse.down();
    await page.mouse.move(drag.x + drag.width / 2 + 180, drag.y + drag.height / 2 - 100);
    await page.mouse.up();
    const movedBox = await titleNode.boundingBox();
    assert(movedBox.x > startBox.x + 100);
    assert.equal(await titleNode.locator('.idea-node-content').getAttribute('contenteditable'), 'false');

    const movedContent = await titleNode.locator('.idea-node-content').boundingBox();
    await page.mouse.click(movedContent.x + movedContent.width / 2, movedContent.y + movedContent.height / 2);
    await page.waitForTimeout(50);
    assert.equal(await titleNode.locator('.idea-node-content').getAttribute('contenteditable'), 'true');
    assert.equal(await titleNode.locator('.idea-node-content').evaluate(element => document.activeElement === element), true);

    const postit = page.locator('.idea-node-postit');
    const beforeResize = await postit.boundingBox();
    const resize = await postit.locator('.idea-resize-handle').boundingBox();
    await page.mouse.move(resize.x + 5, resize.y + 5);
    await page.mouse.down();
    await page.mouse.move(resize.x + 85, resize.y + 65);
    await page.mouse.up();
    const afterResize = await postit.boundingBox();
    assert(afterResize.width > beforeResize.width + 50);
    assert(afterResize.height > beforeResize.height + 35);

    const source = await titleNode.locator('.handle-right').boundingBox();
    const target = await postit.locator('.handle-left').boundingBox();
    const sourceCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
    const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    const titleBounds = await titleNode.boundingBox();
    assert(sourceCenter.x >= titleBounds.x + titleBounds.width);

    await page.mouse.move(sourceCenter.x, sourceCenter.y);
    await page.mouse.down();
    await page.mouse.move(sourceCenter.x + 85, sourceCenter.y + 65);
    assert.equal(await page.locator('[data-connection-preview]').evaluate(path => path.hasAttribute('hidden')), false);
    const previewVisualState = await page.locator('[data-connection-preview]').evaluate(path => {
      const style = getComputedStyle(path);
      const box = path.getBoundingClientRect();
      return { d: path.getAttribute('d'), display: style.display, stroke: style.stroke, strokeWidth: style.strokeWidth, opacity: style.opacity, width: box.width, height: box.height };
    });
    assert(await page.locator('[data-connection-preview]').isVisible(), JSON.stringify(previewVisualState));
    assert.notEqual(await page.locator('[data-connection-preview]').evaluate(path => getComputedStyle(path).strokeDasharray), 'none');
    const previewPath = await page.locator('[data-connection-preview]').getAttribute('d');
    await page.mouse.move(sourceCenter.x + 140, sourceCenter.y + 105);
    assert.notEqual(await page.locator('[data-connection-preview]').getAttribute('d'), previewPath);
    await page.mouse.up();
    assert.equal(await page.locator('[data-connection-preview]').getAttribute('d'), null);

    await page.mouse.move(sourceCenter.x, sourceCenter.y);
    await page.mouse.down();
    await page.mouse.move(targetCenter.x, targetCenter.y, { steps: 5 });
    await page.mouse.up();
    assert.equal(await page.evaluate(() => ideaConnections.length), 1);
    assert.equal(await page.locator('.idea-connection-line').count(), 1);

    const connectionHoverPoint = await visibleConnectionPoint(page);
    await page.mouse.move(connectionHoverPoint.x, connectionHoverPoint.y);
    await page.waitForTimeout(150);
    const addConnectionLabel = page.locator('[data-add-connection-label]');
    assert.notEqual(await addConnectionLabel.evaluate(button => getComputedStyle(button).opacity), '0');
    await addConnectionLabel.click();
    const connectionLabelEditor = page.locator('.idea-connection-label-editor');
    await connectionLabelEditor.fill('Relação conceitual');
    await page.locator('[data-tool="text"]').focus();
    await page.waitForTimeout(50);
    assert.equal(await page.evaluate(() => ideaConnections[0].label), 'Relação conceitual');
    assert.notEqual(await connectionLabelEditor.evaluate(editor => getComputedStyle(editor).backgroundColor), 'rgba(0, 0, 0, 0)');

    let connectionClickPoint = await visibleConnectionPoint(page);
    await page.mouse.click(connectionClickPoint.x, connectionClickPoint.y);
    assert.equal(await page.locator('.idea-connection.is-selected').count(), 1);
    await page.keyboard.press('Delete');
    assert.equal(await page.evaluate(() => ideaConnections.length), 0);

    await page.mouse.move(sourceCenter.x, sourceCenter.y);
    await page.mouse.down();
    await page.mouse.move(targetCenter.x, targetCenter.y, { steps: 5 });
    await page.mouse.up();
    connectionClickPoint = await visibleConnectionPoint(page);
    await page.mouse.click(connectionClickPoint.x, connectionClickPoint.y);
    await page.keyboard.press('Backspace');
    assert.equal(await page.evaluate(() => ideaConnections.length), 0);

    const countBeforeCancel = await page.evaluate(() => ideaConnections.length);
    const cancelSource = await postit.locator('.handle-bottom').boundingBox();
    await page.mouse.move(cancelSource.x + cancelSource.width / 2, cancelSource.y + cancelSource.height / 2);
    await page.mouse.down();
    await page.mouse.move(40, 40);
    await page.mouse.up();
    assert.equal(await page.evaluate(() => ideaConnections.length), countBeforeCancel);

    const cameraBeforePan = await page.locator('.ideas-scene').evaluate(element => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return { x: matrix.e, y: matrix.f };
    });
    const toolbarBeforePan = await page.locator('.ideas-floating-toolbar').boundingBox();
    await page.mouse.move(55, 55);
    await page.mouse.down();
    await page.mouse.move(145, 115, { steps: 4 });
    await page.mouse.up();
    const cameraAfterPan = await page.locator('.ideas-scene').evaluate(element => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return { x: matrix.e, y: matrix.f };
    });
    assert(cameraAfterPan.x > cameraBeforePan.x + 80);
    assert(cameraAfterPan.y > cameraBeforePan.y + 50);
    const toolbarAfterPan = await page.locator('.ideas-floating-toolbar').boundingBox();
    assert.equal(Math.round(toolbarAfterPan.x), Math.round(toolbarBeforePan.x));
    assert.equal(Math.round(toolbarAfterPan.y), Math.round(toolbarBeforePan.y));
    assert.equal(await page.locator('.ideas-canvas').evaluate(element => getComputedStyle(element).overflow), 'hidden');

    const nodeBeforeZoom = await titleNode.boundingBox();
    await page.locator('[data-zoom="in"]').click();
    assert.equal(await page.locator('[data-zoom-label]').innerText(), '110%');
    const nodeAfterZoom = await titleNode.boundingBox();
    assert(nodeAfterZoom.width > nodeBeforeZoom.width);
    assert.equal(await page.locator('.ideas-scene').evaluate(element => getComputedStyle(element).transform !== 'none'), true);

    await page.mouse.move(600, 350);
    await page.mouse.wheel(0, -120);
    assert.equal(await page.locator('[data-zoom-label]').innerText(), '120%');
    assert.equal(await page.evaluate(() => window.scrollY), 0);

    const zoomedSource = await titleNode.locator('.handle-right').boundingBox();
    const zoomedTarget = await postit.locator('.handle-left').boundingBox();
    await page.mouse.move(zoomedSource.x + zoomedSource.width / 2, zoomedSource.y + zoomedSource.height / 2);
    await page.mouse.down();
    await page.mouse.move(zoomedTarget.x + zoomedTarget.width / 2, zoomedTarget.y + zoomedTarget.height / 2, { steps: 6 });
    await page.mouse.up();
    assert.equal(await page.evaluate(() => ideaConnections.length), 1);

    const secondSource = await postit.locator('.handle-right').boundingBox();
    const secondTarget = await titleNode.locator('.handle-left').boundingBox();
    await page.mouse.move(secondSource.x + secondSource.width / 2, secondSource.y + secondSource.height / 2);
    await page.mouse.down();
    await page.mouse.move(secondTarget.x + secondTarget.width / 2 + 8, secondTarget.y + secondTarget.height / 2, { steps: 6 });
    await page.mouse.up();
    assert.equal(await page.evaluate(() => ideaConnections.length), 2);

    const bottomTarget = await postit.locator('.handle-bottom').boundingBox();
    await page.mouse.move(zoomedSource.x + zoomedSource.width / 2, zoomedSource.y + zoomedSource.height / 2);
    await page.mouse.down();
    await page.mouse.move(bottomTarget.x + bottomTarget.width / 2, bottomTarget.y + bottomTarget.height / 2, { steps: 6 });
    await page.mouse.up();
    assert.equal(await page.evaluate(() => ideaConnections.length), 3);
    const bottomArrowDirection = await page.locator('.idea-connection-line').last().evaluate(path => {
      const length = path.getTotalLength();
      const beforeEnd = path.getPointAtLength(length - 1);
      const end = path.getPointAtLength(length);
      return { beforeY: beforeEnd.y, endY: end.y };
    });
    assert(bottomArrowDirection.endY < bottomArrowDirection.beforeY);

    await page.evaluate(() => IdeasCanvas.render({ container: document.querySelector('#ideaBoard'), elements: ideaElements, connections: ideaConnections, onChange: () => {} }));
    await page.waitForTimeout(50);
    assert.equal(await page.locator('.idea-node').count(), 2);
    assert((await page.locator('.idea-node').allInnerTexts()).join(' ').includes('Problema de pesquisa'));
    const centeredBounds = await page.locator('.idea-node').evaluateAll(nodes => {
      const rects = nodes.map(node => node.getBoundingClientRect());
      return { left: Math.min(...rects.map(rect => rect.left)), right: Math.max(...rects.map(rect => rect.right)), top: Math.min(...rects.map(rect => rect.top)), bottom: Math.max(...rects.map(rect => rect.bottom)) };
    });
    assert(Math.abs((centeredBounds.left + centeredBounds.right) / 2 - 600) < 3);
    assert(Math.abs((centeredBounds.top + centeredBounds.bottom) / 2 - 425) < 3);
    assert.equal(errors.length, 0, errors.join('\n'));
  } finally {
    await browser.close();
  }
});

test('Ideas module fills the app workspace without the former heading', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('https://www.gstatic.com/firebasejs/**', route => route.fulfill({ body: '' }));
    await page.route('**/firebase-config.js', route => route.fulfill({ contentType: 'application/javascript', body: `window.FirebaseBackend={auth:{currentUser:null,onAuthStateChanged(callback){setTimeout(()=>callback({uid:'ideas-test',email:'test@local'}),0)}},loadState:async()=>null,saveState:async()=>{},logout:async()=>{}};` }));
    await page.goto('http://127.0.0.1:8000/#ideias', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#ideiasPage:not(.hidden) .ideas-canvas');
    assert.equal(await page.locator('#ideiasPage .page-heading').count(), 0);
    const canvas = await page.locator('.ideas-canvas').boundingBox();
    assert(canvas.width >= 1300);
    assert(canvas.height >= 650);
    const initialConnections = await page.locator('.idea-connection').count();
    const sourceHandle = await page.locator('.idea-node').first().locator('.handle-right').boundingBox();
    const targetHandle = await page.locator('.idea-node').nth(1).locator('.handle-left').boundingBox();
    await page.mouse.move(sourceHandle.x + sourceHandle.width / 2, sourceHandle.y + sourceHandle.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetHandle.x + targetHandle.width / 2, targetHandle.y + targetHandle.height / 2, { steps: 8 });
    await page.mouse.up();
    assert.equal(await page.locator('.idea-connection').count(), initialConnections + 1);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
