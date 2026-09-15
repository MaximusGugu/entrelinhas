import DOMPurify from 'dompurify';
export function cleanHtml(html = '') {
  const template = document.createElement('template');
  template.innerHTML = DOMPurify.sanitize(html, { FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe'], FORBID_ATTR: ['id'] });
  template.content.querySelectorAll('[data-page-spacer],.editor-page-spacer,.page-break-guide,.doc-references,.doc-auto-reference,[data-generated-reference],.academic-bibliography,[data-rm-pagination],.rm-first-page-header').forEach(el => el.remove());
  template.content.querySelectorAll('*').forEach(el => {
    const allowed = ['font-weight','font-style','text-decoration','color','font-family','font-size','text-align','line-height'];
    const styles = allowed.map(key => {
      const value = el.style.getPropertyValue(key);
      return value && !/url|expression|var\(/i.test(value) ? `${key}:${value}` : '';
    }).filter(Boolean).join(';');
    el.removeAttribute('style');
    el.removeAttribute('class');
    if (styles) el.setAttribute('style', styles);
    if (el.tagName === 'A' && !/^(https?:|mailto:)/i.test(el.getAttribute('href') || '')) el.removeAttribute('href');
  });
  const meaningful = [...template.content.children].some(el => {
    if (['BR'].includes(el.tagName)) return false;
    return (el.textContent || '').trim() || !['P','DIV'].includes(el.tagName);
  });
  return meaningful ? template.innerHTML.trim() : '<p></p>';
}

export function extractHeadings(html = '') {
  const el = document.createElement('div');
  el.innerHTML = cleanHtml(html);
  return [...el.querySelectorAll('h1,h2,h3,p')].map(node => {
    const match = node.textContent.trim().match(/^(\d+(?:\.\d+)*)\s+(.+)/);
    if (!match && node.tagName === 'P') return null;
    return { number: match?.[1] || '', title: match?.[2] || node.textContent, level: match ? Math.min(3, match[1].split('.').length) : Number(node.tagName.slice(1)) };
  }).filter(Boolean);
}
