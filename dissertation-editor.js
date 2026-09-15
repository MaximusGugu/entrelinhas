(function () {
  const PAGE_HEIGHT = 1123;
  const CONTENT_HEIGHT = 820;
  const CONTENT_WIDTH = 642;
  const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'UL', 'OL', 'TABLE']);
  const INLINE_WRAP = new Set(['SPAN', 'A', 'B', 'STRONG', 'I', 'EM', 'U', 'SMALL', 'BR']);

  const escapeHtml = value => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const state = {
    container: null,
    html: '<p><br></p>',
    references: [],
    fontSize: '12',
    onChange: null,
    onSelectionChange: null,
    changeTimer: null,
    renderTimer: null,
    bookmark: null,
    measuring: null
  };

  function cleanHtml(html = '') {
    const root = document.createElement('div');
    root.innerHTML = html || '<p><br></p>';
    root.querySelectorAll('[data-page-spacer], .editor-page-spacer, .page-break-guide, .doc-references, .doc-auto-reference, [data-generated-reference]').forEach(node => node.remove());
    return root.innerHTML.trim() || '<p><br></p>';
  }

  function hasBlockChild(node) {
    return [...node.children || []].some(child => BLOCK_TAGS.has(child.tagName));
  }

  function pushNodeAsBlock(blocks, node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) blocks.push({ html: `<p>${escapeHtml(text)}</p>`, kind: 'text' });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches('[data-page-spacer], .editor-page-spacer, .page-break-guide, .doc-references, .doc-auto-reference, [data-generated-reference]')) return;
    if (INLINE_WRAP.has(node.tagName)) {
      blocks.push({ html: `<p>${node.outerHTML}</p>`, kind: 'text' });
      return;
    }
    if (hasBlockChild(node)) {
      [...node.childNodes].forEach(child => pushNodeAsBlock(blocks, child));
      return;
    }
    const kind = node.tagName === 'UL' || node.tagName === 'OL' ? 'list'
      : node.tagName === 'TABLE' ? 'table'
        : node.tagName === 'BLOCKQUOTE' ? 'quote'
          : 'text';
    blocks.push({ html: node.outerHTML, kind });
  }

  function htmlToBlocks(html) {
    const root = document.createElement('div');
    root.innerHTML = cleanHtml(html);
    const blocks = [];
    [...root.childNodes].forEach(node => pushNodeAsBlock(blocks, node));
    return blocks.length ? blocks : [{ html: '<p><br></p>', kind: 'text' }];
  }

  function referenceBlocks(references = []) {
    if (!references.length) return [];
    return [
      { html: '<h1 class="doc-reference-title">Referências bibliográficas</h1>', kind: 'reference', generated: true },
      ...references.map(reference => ({
        html: `<p class="doc-reference-item">${escapeHtml(reference)}</p>`,
        kind: 'reference',
        generated: true
      }))
    ];
  }

  function ensureMeasurer(fontSize = state.fontSize) {
    if (!state.measuring) {
      state.measuring = document.createElement('div');
      state.measuring.className = 'doc-measure-sandbox';
      document.body.append(state.measuring);
    }
    state.measuring.style.setProperty('--doc-font-size', `${fontSize}pt`);
    return state.measuring;
  }

  function measureHtml(html, fontSize = state.fontSize) {
    const box = ensureMeasurer(fontSize);
    box.innerHTML = html || '<p><br></p>';
    const height = Math.ceil(box.scrollHeight || box.getBoundingClientRect().height || 0);
    box.innerHTML = '';
    return Math.max(1, height);
  }

  function textBlockTag(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const first = temp.firstElementChild;
    if (!first) return 'p';
    return ['P', 'DIV', 'H1', 'H2', 'H3', 'H4'].includes(first.tagName) ? first.tagName.toLowerCase() : 'p';
  }

  function textFromHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return (temp.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function splitTextBlock(block, available, fontSize) {
    const text = textFromHtml(block.html);
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return null;
    const tag = textBlockTag(block.html);
    let low = 1;
    let high = words.length;
    let fit = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const html = `<${tag}>${escapeHtml(words.slice(0, mid).join(' '))}</${tag}>`;
      if (measureHtml(html, fontSize) <= available) {
        fit = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    if (!fit) return null;
    return {
      current: { html: `<${tag}>${escapeHtml(words.slice(0, fit).join(' '))}</${tag}>`, kind: block.kind },
      rest: fit < words.length ? { html: `<${tag}>${escapeHtml(words.slice(fit).join(' '))}</${tag}>`, kind: block.kind } : null
    };
  }

  function splitListBlock(block) {
    const temp = document.createElement('div');
    temp.innerHTML = block.html;
    const list = temp.firstElementChild;
    if (!list || !['UL', 'OL'].includes(list.tagName)) return [block];
    const tag = list.tagName.toLowerCase();
    return [...list.children].map(item => ({ html: `<${tag}>${item.outerHTML}</${tag}>`, kind: 'list' }));
  }

  function addBlockToPages(pages, block, fontSize) {
    let current = pages[pages.length - 1];
    let used = current.used;
    const height = measureHtml(block.html, fontSize);
    if (used && used + height > CONTENT_HEIGHT) {
      if (block.kind === 'list') {
        splitListBlock(block).forEach(item => addBlockToPages(pages, item, fontSize));
        return;
      }
      if (block.kind === 'text') {
        const split = splitTextBlock(block, CONTENT_HEIGHT - used, fontSize);
        if (split?.current) {
          current.blocks.push(split.current);
          current.used += measureHtml(split.current.html, fontSize);
          if (split.rest) {
            pages.push({ blocks: [], used: 0 });
            addBlockToPages(pages, split.rest, fontSize);
          }
          return;
        }
      }
      pages.push({ blocks: [], used: 0 });
      current = pages[pages.length - 1];
      used = 0;
    }
    if (!used && height > CONTENT_HEIGHT && block.kind === 'text') {
      const split = splitTextBlock(block, CONTENT_HEIGHT, fontSize);
      if (split?.current) {
        current.blocks.push(split.current);
        current.used += measureHtml(split.current.html, fontSize);
        if (split.rest) {
          pages.push({ blocks: [], used: 0 });
          addBlockToPages(pages, split.rest, fontSize);
        }
        return;
      }
    }
    current.blocks.push({ ...block, overflow: height > CONTENT_HEIGHT });
    current.used += height;
  }

  function paginate(html, references, fontSize) {
    const pages = [{ blocks: [], used: 0 }];
    [...htmlToBlocks(html), ...referenceBlocks(references)].forEach(block => addBlockToPages(pages, block, fontSize));
    return pages.filter((page, index) => page.blocks.length || index === 0);
  }

  function pageHtml(page, index, fontSize) {
    const body = page.blocks.filter(block => !block.generated).map(block => block.html).join('') || '<p><br></p>';
    const generated = page.blocks.filter(block => block.generated).map(block => block.html).join('');
    return `<article class="doc-page word-page dissertation-page" data-page-number="${index + 1}" style="--doc-font-size:${escapeHtml(fontSize)}pt">
      <div class="doc-page-body" contenteditable="true" spellcheck="true" data-page-body="${index}">${body}</div>
      ${generated ? `<section class="doc-references doc-auto-reference" contenteditable="false" data-generated-reference>${generated}</section>` : ''}
    </article>`;
  }

  function render(options = {}) {
    state.container = options.container || state.container;
    state.html = cleanHtml(options.html ?? state.html);
    state.references = options.references || [];
    state.fontSize = String(options.fontSize || state.fontSize || '12');
    state.onChange = options.onChange || state.onChange;
    state.onSelectionChange = options.onSelectionChange || state.onSelectionChange;
    if (!state.container) return;
    const pages = paginate(state.html, state.references, state.fontSize);
    state.container.innerHTML = pages.map((page, index) => pageHtml(page, index, state.fontSize)).join('');
    updateHeadingClasses(state.container);
    attachPageListeners();
    restoreSelection();
  }

  function attachPageListeners() {
    state.container.querySelectorAll('[data-page-body]').forEach(body => {
      body.addEventListener('input', scheduleCommit);
      body.addEventListener('focus', storeSelection);
      body.addEventListener('paste', handlePaste);
      body.addEventListener('pointerdown', storeSelection);
      body.addEventListener('keyup', storeSelection);
      body.addEventListener('mouseup', storeSelection);
    });
  }

  function cleanBodyClone(body) {
    const clone = body.cloneNode(true);
    clone.querySelectorAll('[data-generated-reference], .doc-auto-reference, [data-page-spacer], .editor-page-spacer, .page-break-guide').forEach(node => node.remove());
    return clone.innerHTML.trim();
  }

  function getHtmlFromDom() {
    if (!state.container) return cleanHtml(state.html);
    const html = [...state.container.querySelectorAll('[data-page-body]')]
      .map(cleanBodyClone)
      .filter(Boolean)
      .join('');
    return cleanHtml(html || '<p><br></p>');
  }

  function scheduleCommit() {
    storeSelection();
    clearTimeout(state.changeTimer);
    state.changeTimer = setTimeout(() => commit({ rerender: false }), 250);
  }

  function commit({ rerender = false } = {}) {
    state.html = getHtmlFromDom();
    if (typeof state.onChange === 'function') state.onChange(state.html);
    if (rerender) render();
    return state.html;
  }

  function handlePaste(event) {
    const text = event.clipboardData?.getData('text/plain');
    if (!text) return;
    event.preventDefault();
    insertHtmlAtSelection(textToHtml(text), { rerender: true });
  }

  function textToHtml(text = '') {
    return String(text).replace(/\r/g, '').split(/\n{2,}/)
      .map(chunk => chunk.trim())
      .filter(Boolean)
      .map(chunk => `<p>${escapeHtml(chunk).replace(/\n/g, '<br>')}</p>`)
      .join('') || '<p><br></p>';
  }

  function textOffsetForRange(range) {
    const bodies = [...state.container.querySelectorAll('[data-page-body]')];
    let offset = 0;
    for (const body of bodies) {
      if (body.contains(range.startContainer)) {
        const pre = range.cloneRange();
        pre.selectNodeContents(body);
        pre.setEnd(range.startContainer, range.startOffset);
        return offset + pre.toString().length;
      }
      offset += body.textContent.length;
    }
    return offset;
  }

  function storeSelection() {
    if (!state.container) return;
    const selection = window.getSelection?.();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const body = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer.closest?.('[data-page-body]')
      : range.startContainer.parentElement?.closest?.('[data-page-body]');
    if (!body || !state.container.contains(body)) return;
    state.bookmark = textOffsetForRange(range);
    if (typeof state.onSelectionChange === 'function') state.onSelectionChange(state.bookmark);
  }

  function insertTextInHtmlAtOffset(html, text, offset) {
    const root = document.createElement('div');
    root.innerHTML = cleanHtml(html);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let remaining = Math.max(0, Number(offset) || 0);
    let node = walker.nextNode();
    let last = null;
    while (node) {
      last = node;
      if (remaining <= node.textContent.length) {
        const range = document.createRange();
        range.setStart(node, remaining);
        range.collapse(true);
        range.insertNode(document.createTextNode(text));
        return cleanHtml(root.innerHTML);
      }
      remaining -= node.textContent.length;
      node = walker.nextNode();
    }
    if (last) {
      last.textContent += text;
    } else {
      root.insertAdjacentHTML('beforeend', `<p>${escapeHtml(text)}</p>`);
    }
    return cleanHtml(root.innerHTML);
  }

  function findTextPosition(offset) {
    const walker = document.createTreeWalker(state.container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement?.closest('[data-page-body]') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    let remaining = Math.max(0, Number(offset) || 0);
    let node = walker.nextNode();
    let last = null;
    while (node) {
      last = node;
      if (remaining <= node.textContent.length) return { node, offset: remaining };
      remaining -= node.textContent.length;
      node = walker.nextNode();
    }
    return last ? { node: last, offset: last.textContent.length } : null;
  }

  function restoreSelection(offset = state.bookmark) {
    if (offset == null || !state.container) return;
    const position = findTextPosition(offset);
    if (!position) return;
    const range = document.createRange();
    range.setStart(position.node, position.offset);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function insertHtmlAtSelection(html, { rerender = true } = {}) {
    const activeBody = document.activeElement?.closest?.('[data-page-body]') || state.container?.querySelector('[data-page-body]');
    if (activeBody) activeBody.focus();
    if (state.bookmark == null) {
      state.bookmark = [...state.container.querySelectorAll('[data-page-body]')]
        .reduce((total, body) => total + body.textContent.length, 0);
    }
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    const insertedText = (() => {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      return temp.textContent.length;
    })();
    if (state.bookmark != null) state.bookmark += insertedText;
    return commit({ rerender });
  }

  function insertTextAtBookmark(text) {
    const current = commit({ rerender: false });
    const offset = state.bookmark ?? [...state.container.querySelectorAll('[data-page-body]')]
      .reduce((total, body) => total + body.textContent.length, 0);
    state.html = insertTextInHtmlAtOffset(current, String(text || ''), offset);
    state.bookmark = offset + String(text || '').length;
    if (typeof state.onChange === 'function') state.onChange(state.html);
    render();
    return state.html;
  }

  function execCommand(command) {
    const activeBody = document.activeElement?.closest?.('[data-page-body]') || state.container?.querySelector('[data-page-body]');
    if (activeBody) activeBody.focus();
    document.execCommand(command, false, null);
    return commit({ rerender: true });
  }

  function updateHeadingClasses(root) {
    root.querySelectorAll('.dynamic-heading').forEach(node => node.classList.remove('dynamic-heading', 'level-1', 'level-2', 'level-3'));
    root.querySelectorAll('[data-page-body] p, [data-page-body] div, [data-page-body] h1, [data-page-body] h2, [data-page-body] h3, [data-page-body] h4, [data-page-body] li').forEach(node => {
      if ([...node.children].some(child => BLOCK_TAGS.has(child.tagName))) return;
      const match = (node.textContent || '').trim().match(/^(\d+(?:\.\d+)*)\s+.+/);
      if (!match) return;
      node.classList.add('dynamic-heading', `level-${Math.min(match[1].split('.').length, 3)}`);
    });
  }

  function extractHeadings(html = state.html) {
    const root = document.createElement('div');
    root.innerHTML = cleanHtml(html);
    const headings = [];
    root.querySelectorAll('p, div, h1, h2, h3, h4, li').forEach((node, index) => {
      if ([...node.children].some(child => BLOCK_TAGS.has(child.tagName))) return;
      const text = (node.textContent || '').trim();
      const match = text.match(/^(\d+(?:\.\d+)*)\s+(.+)/);
      if (!match) return;
      headings.push({ id: `heading-${index}`, number: match[1], title: match[2], level: Math.min(match[1].split('.').length, 3) });
    });
    return headings;
  }

  function setFontSize(fontSize) {
    state.fontSize = String(fontSize || '12');
    render();
  }

  window.DissertationEditor = {
    cleanHtml,
    render,
    commit,
    storeSelection,
    insertTextAtBookmark,
    insertHtmlAtSelection,
    execCommand,
    extractHeadings,
    setFontSize,
    textToHtml,
    getHtml: () => cleanHtml(state.html)
  };
})();
