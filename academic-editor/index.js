import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontFamily, FontSize, Color } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import { citationExtension, bibliographyExtension, pastedCitationExtension, AcademicParagraph, pageGuideExtension } from './extensions.js';
import { collectCitations, formatCitation, sortReferences, escapeHtml } from './references.js';
import { cleanHtml, extractHeadings } from './content.js';
import { mountToolbar, updateToolbar } from './toolbar.js';
import { configureReferenceForm } from './reference-fields.js';

let editor, activeId, bookmark, config = {}, saveTimer, publishTimer, statsTimer, saveRevision = 0, nativeSelectAll = false;
let results = [], resultIndex = -1;
const context = { references: [], formatBibliography: reference => reference.titulo || '' };
const bySelector = selector => document.querySelector(selector);
const CONTENT_HEIGHT = 933.543;
const PAGE_HEIGHT = 1122.52;
const PAGE_GAP = 28;
const pageCount = () => {
  if (!editor || !editor.getText().trim()) return 1;
  const guides = editor.view.dom.querySelectorAll('.academic-page-guide').length;
  if (guides) return guides + 1;
  return Math.max(1, Math.ceil((editor.view.dom.scrollHeight || PAGE_HEIGHT) / CONTENT_HEIGHT));
};
function normalizeContent(content, html = '') {
  if (content?.type === 'doc') {
    const text = JSON.stringify(content).replace(/\s/g, '');
    if (!content.content?.length || !text.replace(/paragraph|doc|content/g, '').length) return { type: 'doc', content: [{ type: 'paragraph' }] };
    return content;
  }
  return cleanHtml(html);
}
function contentHasText(content, html = '') {
  if (content?.type === 'doc') {
    const hasText = node => Boolean(node?.text?.trim()) || (node?.content || []).some(hasText);
    return hasText(content);
  }
  const probe = document.createElement('div');
  probe.innerHTML = html || '';
  return Boolean(probe.textContent?.trim());
}

function snapshot() {
  return { content: editor.getJSON(), contentHtml: editor.getHTML(), citations: collectCitations(editor.state.doc) };
}
function status(label) { const el = bySelector('#academicSaveState'); if (el) el.textContent = label; }
function publish() { clearTimeout(publishTimer); publishTimer = null; if (editor) config.onChange?.(snapshot()); }
function changed() {
  clearTimeout(publishTimer);
  publishTimer = setTimeout(publish, 300);
  status('Alterações não salvas');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 750);
  clearTimeout(statsTimer);
  statsTimer = setTimeout(updateStats, 250);
}
async function save() {
  clearTimeout(saveTimer);
  saveTimer = null;
  publish();
  const revision = ++saveRevision;
  status('Salvando...');
  try {
    await config.onSave?.();
    if (revision === saveRevision) status('Salvo');
  } catch (error) {
    if (revision === saveRevision) status('Erro ao sincronizar; cópia local mantida');
    console.error('Salvamento do documento:', error);
  }
}
function updateStats() {
  if (!editor) return;
  const text = editor.getText({ blockSeparator: '\n' });
  const el = bySelector('#academicStats');
  const top = editor.view.dom.getBoundingClientRect().top;
  const cursor = editor.view.coordsAtPos(editor.state.selection.from).top;
  const current = Math.max(1, Math.min(pageCount(), Math.floor((cursor - top) / (PAGE_HEIGHT + PAGE_GAP)) + 1));
  if (el) el.textContent = `Página ${current} de ${pageCount()} | ${text.split(/\s+/).filter(Boolean).length.toLocaleString('pt-BR')} palavras | ${text.length.toLocaleString('pt-BR')} caracteres`;
  const outline = bySelector('#documentOutline');
  if (outline) {
    const entries = [];
    editor.state.doc.descendants((node, pos) => { if (node.type.name === 'heading') entries.push(`<button class="outline-link level-${node.attrs.level}" data-academic-heading="${pos}">${escapeHtml(node.textContent || 'Sem título')}</button>`); });
    outline.innerHTML = entries.join('');
    outline.onclick = event => { const button = event.target.closest('[data-academic-heading]'); if (button) editor.chain().focus().setTextSelection(Number(button.dataset.academicHeading) + 1).scrollIntoView().run(); };
  }
}
function storeSelection() {
  if (editor && !editor.state.selection.empty) bookmark = editor.state.selection.getBookmark();
  else if (editor?.isFocused) bookmark = editor.state.selection.getBookmark();
}
function restoreSelection() {
  if (!editor) return;
  if (bookmark) {
    try { editor.view.dispatch(editor.state.tr.setSelection(bookmark.resolve(editor.state.doc))); } catch { editor.commands.focus('end'); }
  }
  editor.view.focus();
}
function control(type, value) {
  restoreSelection();
  const chain = editor.chain().focus();
  if (type === 'font') chain.setFontFamily(value).run();
  if (type === 'size') chain.setFontSize(`${value}pt`).run();
  if (type === 'color') chain.setColor(value).run();
  if (type === 'spacing') chain.updateAttributes(editor.isActive('heading') ? 'heading' : 'paragraph', { lineHeight: value }).run();
  if (type === 'style') {
    if (editor.isActive('blockquote')) chain.lift('blockquote');
    if (value.startsWith('heading')) chain.setHeading({ level: Number(value.at(-1)) }).run();
    else if (value === 'quote') chain.setParagraph().toggleBlockquote().run();
    else chain.setParagraph().updateAttributes('paragraph', { academicStyle: value === 'paragraph' ? null : value }).run();
  }
  if (type === 'pageNumber') {
    config.onSettings?.({ pageNumber: value });
    changed();
  }
}
function command(name) {
  if (name === 'citation') return config.onCitation?.();
  if (name === 'library') return config.onLibrary?.();
  if (name === 'sidebar') return bySelector('.word-shell')?.classList.toggle('academic-sidebar-hidden');
  if (name === 'find') { const box = bySelector('.academic-find'); box.hidden = false; box.querySelector('input').focus(); return; }
  if (name === 'closeFind') { bySelector('.academic-find').hidden = true; return restoreSelection(); }
  if (name === 'next' || name === 'previous') return selectResult(name === 'next' ? 1 : -1);
  restoreSelection();
  const commands = {
    undo: chain => chain.undo(), redo: chain => chain.redo(),
    bold: chain => chain.toggleBold(), italic: chain => chain.toggleItalic(),
    underline: chain => chain.toggleUnderline(), strike: chain => chain.toggleStrike(),
    bullet: chain => chain.toggleBulletList(), numbered: chain => chain.toggleOrderedList()
  };
  if (commands[name]) return commands[name](editor.chain().focus()).run();
  if (['left','center','right','justify'].includes(name)) return editor.chain().focus().setTextAlign(name).run();
  if (name === 'clear') return editor.chain().focus().unsetAllMarks().clearNodes().updateAttributes('paragraph', { indent: 0, academicStyle: null, lineHeight: null, textAlign: 'justify' }).run();
  if (name === 'link') {
    const url = prompt('Endereço do link:', editor.getAttributes('link').href || 'https://');
    if (url === '') return editor.chain().focus().extendMarkRange('link').unsetLink().run();
    if (url && /^(https?:\/\/|mailto:)/i.test(url)) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }
  if (name === 'indent' || name === 'outdent') {
    if (editor.isActive('listItem')) return editor.chain().focus()[name === 'indent' ? 'sinkListItem' : 'liftListItem']('listItem').run();
    const type = editor.isActive('heading') ? 'heading' : 'paragraph';
    const indent = Math.min(5, Math.max(0, (editor.getAttributes(type).indent || 0) + (name === 'indent' ? 1 : -1)));
    editor.chain().focus().updateAttributes(type, { indent }).run();
  }
}
function find(query) {
  results = []; resultIndex = -1;
  if (query) editor.state.doc.descendants((node, pos) => {
    if (!node.isTextblock) return;
    const haystack = node.textContent.toLocaleLowerCase();
    let at = 0;
    while ((at = haystack.indexOf(query.toLocaleLowerCase(), at)) !== -1) { results.push({ from: pos + 1 + at, to: pos + 1 + at + query.length }); at += query.length; }
  });
  selectResult(1);
}
function selectResult(direction) {
  if (results.length) {
    resultIndex = (resultIndex + direction + results.length) % results.length;
    editor.commands.setTextSelection(results[resultIndex]);
    editor.commands.scrollIntoView();
  }
  const output = bySelector('.academic-find output');
  if (output) output.textContent = results.length ? `${resultIndex + 1} de ${results.length}` : '0 resultados';
}
function refreshReferences(references) {
  const changedReferences = JSON.stringify(context.references) !== JSON.stringify(references);
  context.references = references.map(reference => ({ ...reference }));
  if (!editor || !changedReferences) return;
  const tr = editor.state.tr.setMeta('referencesChanged', true).setMeta('addToHistory', false);
  // Recreate citation node views when library metadata changes, preserving document positions.
  editor.state.doc.descendants((node, pos) => { if (node.type.name === 'citation') tr.setNodeMarkup(pos, undefined, { ...node.attrs }); });
  editor.view.dispatch(tr);
  const citations = collectCitations(editor.state.doc);
  editor.view.dom.querySelectorAll('[data-citation-id]').forEach(dom => {
    const citation = citations.find(item => item.id === dom.dataset.citationId);
    if (citation) dom.textContent = formatCitation(context.references.find(ref => ref.id === citation.referenceId), citation);
  });
}
function render(options = {}) {
  if (!options.document) return;
  if (activeId === options.document.id && config.document === options.document && editor) {
    config = options;
    refreshReferences(options.references || []);
    return;
  }
  if (editor) { if (saveTimer || publishTimer) save(); editor.destroy(); }
  config = options; activeId = options.document.id; bookmark = null;
  context.references = (options.references || []).map(reference => ({ ...reference }));
  context.formatBibliography = options.formatBibliography;
  const pageNumber = options.document.settings?.pageNumber || 'bottom';
  const initialContent = normalizeContent(options.document.content, options.document.contentHtml);
  options.container.innerHTML = '';
  options.container.className = 'academic-document';
  editor = new Editor({
    element: options.container,
    extensions: [StarterKit.configure({ heading: { levels: [1,2,3] }, link: { openOnClick: false }, trailingNode: false }), TextStyle, FontFamily, FontSize, Color, Underline,
      TextAlign.configure({ types: ['heading','paragraph'], defaultAlignment: 'justify' }), TableKit,
      AcademicParagraph, citationExtension(context), bibliographyExtension(context), pastedCitationExtension(context), pageGuideExtension()],
    content: initialContent,
    editorProps: {
      attributes: { class: 'academic-prose', spellcheck: 'true', 'aria-label': 'Texto do documento' },
      transformPastedHTML: cleanHtml,
      handleKeyDown(view, event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') { event.preventDefault(); command('find'); return true; }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); return true; }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
          event.preventDefault();
          nativeSelectAll = true;
          editor.view.focus();
          const selectEditorContents = () => {
            if (!nativeSelectAll) return;
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(view.dom);
            selection.removeAllRanges();
            selection.addRange(range);
          };
          selectEditorContents();
          requestAnimationFrame(selectEditorContents);
          return true;
        }
        return false;
      },
      handleDOMEvents: {
        copy(view, event) {
          const selection = view.state.selection;
          const wholeDocument = selection.from <= 1 && selection.to >= view.state.doc.content.size - 1;
          if (!nativeSelectAll && !wholeDocument) return false;
          const plainText = view.dom.innerText || view.dom.textContent || '';
          const copyRoot = view.dom.cloneNode(true);
          copyRoot.querySelectorAll('p,h1,h2,h3').forEach(node => {
            const computed = getComputedStyle(node);
            if (/^H[1-3]$/.test(node.tagName)) {
              const paragraph = document.createElement('p');
              paragraph.innerHTML = node.innerHTML;
              paragraph.style.cssText = node.getAttribute('style') || '';
              paragraph.style.fontFamily = "'Times New Roman', serif";
              paragraph.style.fontSize = '12pt';
              paragraph.style.lineHeight = '1.5';
              paragraph.style.fontWeight = '700';
              paragraph.style.textAlign = computed.textAlign;
              node.replaceWith(paragraph);
            } else {
              node.style.fontFamily = "'Times New Roman', serif";
              node.style.fontSize = '12pt';
              node.style.lineHeight = '1.5';
            }
          });
          copyRoot.querySelectorAll('.academic-citation').forEach(node => {
            node.style.removeProperty('color');
            node.classList.remove('academic-citation');
          });
          const html = copyRoot.innerHTML;
          if (event.clipboardData) {
            event.clipboardData.setData('text/plain', plainText);
            event.clipboardData.setData('text/html', html);
            event.preventDefault();
            nativeSelectAll = false;
            return true;
          }
          return false;
        }
      },
      handleClick(view, pos, event) {
        nativeSelectAll = false;
        const citation = event.target.closest('[data-citation-id]');
        if (citation) { config.onCitation?.(collectCitations(view.state.doc).find(item => item.id === citation.dataset.citationId)); return true; }
        return false;
      }
    },
    onUpdate() {
      changed();
    },
    onTransaction({ transaction }) { if (bookmark) bookmark = bookmark.map(transaction.mapping); },
    onSelectionUpdate() { storeSelection(); updateToolbar(bySelector('#academicToolbar'), editor); clearTimeout(statsTimer); statsTimer = setTimeout(updateStats, 150); }
  });
  mountToolbar(bySelector('#academicToolbar'), { command, control, find, storeSelection });
  bySelector('[data-academic-control="pageNumber"]').value = pageNumber;
  const title = bySelector('#academicDocumentTitle');
  title.value = options.document.nome || 'Documento sem título';
  title.onchange = () => { config.onRename?.(title.value.trim() || 'Documento sem título'); changed(); };
  config.onChange?.(snapshot());
  status('Salvo');
  if (!editor.getText().trim()) editor.commands.setTextSelection(1);
  setTimeout(() => {
    if (!editor.getText().trim()) editor.commands.setTextSelection(1);
    updateStats();
  }, 100);
}
function insertCitation(citation) {
  restoreSelection();
  let existing;
  editor.state.doc.descendants((node, pos) => { if (node.type.name === 'citation' && node.attrs.id === citation.id) existing = pos; });
  if (existing !== undefined) editor.view.dispatch(editor.state.tr.setNodeMarkup(existing, undefined, citation));
  else editor.chain().focus().insertContent({ type: 'citation', attrs: citation }).run();
  bookmark = editor.state.selection.getBookmark();
}
window.addEventListener('pagehide', () => { if (editor) { publish(); config.onSave?.()?.catch?.(() => {}); } });
window.DissertationEditor = { render, storeSelection, insertCitation, refreshReferences, cleanHtml, extractHeadings, formatCitation, sortReferences, configureReferenceForm,
  commit: () => editor?.getHTML(), getHtml: () => editor?.getHTML(), getEditor: () => editor,
  textToHtml: text => String(text).split(/\n/).map(line => `<p>${escapeHtml(line)}</p>`).join(''),
  flush: () => { if (editor) { config.onChange?.(snapshot()); return save(); } }
};
