import { Node, Extension, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Fragment } from '@tiptap/pm/model';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { bibliographyHtml, formatCitation, surnames } from './references.js';

export function citationExtension(context) {
  return Node.create({
    name: 'citation', group: 'inline', inline: true, atom: true, selectable: true,
    addAttributes() {
      return Object.fromEntries(['id', 'referenceId', 'mode', 'page', 'prefix', 'suffix'].map(key => [key, {
        default: '', parseHTML: element => element.getAttribute(`data-${key.toLowerCase()}`) || '',
        renderHTML: attrs => ({ [`data-${key.toLowerCase()}`]: attrs[key] })
      }]));
    },
    parseHTML: () => [{ tag: 'span[data-referenceid]' }],
    renderHTML({ node, HTMLAttributes }) {
      return ['span', mergeAttributes(HTMLAttributes, { class: 'academic-citation' }), formatCitation(context.references.find(ref => ref.id === node.attrs.referenceId), node.attrs)];
    },
    renderText({ node }) { return formatCitation(context.references.find(ref => ref.id === node.attrs.referenceId), node.attrs); },
    addNodeView() {
      return ({ node }) => {
        const dom = document.createElement('span');
        dom.className = 'academic-citation';
        dom.contentEditable = 'false';
        const update = current => {
          dom.textContent = formatCitation(context.references.find(ref => ref.id === current.attrs.referenceId), current.attrs);
          dom.title = 'Editar citação';
          dom.dataset.citationId = current.attrs.id;
          return true;
        };
        update(node);
        return { dom, update, ignoreMutation: () => true };
      };
    }
  });
}

export function bibliographyExtension(context) {
  const key = new PluginKey('academicBibliography');
  return Extension.create({
    name: 'academicBibliography',
    addProseMirrorPlugins() {
      return [new Plugin({
        key,
        state: {
          init: (_, state) => make(state.doc),
          apply: (tr, previous) => tr.docChanged || tr.getMeta('referencesChanged') ? make(tr.doc) : previous.map(tr.mapping, tr.doc)
        },
        props: { decorations: state => key.getState(state) }
      })];
    }
  });
  function make(doc) {
    const html = bibliographyHtml(doc, context.references, context.formatBibliography);
    if (!html) return DecorationSet.empty;
    return DecorationSet.create(doc, [Decoration.widget(doc.content.size, () => {
      const dom = document.createElement('section');
      dom.className = 'academic-bibliography';
      dom.setAttribute('contenteditable', 'false');
      dom.setAttribute('aria-label', 'Referências automáticas');
      dom.innerHTML = html;
      return dom;
    }, { side: 1, key: html, ignoreSelection: true })]);
  }
}

export function pastedCitationExtension(context) {
  return Extension.create({
    name: 'pastedCitationLinker',
    addProseMirrorPlugins() {
      return [new Plugin({
        appendTransaction(transactions, oldState, newState) {
          if (!transactions.some(transaction => transaction.getMeta('uiEvent') === 'paste')) return null;
          const matches = [];
          newState.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const text = node.text || '';
            const patterns = [
              /\(([A-ZÀ-ÖØ-Ý][A-ZÀ-ÖØ-Ý; .,\-']+),\s*(\d{4}|\[?s\.d\.\]?)\)/gi,
              /\b([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'’-]*(?:\s+[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'’-]*){0,6})\s*\((\d{4}|\[?s\.d\.\]?)\)/g
            ];
            patterns.forEach((pattern, patternIndex) => {
              let match;
              while ((match = pattern.exec(text))) {
                const author = patternIndex === 0 ? match[1].split(';')[0].trim() : match[1];
                const citedYear = normalizeYear(match[2]);
                const reference = context.references.find(item => normalizeYear(item.ano || item.dataPublicacaoCompleta) === citedYear && surnames(item).some(surname => normalize(surname) === normalize(author)));
                if (reference) {
                  const nextCharacter = text[match.index + match[0].length] || '';
                  matches.push({ pos: pos + match.index, length: match[0].length, reference, mode: patternIndex === 0 ? 'parentetica' : 'narrativa', needsSpace: /^[\p{L}\p{N}]$/u.test(nextCharacter) });
                }
              }
            });
          });
          if (!matches.length) return null;
          const tr = newState.tr.setMeta('addToHistory', false).setMeta('autoCitationLink', true);
          matches.sort((a, b) => b.pos - a.pos);
          const used = new Set();
          matches.forEach(match => {
            if (used.has(match.pos)) return;
            used.add(match.pos);
            const citation = newState.schema.nodes.citation.create({ id: makeId(), referenceId: match.reference.id, mode: match.mode, page: '', prefix: '', suffix: '' });
            const replacement = match.needsSpace ? Fragment.fromArray([citation, newState.schema.text(' ')]) : Fragment.from(citation);
            tr.replaceWith(match.pos, match.pos + match.length, replacement);
          });
          return tr.docChanged ? tr : null;
        }
      })];
    }
  });
  function normalize(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]/g, ''); }
  function normalizeYear(value) { const text = String(value || '').toLocaleLowerCase(); return text.includes('s.d') ? 'sd' : (text.match(/\d{4}/)?.[0] || 'sd'); }
  function makeId() { return globalThis.crypto?.randomUUID?.() || `citation-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

export const AcademicParagraph = Extension.create({
  name: 'academicParagraph',
  addGlobalAttributes() {
    return [{ types: ['paragraph', 'heading', 'blockquote'], attributes: {
      lineHeight: { default: null, parseHTML: el => el.style.lineHeight || null, renderHTML: a => a.lineHeight ? { style: `line-height:${a.lineHeight}` } : {} },
      indent: { default: 0, parseHTML: el => Number(el.dataset.indent) || 0, renderHTML: a => a.indent ? { 'data-indent': a.indent, style: `margin-left:${a.indent * 1.25}cm` } : {} },
      academicStyle: { default: null, parseHTML: el => el.dataset.academicStyle || null, renderHTML: a => a.academicStyle ? { 'data-academic-style': a.academicStyle } : {} }
    } }];
  },
  addProseMirrorPlugins() {
    return [new Plugin({
      appendTransaction(transactions, oldState, state) {
        if (!transactions.some(tr => tr.docChanged) || transactions.some(tr => tr.getMeta('autoHeading'))) return;
        const tr = state.tr;
        state.doc.descendants((node, pos) => {
          if (node.type.name !== 'paragraph') return;
          const match = node.textContent.match(/^(\d+(?:\.\d+){0,2})\s+\S/);
          if (match) tr.setNodeMarkup(pos, state.schema.nodes.heading, { ...node.attrs, level: match[1].split('.').length });
        });
        return tr.docChanged ? tr.setMeta('autoHeading', true) : null;
      }
    })];
  }
});

export function pageGuideExtension() {
  const key = new PluginKey('academicPageGuides');
  let updating = false;
  return Extension.create({
    name: 'academicPageGuides',
    addProseMirrorPlugins() {
      return [new Plugin({
        key,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, previous) => {
            const positions = tr.getMeta(key);
            if (Array.isArray(positions)) return DecorationSet.create(tr.doc, positions.map(pos => Decoration.widget(pos, () => {
              const dom = document.createElement('div');
              dom.className = 'academic-page-guide';
              dom.setAttribute('aria-hidden', 'true');
              return dom;
            }, { side: -1, key: `page-${pos}`, ignoreSelection: true })));
            return previous.map(tr.mapping, tr.doc);
          }
        },
        props: { decorations: state => key.getState(state) },
        view(view) {
          const refresh = () => {
            if (updating || !view.dom.isConnected) return;
            const root = view.dom;
            const rootTop = root.getBoundingClientRect().top;
            const contentTop = 113.386;
            const contentHeight = 933.543;
            const pageStride = 1150.52;
            const positions = [];
            let lastPage = 0;
            [...root.children].forEach(node => {
              if (node.classList.contains('academic-page-guide')) return;
              if (!/^(P|H1|H2|H3|H4|BLOCKQUOTE|UL|OL|TABLE|SECTION)$/.test(node.tagName)) return;
              const top = node.getBoundingClientRect().top - rootTop;
              const page = Math.floor(Math.max(0, top - contentTop) / pageStride);
              if (page > lastPage && top >= contentTop + lastPage * pageStride + contentHeight) {
                const pos = view.posAtDOM(node, 0);
                if (Number.isFinite(pos)) positions.push(pos);
                lastPage = page;
              }
            });
            const signature = positions.join(',');
            if (view.__academicPageGuideSignature === signature) return;
            view.__academicPageGuideSignature = signature;
            updating = true;
            view.dispatch(view.state.tr.setMeta(key, positions).setMeta('addToHistory', false));
            updating = false;
          };
          requestAnimationFrame(refresh);
          return { update: refresh };
        }
      })];
    }
  });
}
