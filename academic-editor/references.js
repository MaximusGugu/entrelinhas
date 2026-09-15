export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function surnames(reference) {
  if (reference.autoriaTipo === 'sem_autor') return [reference.titulo || 'Sem autoria'];
  if (reference.autoriaTipo === 'entidade' || (!reference.autores && reference.autorInstitucional)) return [reference.autorInstitucional || 'Instituição'];
  return String(reference.autores || reference.autorSite || '').split(';').map(name => name.trim()).filter(Boolean)
    .map(name => name.includes(',') ? name.split(',')[0].trim() : name.split(/\s+/).at(-1));
}

export function sortReferences(references) {
  return [...references].sort((a, b) => (surnames(a)[0] || a.titulo || '').localeCompare(surnames(b)[0] || b.titulo || '', 'pt-BR', { sensitivity: 'base' }) || (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR'));
}

export function formatCitation(reference, options = {}) {
  if (!reference) return '[Referência removida]';
  const names = surnames(reference);
  const mode = options.mode || 'parentetica';
  const narrative = mode.startsWith('narrativa') || mode === 'autor';
  const display = names.map(name => narrative && reference.autoriaTipo !== 'entidade' ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : name.toUpperCase());
  const author = display.length > 3 ? `${display[0]} et al.` : display.join(narrative ? ' e ' : '; ');
  const year = reference.ano || reference.dataPublicacaoCompleta?.slice(0, 4) || 's.d.';
  const page = options.page ? `, p. ${options.page}` : '';
  const text = mode === 'ano' ? year : mode === 'autor' ? author : narrative ? `${author} (${year}${page})` : `(${author}, ${year}${page})`;
  return `${options.prefix || ''}${text}${options.suffix || ''}`;
}

export function collectCitations(doc) {
  const citations = [];
  doc.descendants(node => { if (node.type.name === 'citation') citations.push({ ...node.attrs }); });
  return citations;
}

export function bibliographyHtml(doc, references, formatter) {
  const used = new Set(collectCitations(doc).map(c => c.referenceId));
  const items = sortReferences(references.filter(ref => used.has(ref.id)));
  if (!items.length) return '';
  return '<h2>REFERÊNCIAS</h2>' + items.map(reference => {
    const text = formatter(reference);
    const emphasis = reference.tipoReferencia === 'artigo' ? reference.periodico : reference.tipoReferencia === 'evento' ? reference.tituloAnais : reference.tipoReferencia === 'capitulo' ? reference.tituloObra : reference.tipoReferencia === 'site' ? reference.nomeSite : reference.titulo;
    let html = escapeHtml(text);
    if (emphasis) html = html.replace(escapeHtml(emphasis), `<strong>${escapeHtml(emphasis)}</strong>`);
    return `<p data-bibliography-id="${escapeHtml(reference.id)}">${html}</p>`;
  }).join('');
}
