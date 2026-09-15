const APP_VERSION = 2;
const STORE_KEY = 'entrelinhas-data-v1';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const now = () => new Date().toISOString();
const esc = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));
const byId = (items, id) => (items || []).find(item => item.id === id);
const today = () => new Date().toISOString().slice(0, 10);

const PALETTE = ['#2e604a', '#4f7dbd', '#b9822f', '#8d67b5', '#b85f59', '#3f8f91', '#8a7045', '#b35f8a'];
const DEFAULT_STATUSES = [
  { id: 'a_fichar', nome: 'A fichar', cor: '#8b8f97' },
  { id: 'em_leitura', nome: 'Em leitura', cor: '#4f7dbd' },
  { id: 'fichado', nome: 'Fichado', cor: '#2e604a' },
  { id: 'citado', nome: 'Citado', cor: '#8d67b5' },
  { id: 'revisar', nome: 'Revisar', cor: '#b9822f' },
  { id: 'descartado', nome: 'Descartado', cor: '#a33c35' }
];
const REFERENCE_TYPES = [
  { id: 'livro', nome: 'Livro' },
  { id: 'ebook', nome: 'Livro eletrônico / e-book' },
  { id: 'artigo', nome: 'Artigo de periódico' },
  { id: 'evento', nome: 'Trabalho em evento / anais' },
  { id: 'site', nome: 'Artigo em site / revista online' },
  { id: 'documento_institucional', nome: 'Documento institucional online' },
  { id: 'capitulo', nome: 'Capítulo de livro' },
  { id: 'relatorio', nome: 'Relatório / diretriz / norma / política' }
];
const AUTHORSHIP_TYPES = [
  { id: 'pessoa', nome: 'Pessoa' },
  { id: 'entidade', nome: 'Entidade / instituição' },
  { id: 'sem_autor', nome: 'Sem autor' }
];
const SUPPORT_TYPES = [
  { id: '', nome: 'Não informado' },
  { id: 'impresso', nome: 'Impresso' },
  { id: 'ebook', nome: 'E-book' },
  { id: 'pdf', nome: 'PDF' },
  { id: 'recurso_eletronico', nome: 'Recurso eletrônico' }
];
const DOCUMENT_TYPES = [
  { id: '', nome: 'Não informado' },
  { id: 'diretriz', nome: 'Diretriz' },
  { id: 'resolucao', nome: 'Resolução' },
  { id: 'politica', nome: 'Política' },
  { id: 'relatorio', nome: 'Relatório' },
  { id: 'manual', nome: 'Manual' },
  { id: 'norma', nome: 'Norma' }
];

const defaultDissertation = () => ({
  id: uid(),
  nome: 'Documento sem título',
  criadoEm: now(),
  atualizadoEm: now(),
  meta: {
    titulo: '',
    subtitulo: '',
    autor: '',
    mesAno: '',
    orientador: '',
    coorientador: '',
    area: '',
    linha: '',
    palavras: ''
  },
  citations: [],
  contentHtml: '<p><br></p>',
  blocks: []
});

const demo = () => {
  const referenceCategories = [
    { id: 'c1', nome: 'Fundamentação teórica', cor: '#2e604a' },
    { id: 'c2', nome: 'Metodologia', cor: '#4f7dbd' },
    { id: 'c3', nome: 'Trabalhos relacionados', cor: '#8d67b5' }
  ];
  const referenceTags = [
    { id: 't1', nome: 'Revisão sistemática', cor: '#4f7dbd' },
    { id: 't2', nome: 'ABNT', cor: '#b9822f' },
    { id: 't3', nome: 'Método científico', cor: '#2e604a' }
  ];
  const references = [
    {
      id: 'r1',
      tipoReferencia: 'livro',
      autoriaTipo: 'pessoa',
      titulo: 'Metodologia científica',
      subtitulo: 'fundamentos para pesquisa acadêmica',
      autores: 'Maria Cecília Minayo',
      ano: '2014',
      localPublicacao: 'São Paulo',
      editora: 'Atlas',
      volume: '',
      numero: '',
      paginas: '',
      url: 'https://exemplo.com/metodologia',
      dataAcesso: today(),
      biblioteca: 'Biblioteca central',
      dataRetirada: '',
      dataEntrega: '',
      categoriaId: 'c2',
      status: 'em_leitura',
      tagIds: ['t3'],
      resumo: 'Referência de base para classificar a pesquisa e justificar o método.',
      observacoes: '',
      citacoes: [{ id: uid(), texto: 'A metodologia orienta a coerência entre problema, objetivos e procedimentos.', pagina: '42', comentario: 'Usar na seção de metodologia.', tagIds: ['t3'] }],
      criadoEm: now(),
      atualizadoEm: now()
    },
    {
      id: 'r2',
      tipoReferencia: 'artigo',
      autoriaTipo: 'pessoa',
      titulo: 'Como formatar referências acadêmicas',
      subtitulo: '',
      autores: 'João Santos',
      ano: '2013',
      localPublicacao: '',
      editora: '',
      periodico: 'Revista de Pesquisa Aplicada',
      localPeriodico: 'Florianópolis',
      volume: '8',
      numero: '2',
      paginas: '20-35',
      url: 'https://exemplo.com/artigo',
      dataAcesso: today(),
      biblioteca: '',
      dataRetirada: '',
      dataEntrega: '',
      categoriaId: 'c1',
      status: 'citado',
      tagIds: ['t2'],
      resumo: 'Exemplo para testar citações narrativas e parentéticas no editor.',
      observacoes: '',
      citacoes: [{ id: uid(), texto: 'A padronização das referências favorece a rastreabilidade das fontes.', pagina: '24', comentario: 'Exemplo de citação direta.', tagIds: ['t2'] }],
      criadoEm: now(),
      atualizadoEm: now()
    }
  ];
  const dissertation = defaultDissertation();
  return {
    version: APP_VERSION,
    references,
    referenceCategories,
    referenceTags,
    ideas: [
      { id: 'i1', titulo: 'Problema central', texto: 'Qual lacuna a dissertação resolve?', cor: '#fff1a8', x: 70, y: 80, tagIds: [], criadoEm: now(), atualizadoEm: now() },
      { id: 'i2', titulo: 'Hipótese', texto: 'A solução proposta melhora a organização do processo de escrita acadêmica.', cor: '#cce8ff', x: 330, y: 170, tagIds: [], criadoEm: now(), atualizadoEm: now() }
    ],
    ideaLinks: [{ id: uid(), from: 'i1', to: 'i2' }],
    taskLists: [
      { id: 'tl1', nome: 'Qualificação', data: today(), items: [{ id: uid(), texto: 'Revisar problema de pesquisa', done: false, due: today(), priority: 'alta' }, { id: uid(), texto: 'Fechar objetivos específicos', done: false, due: '', priority: 'media' }], criadoEm: now(), atualizadoEm: now() }
    ],
    glossary: [
      { id: 'g1', termo: 'ABNT', sigla: 'ABNT', significado: 'Associação Brasileira de Normas Técnicas.', notas: 'Usada para formatação e referências.', referenceId: '', criadoEm: now(), atualizadoEm: now() }
    ],
    dissertations: [dissertation],
    activeDissertationId: dissertation.id,
    dissertation,
    settings: { theme: 'light', displayName: '', referenceView: 'grid', referenceSidebarCollapsed: false, referenceKanbanGroup: 'status', documentFontSize: '12', statuses: DEFAULT_STATUSES }
  };
};

function migrateReferenceFromWork(work, categories, tags) {
  return {
    id: work.id || uid(),
    tipoReferencia: 'livro',
    autoriaTipo: 'pessoa',
    titulo: work.titulo || 'Referência sem título',
    subtitulo: work.tituloAlternativo || '',
    autores: work.autor || '',
    ano: (work.dataInicio || '').slice(0, 4),
    localPublicacao: '',
    editora: '',
    url: work.linkLeitura || '',
    dataAcesso: '',
    biblioteca: '',
    dataRetirada: '',
    dataEntrega: '',
    categoriaId: categories.some(cat => cat.id === work.categoriaId) ? work.categoriaId : '',
    status: work.status === 'concluido' ? 'fichado' : work.status === 'lendo' ? 'em_leitura' : 'a_fichar',
    tagIds: (work.tagIds || []).filter(id => tags.some(tag => tag.id === id)),
    resumo: work.sinopse || work.observacoes || '',
    observacoes: '',
    citacoes: [],
    criadoEm: work.criadoEm || now(),
    atualizadoEm: work.atualizadoEm || now()
  };
}

function normalizeReferenceSchema(reference = {}) {
  const type = referenceType(reference);
  reference.tipoReferencia = type;
  reference.autoriaTipo = reference.autoriaTipo || (reference.autorInstitucional ? 'entidade' : reference.autores ? 'pessoa' : 'sem_autor');
  reference.autores = fieldValue(reference, 'autores');
  reference.autorInstitucional = fieldValue(reference, 'autorInstitucional');
  reference.organizadores = fieldValue(reference, 'organizadores');
  reference.tradutores = fieldValue(reference, 'tradutores');
  reference.titulo = fieldValue(reference, 'titulo') || 'Referência sem título';
  reference.subtitulo = fieldValue(reference, 'subtitulo');
  reference.ano = fieldValue(reference, 'ano') || fieldValue(reference, 'dataPublicacaoCompleta').slice(0, 4);
  reference.dataPublicacaoCompleta = fieldValue(reference, 'dataPublicacaoCompleta');
  reference.mesPublicacao = fieldValue(reference, 'mesPublicacao');
  reference.idioma = fieldValue(reference, 'idioma');
  reference.notasPublicacao = fieldValue(reference, 'notasPublicacao');
  reference.edicao = fieldValue(reference, 'edicao');
  reference.localPublicacao = fieldValue(reference, 'localPublicacao');
  reference.editora = fieldValue(reference, 'editora');
  reference.isbn = fieldValue(reference, 'isbn');
  reference.totalPaginas = fieldValue(reference, 'totalPaginas');
  reference.suporte = fieldValue(reference, 'suporte') || (type === 'ebook' ? 'ebook' : '');
  reference.colecao = fieldValue(reference, 'colecao');
  reference.periodico = fieldValue(reference, 'periodico');
  reference.localPeriodico = fieldValue(reference, 'localPeriodico');
  reference.volume = fieldValue(reference, 'volume');
  reference.numero = fieldValue(reference, 'numero');
  reference.paginas = fieldValue(reference, 'paginas');
  reference.issn = fieldValue(reference, 'issn');
  reference.doi = fieldValue(reference, 'doi');
  reference.url = fieldValue(reference, 'url');
  reference.dataAcesso = fieldValue(reference, 'dataAcesso');
  reference.nomeEvento = fieldValue(reference, 'nomeEvento');
  reference.edicaoEvento = fieldValue(reference, 'edicaoEvento');
  reference.anoEvento = fieldValue(reference, 'anoEvento');
  reference.localEvento = fieldValue(reference, 'localEvento');
  reference.tituloAnais = fieldValue(reference, 'tituloAnais');
  reference.localPublicacaoAnais = fieldValue(reference, 'localPublicacaoAnais');
  reference.editoraAnais = fieldValue(reference, 'editoraAnais');
  reference.numeroArtigo = fieldValue(reference, 'numeroArtigo');
  reference.nomeSite = fieldValue(reference, 'nomeSite');
  reference.autorSite = fieldValue(reference, 'autorSite');
  reference.dataAtualizacao = fieldValue(reference, 'dataAtualizacao');
  reference.orgaoSecundario = fieldValue(reference, 'orgaoSecundario');
  reference.tipoDocumento = fieldValue(reference, 'tipoDocumento');
  reference.numeroDocumento = fieldValue(reference, 'numeroDocumento');
  reference.instituicaoPublicadora = fieldValue(reference, 'instituicaoPublicadora');
  reference.biblioteca = fieldValue(reference, 'biblioteca');
  reference.dataRetirada = fieldValue(reference, 'dataRetirada');
  reference.dataEntrega = fieldValue(reference, 'dataEntrega');
  reference.resumo = fieldValue(reference, 'resumo');
  reference.observacoes = fieldValue(reference, 'observacoes');
  reference.status = reference.status || 'a_fichar';
  reference.tagIds = Array.isArray(reference.tagIds) ? reference.tagIds : [];
  reference.citacoes = Array.isArray(reference.citacoes) ? reference.citacoes : [];
  reference.criadoEm = reference.criadoEm || now();
  reference.atualizadoEm = reference.atualizadoEm || reference.criadoEm;
  return reference;
}

function ensureDissertationDocument(document, index = 0) {
  const base = defaultDissertation();
  const meta = { ...base.meta, ...(document?.meta || {}) };
  const blocks = Array.isArray(document?.blocks) && document.blocks.length ? document.blocks : base.blocks;
  const normalized = {
    ...base,
    ...(document || {}),
    id: document?.id || uid(),
    nome: document?.nome || meta.titulo || `Documento ${index + 1}`,
    meta,
    blocks,
    citations: Array.isArray(document?.citations) ? document.citations : [],
    criadoEm: document?.criadoEm || now(),
    atualizadoEm: document?.atualizadoEm || document?.criadoEm || now()
  };
  if (!normalized.contentHtml) normalized.contentHtml = blocksToEditorHtml(normalized);
  return normalized;
}

function activeDissertation() {
  if (!Array.isArray(state.dissertations) || !state.dissertations.length) {
    const document = ensureDissertationDocument(defaultDissertation());
    state.dissertations = [document];
    state.activeDissertationId = document.id;
  }
  let document = byId(state.dissertations, state.activeDissertationId);
  if (!document) {
    document = state.dissertations[0];
    state.activeDissertationId = document.id;
  }
  if (!document.contentHtml) document.contentHtml = blocksToEditorHtml(document);
  state.dissertation = document;
  return document;
}

function normalizeStateData(data) {
  if (!data || typeof data !== 'object') return demo();
  const legacyDissertation = data.dissertation || defaultDissertation();
  const dissertations = Array.isArray(data.dissertations) && data.dissertations.length ? data.dissertations : [legacyDissertation];
  const migrated = {
    version: APP_VERSION,
    referenceCategories: data.referenceCategories || data.categories || [],
    referenceTags: data.referenceTags || data.tags || [],
    references: data.references || [],
    ideas: data.ideas || [],
    ideaLinks: data.ideaLinks || [],
    taskLists: data.taskLists || [],
    glossary: data.glossary || [],
    dissertations: dissertations.map(ensureDissertationDocument),
    activeDissertationId: data.activeDissertationId || '',
    dissertation: null,
    settings: { ...(data.settings || {}) }
  };
  migrated.referenceCategories.forEach((item, index) => item.cor = item.cor || PALETTE[index % PALETTE.length]);
  migrated.referenceTags.forEach((item, index) => item.cor = item.cor || PALETTE[(index + 2) % PALETTE.length]);
  if (!migrated.references.length && Array.isArray(data.works)) {
    migrated.references = data.works.map(work => migrateReferenceFromWork(work, migrated.referenceCategories, migrated.referenceTags));
  }
  migrated.references.forEach(reference => {
    reference.id = reference.id || uid();
    normalizeReferenceSchema(reference);
  });
  migrated.ideas.forEach((idea, index) => {
    idea.id = idea.id || uid();
    idea.cor = idea.cor || PALETTE[index % PALETTE.length];
    idea.x = Number.isFinite(Number(idea.x)) ? Number(idea.x) : 60 + index * 40;
    idea.y = Number.isFinite(Number(idea.y)) ? Number(idea.y) : 80 + index * 35;
    idea.criadoEm = idea.criadoEm || now();
    idea.atualizadoEm = idea.atualizadoEm || idea.criadoEm;
  });
  migrated.taskLists.forEach(list => {
    list.id = list.id || uid();
    list.items = Array.isArray(list.items) ? list.items : [];
    list.items.forEach(item => item.id = item.id || uid());
    list.criadoEm = list.criadoEm || now();
    list.atualizadoEm = list.atualizadoEm || list.criadoEm;
  });
  migrated.glossary.forEach(term => {
    term.id = term.id || uid();
    term.criadoEm = term.criadoEm || now();
    term.atualizadoEm = term.atualizadoEm || term.criadoEm;
  });
  if (!migrated.dissertations.some(document => document.id === migrated.activeDissertationId)) {
    migrated.activeDissertationId = migrated.dissertations[0]?.id || '';
  }
  migrated.dissertation = migrated.dissertations.find(document => document.id === migrated.activeDissertationId) || migrated.dissertations[0] || ensureDissertationDocument(defaultDissertation());
  migrated.settings.theme = migrated.settings.theme || 'light';
  migrated.settings.referenceView = migrated.settings.referenceView || migrated.settings.shelfView || 'grid';
  migrated.settings.referenceKanbanGroup = migrated.settings.referenceKanbanGroup || 'status';
  migrated.settings.documentFontSize = String(migrated.settings.documentFontSize || '12');
  const savedStatuses = Array.isArray(migrated.settings.statuses) ? migrated.settings.statuses : [];
  const baseStatuses = DEFAULT_STATUSES.map((status, index) => {
    const saved = savedStatuses.find(item => item.id === status.id) || {};
    return { id: status.id, nome: saved.nome || status.nome, cor: saved.cor || status.cor || PALETTE[index % PALETTE.length] };
  });
  const customStatuses = savedStatuses
    .filter(item => item?.id && !DEFAULT_STATUSES.some(status => status.id === item.id))
    .map((item, index) => ({ id: item.id, nome: item.nome || item.id, cor: item.cor || PALETTE[(index + 4) % PALETTE.length] }));
  migrated.settings.statuses = [...baseStatuses, ...customStatuses];
  return migrated;
}

const Store = {
  key: STORE_KEY,
  load() {
    try {
      return normalizeStateData(JSON.parse(localStorage.getItem(this.key)));
    } catch {
      return demo();
    }
  },
  valid(data) {
    return data && typeof data === 'object' && (
      Array.isArray(data.references) || Array.isArray(data.works)
    ) && data.settings && typeof data.settings === 'object';
  },
  save() {
    state.dissertation = activeDissertation();
    localStorage.setItem(this.key, JSON.stringify(state));
    const user = window.FirebaseBackend?.auth.currentUser;
    if (syncReady && user) {
      window.FirebaseBackend.saveState(user.uid, state).catch(error => {
        console.error('Falha na sincronização:', error);
        toast('Dados salvos neste dispositivo; sincronização pendente');
      });
    }
  }
};

let state = Store.load();
let currentModal = null;
let syncReady = false;
let authMode = 'login';
let draggingIdea = null;
let reopenCitationAfterReference = false;
let dissertationSaveTimer = null;
let selectedReferenceIds = new Set();
let savedEditorRange = null;

const statusList = () => state.settings.statuses || DEFAULT_STATUSES;
const statusById = id => statusList().find(status => status.id === id);
const statusName = id => statusById(id)?.nome || id || 'Sem status';
const statusColor = id => statusById(id)?.cor || '#6f746d';
const refTypeName = id => REFERENCE_TYPES.find(type => type.id === id)?.nome || id || 'Outro';
const chipStyle = color => `style="--pill-color:${esc(color || '#6f746d')}"`;
const itemColor = item => item?.cor || '#6f746d';
const fieldValue = (reference, ...fields) => {
  for (const field of fields) {
    const value = reference?.[field];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return '';
};
const referenceType = reference => {
  const raw = fieldValue(reference, 'tipoReferencia') || 'livro';
  return REFERENCE_TYPES.some(type => type.id === raw) ? raw : 'livro';
};
const referenceYear = reference => fieldValue(reference, 'ano') || fieldValue(reference, 'dataPublicacaoCompleta').slice(0, 4) || 's.d.';
const referenceUrl = reference => fieldValue(reference, 'url');
const referenceDoi = reference => fieldValue(reference, 'doi');

function toast(message) {
  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.textContent = message;
  $('#toastRegion').append(toastEl);
  setTimeout(() => toastEl.remove(), 2800);
}

function persist(message) {
  Store.save();
  renderAll();
  if (message) toast(message);
}

function options(items, first, value = 'id', label = 'nome') {
  return `<option value="">${first}</option>` + items.map(item => `<option value="${esc(item[value])}">${esc(item[label])}</option>`).join('');
}

function authorsList(reference) {
  return String(fieldValue(reference, 'autores', 'autorSite') || '').split(';').map(author => author.trim()).filter(Boolean);
}

function authorLastName(author = '') {
  const parts = author.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

function abntAuthors(reference) {
  if (reference.autoriaTipo === 'sem_autor') return '';
  const institutional = fieldValue(reference, 'autorInstitucional');
  if (reference.autoriaTipo === 'entidade' || (!authorsList(reference).length && institutional)) return institutional.toUpperCase();
  const authors = authorsList(reference);
  if (!authors.length) return '';
  return authors.map(author => {
    const parts = author.trim().split(/\s+/);
    const last = (parts.pop() || '').toUpperCase();
    return `${last}, ${parts.join(' ')}`.trim();
  }).join('; ');
}

function abntEntry(reference) {
  return abntAuthors(reference) || `${fieldValue(reference, 'titulo') || 'REFERÊNCIA SEM TÍTULO'}`;
}

function referenceAuthorshipDisplay(reference) {
  if (reference.autoriaTipo === 'sem_autor') return 'Sem autoria';
  return fieldValue(reference, 'autores', 'autorInstitucional', 'autorSite') || 'Autoria não informada';
}

function citationAuthor(reference, upper = false) {
  const institutional = fieldValue(reference, 'autorInstitucional');
  const first = reference.autoriaTipo === 'entidade' || (!authorsList(reference).length && institutional)
    ? institutional.split(/\s+/).filter(Boolean).slice(0, 3).join(' ')
    : authorLastName(authorsList(reference)[0] || fieldValue(reference, 'titulo') || 'Autor');
  return upper ? first.toUpperCase() : first;
}

function formatCitation(reference, mode, page) {
  const year = referenceYear(reference);
  const pageText = page ? `, p. ${page}` : '';
  if (mode === 'narrativa-direta') return `${citationAuthor(reference)} (${year}${pageText})`;
  if (mode === 'parentetica-direta') return `(${citationAuthor(reference, true)}, ${year}${pageText})`;
  if (mode === 'narrativa-indireta') return `${citationAuthor(reference)} (${year})`;
  return `(${citationAuthor(reference, true)}, ${year})`;
}

function abntAccess(reference) {
  const url = referenceUrl(reference);
  const access = fieldValue(reference, 'dataAcesso');
  return `${url ? ` Disponível em: ${url}.` : ''}${access ? ` Acesso em: ${formatReferenceDate(access)}.` : ''}`;
}

function abntDoi(reference) {
  const doi = referenceDoi(reference);
  return doi ? ` DOI: ${doi}.` : '';
}

function publicationDateText(reference) {
  return fieldValue(reference, 'dataPublicacaoCompleta') ? formatReferenceDate(reference.dataPublicacaoCompleta) : [fieldValue(reference, 'mesPublicacao'), referenceYear(reference)].filter(Boolean).join(' ') || referenceYear(reference);
}

function formatAbnt(reference) {
  const type = referenceType(reference);
  const entry = abntEntry(reference);
  const title = `${fieldValue(reference, 'titulo') || 'Sem título'}${fieldValue(reference, 'subtitulo') ? `: ${fieldValue(reference, 'subtitulo')}` : ''}`;
  const city = fieldValue(reference, 'localPublicacao') || 'S.l.';
  const publisher = fieldValue(reference, 'editora') || fieldValue(reference, 'instituicaoPublicadora') || 's.n.';
  const year = referenceYear(reference);
  const edition = fieldValue(reference, 'edicao') ? ` ${fieldValue(reference, 'edicao')}.` : '';
  const pages = fieldValue(reference, 'paginas') ? ` p. ${fieldValue(reference, 'paginas')}.` : '';
  if (type === 'artigo') {
    const journal = fieldValue(reference, 'periodico') || 'Periódico não informado';
    const place = fieldValue(reference, 'localPeriodico');
    const volume = fieldValue(reference, 'volume') ? `, v. ${fieldValue(reference, 'volume')}` : '';
    const number = fieldValue(reference, 'numero') ? `, n. ${fieldValue(reference, 'numero')}` : '';
    const pageRange = fieldValue(reference, 'paginas') ? `, p. ${fieldValue(reference, 'paginas')}` : '';
    const date = [fieldValue(reference, 'mesPublicacao'), year].filter(Boolean).join(' ') || year;
    return `${entry}. ${title}. ${journal}${place ? `, ${place}` : ''}${volume}${number}${pageRange}, ${date}.${abntDoi(reference)}${abntAccess(reference)}`;
  }
  if (type === 'evento') {
    const event = fieldValue(reference, 'nomeEvento') || 'Evento não informado';
    const eventEdition = fieldValue(reference, 'edicaoEvento') ? `${fieldValue(reference, 'edicaoEvento')}, ` : '';
    const eventYear = fieldValue(reference, 'anoEvento') || year;
    const eventPlace = fieldValue(reference, 'localEvento') || city;
    const proceedings = fieldValue(reference, 'tituloAnais') || 'Proceedings [...]';
    const proceedingsPlace = fieldValue(reference, 'localPublicacaoAnais') || city;
    const proceedingsPublisher = fieldValue(reference, 'editoraAnais') || 's.n.';
    const article = fieldValue(reference, 'numeroArtigo') ? ` Artigo ${fieldValue(reference, 'numeroArtigo')}.` : '';
    return `${entry}. ${title}. In: ${eventEdition}${event}, ${eventYear}, ${eventPlace}. ${proceedings}. ${proceedingsPlace}: ${proceedingsPublisher}, ${year}.${article}${pages}${abntDoi(reference)}${abntAccess(reference)}`;
  }
  if (type === 'capitulo') {
    const book = fieldValue(reference, 'tituloObra') || 'Obra não informada';
    const organizers = fieldValue(reference, 'organizadores') ? `${fieldValue(reference, 'organizadores')}. ` : '';
    return `${entry}. ${title}. In: ${organizers}${book}. ${city}: ${publisher}, ${year}.${pages}${abntAccess(reference)}`;
  }
  if (type === 'site') {
    const site = fieldValue(reference, 'nomeSite') || 'Site não informado';
    const date = publicationDateText(reference);
    return `${entry}. ${title}. ${site}, ${date}.${abntAccess(reference)}`;
  }
  if (type === 'documento_institucional' || type === 'relatorio') {
    const docNumber = fieldValue(reference, 'numeroDocumento') ? ` ${fieldValue(reference, 'numeroDocumento')}` : '';
    return `${entry}. ${title}${docNumber}. ${city}: ${fieldValue(reference, 'instituicaoPublicadora', 'editora') || publisher}, ${year}.${abntAccess(reference)}`;
  }
  const support = fieldValue(reference, 'suporte');
  const totalPages = fieldValue(reference, 'totalPaginas') ? ` ${fieldValue(reference, 'totalPaginas')} p.` : '';
  const collection = fieldValue(reference, 'colecao') ? ` (${fieldValue(reference, 'colecao')}).` : '';
  const translators = fieldValue(reference, 'tradutores') ? ` Tradução de ${fieldValue(reference, 'tradutores')}.` : '';
  const supportText = type === 'ebook' ? ` ${support === 'pdf' ? 'PDF' : support === 'recurso_eletronico' ? 'Recurso eletrônico' : 'E-book'}.` : '';
  return `${entry}. ${title}.${edition}${translators} ${city}: ${publisher}, ${year}.${totalPages}${collection}${supportText}${abntAccess(reference)}`;
}

function formatDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
}

function formatReferenceDate(value) {
  if (!value) return '';
  const [year, month, day] = String(value).split('-');
  const months = ['', 'jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  if (day && month && year) return `${Number(day)} ${months[Number(month)] || month} ${year}`;
  return value;
}

const REFERENCE_FIELDS = [
  'tipoReferencia', 'autoriaTipo', 'autores', 'autorInstitucional', 'organizadores', 'tradutores',
  'titulo', 'subtitulo', 'ano', 'dataPublicacaoCompleta', 'mesPublicacao', 'idioma', 'notasPublicacao',
  'edicao', 'localPublicacao', 'editora', 'isbn', 'totalPaginas', 'suporte', 'colecao',
  'periodico', 'localPeriodico', 'volume', 'numero', 'paginas', 'issn', 'doi', 'url', 'dataAcesso',
  'nomeEvento', 'edicaoEvento', 'anoEvento', 'localEvento', 'tituloAnais', 'localPublicacaoAnais', 'editoraAnais', 'numeroArtigo',
  'nomeSite', 'autorSite', 'dataAtualizacao',
  'orgaoSecundario', 'tipoDocumento', 'numeroDocumento', 'instituicaoPublicadora',
  'biblioteca', 'dataRetirada', 'dataEntrega',
  'categoria', 'status', 'tags', 'resumo', 'observacoes', 'citacoes'
];

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function referenceExportPayload() {
  return {
    schema: 'dissertar.references.v1',
    exportedAt: now(),
    fields: REFERENCE_FIELDS,
    references: state.references.map(reference => {
      const category = byId(state.referenceCategories, reference.categoriaId);
      const tags = (reference.tagIds || []).map(id => byId(state.referenceTags, id)).filter(Boolean);
      return {
        tipoReferencia: reference.tipoReferencia,
        autoriaTipo: reference.autoriaTipo,
        autorInstitucional: reference.autorInstitucional,
        organizadores: reference.organizadores,
        tradutores: reference.tradutores,
        titulo: reference.titulo,
        subtitulo: reference.subtitulo,
        autores: reference.autores,
        ano: reference.ano,
        dataPublicacaoCompleta: reference.dataPublicacaoCompleta,
        mesPublicacao: reference.mesPublicacao,
        idioma: reference.idioma,
        notasPublicacao: reference.notasPublicacao,
        edicao: reference.edicao,
        localPublicacao: reference.localPublicacao,
        editora: reference.editora,
        isbn: reference.isbn,
        totalPaginas: reference.totalPaginas,
        suporte: reference.suporte,
        colecao: reference.colecao,
        periodico: reference.periodico,
        localPeriodico: reference.localPeriodico,
        volume: reference.volume,
        numero: reference.numero,
        paginas: reference.paginas,
        issn: reference.issn,
        doi: reference.doi,
        url: reference.url,
        dataAcesso: reference.dataAcesso,
        nomeEvento: reference.nomeEvento,
        edicaoEvento: reference.edicaoEvento,
        anoEvento: reference.anoEvento,
        localEvento: reference.localEvento,
        tituloAnais: reference.tituloAnais,
        localPublicacaoAnais: reference.localPublicacaoAnais,
        editoraAnais: reference.editoraAnais,
        numeroArtigo: reference.numeroArtigo,
        nomeSite: reference.nomeSite,
        autorSite: reference.autorSite,
        dataAtualizacao: reference.dataAtualizacao,
        orgaoSecundario: reference.orgaoSecundario,
        tipoDocumento: reference.tipoDocumento,
        numeroDocumento: reference.numeroDocumento,
        instituicaoPublicadora: reference.instituicaoPublicadora,
        biblioteca: reference.biblioteca,
        dataRetirada: reference.dataRetirada,
        dataEntrega: reference.dataEntrega,
        categoria: category?.nome || '',
        status: statusName(reference.status),
        tags: tags.map(tag => tag.nome),
        resumo: reference.resumo,
        observacoes: reference.observacoes,
        citacoes: reference.citacoes || [],
        abnt: formatAbnt(reference)
      };
    })
  };
}

function referenceTemplatePayload() {
  return {
    schema: 'dissertar.references.v1',
    fields: REFERENCE_FIELDS,
    instructions: 'Preencha references com objetos usando estes campos. Tags pode ser array ou texto separado por ponto e vírgula. Autores também pode usar ponto e vírgula.',
    references: [
      {
        tipoReferencia: 'artigo',
        autoriaTipo: 'pessoa',
        titulo: 'Título da referência',
        subtitulo: '',
        autores: 'Sobrenome Nome; Sobrenome Nome',
        autorInstitucional: '',
        organizadores: '',
        tradutores: '',
        ano: '2026',
        dataPublicacaoCompleta: '',
        mesPublicacao: 'set.',
        idioma: 'pt-BR',
        notasPublicacao: '',
        edicao: '',
        localPublicacao: '',
        editora: '',
        isbn: '',
        totalPaginas: '',
        suporte: '',
        colecao: '',
        periodico: 'Nome do periódico',
        localPeriodico: 'São Paulo',
        volume: '12',
        numero: '2',
        paginas: '10-25',
        issn: '',
        doi: '10.0000/exemplo',
        url: 'https://doi.org/10.0000/exemplo',
        dataAcesso: '2026-09-11',
        nomeEvento: '',
        edicaoEvento: '',
        anoEvento: '',
        localEvento: '',
        tituloAnais: '',
        localPublicacaoAnais: '',
        editoraAnais: '',
        numeroArtigo: '',
        nomeSite: '',
        autorSite: '',
        dataAtualizacao: '',
        orgaoSecundario: '',
        tipoDocumento: '',
        numeroDocumento: '',
        instituicaoPublicadora: '',
        biblioteca: '',
        dataRetirada: '',
        dataEntrega: '',
        categoria: 'Fundamentação teórica',
        status: 'A fichar',
        tags: ['tema', 'metodologia'],
        resumo: 'Resumo/fichamento da referência.',
        observacoes: 'Notas internas.',
        citacoes: [
          { texto: 'Trecho relevante da obra.', pagina: '24', comentario: 'Usar na justificativa', tags: ['tema'] }
        ]
      }
    ]
  };
}

function splitNames(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  return String(value || '').split(/[;,]/).map(item => item.trim()).filter(Boolean);
}

function findOrCreateCategory(name) {
  const clean = String(name || '').trim();
  if (!clean) return '';
  const existing = state.referenceCategories.find(category => category.nome.toLowerCase() === clean.toLowerCase() || category.id === clean);
  if (existing) return existing.id;
  const category = { id: uid(), nome: clean, cor: PALETTE[state.referenceCategories.length % PALETTE.length] };
  state.referenceCategories.push(category);
  return category.id;
}

function findOrCreateTagIds(value) {
  return splitNames(value).map(name => {
    const existing = state.referenceTags.find(tag => tag.nome.toLowerCase() === name.toLowerCase() || tag.id === name);
    if (existing) return existing.id;
    const tag = { id: uid(), nome: name, cor: PALETTE[(state.referenceTags.length + 2) % PALETTE.length] };
    state.referenceTags.push(tag);
    return tag.id;
  });
}

function statusIdFromImport(value) {
  const clean = String(value || '').trim();
  if (!clean) return 'a_fichar';
  const existing = statusList().find(status => status.id === clean || status.nome.toLowerCase() === clean.toLowerCase());
  if (existing) return existing.id;
  const status = { id: uid(), nome: clean, cor: PALETTE[(statusList().length + 4) % PALETTE.length] };
  state.settings.statuses.push(status);
  return status.id;
}

function normalizeImportedReference(item = {}) {
  const tagSource = item.tags ?? item.tagIds ?? item.etiquetas;
  const quoteSource = item.citacoes || item.citações || item.quotes || [];
  const type = item.tipoReferencia || 'livro';
  const safeType = REFERENCE_TYPES.some(referenceType => referenceType.id === type) ? type : 'livro';
  return normalizeReferenceSchema({
    id: item.id || uid(),
    tipoReferencia: safeType,
    autoriaTipo: String(item.autoriaTipo || 'pessoa').trim(),
    titulo: String(item.titulo || item.title || '').trim() || 'Referência sem título',
    subtitulo: String(item.subtitulo || item.subtitle || '').trim(),
    autores: Array.isArray(item.autores) ? item.autores.join('; ') : String(item.autores || '').trim(),
    autorInstitucional: String(item.autorInstitucional || '').trim(),
    organizadores: String(item.organizadores || '').trim(),
    tradutores: String(item.tradutores || '').trim(),
    ano: String(item.ano || item.year || '').trim(),
    dataPublicacaoCompleta: String(item.dataPublicacaoCompleta || '').trim(),
    mesPublicacao: String(item.mesPublicacao || '').trim(),
    idioma: String(item.idioma || '').trim(),
    notasPublicacao: String(item.notasPublicacao || '').trim(),
    edicao: String(item.edicao || '').trim(),
    localPublicacao: String(item.localPublicacao || '').trim(),
    editora: String(item.editora || item.publisher || '').trim(),
    isbn: String(item.isbn || '').trim(),
    totalPaginas: String(item.totalPaginas || '').trim(),
    suporte: String(item.suporte || '').trim(),
    colecao: String(item.colecao || '').trim(),
    periodico: String(item.periodico || item.periódico || item.journal || '').trim(),
    localPeriodico: String(item.localPeriodico || '').trim(),
    volume: String(item.volume || '').trim(),
    numero: String(item.numero || item.número || item.number || '').trim(),
    paginas: String(item.paginas || item.páginas || item.pages || '').trim(),
    issn: String(item.issn || '').trim(),
    doi: String(item.doi || '').trim(),
    url: String(item.url || '').trim(),
    dataAcesso: String(item.dataAcesso || item.acesso || item.accessDate || '').trim(),
    nomeEvento: String(item.nomeEvento || '').trim(),
    edicaoEvento: String(item.edicaoEvento || '').trim(),
    anoEvento: String(item.anoEvento || '').trim(),
    localEvento: String(item.localEvento || '').trim(),
    tituloAnais: String(item.tituloAnais || '').trim(),
    localPublicacaoAnais: String(item.localPublicacaoAnais || '').trim(),
    editoraAnais: String(item.editoraAnais || '').trim(),
    numeroArtigo: String(item.numeroArtigo || '').trim(),
    nomeSite: String(item.nomeSite || '').trim(),
    autorSite: String(item.autorSite || '').trim(),
    dataAtualizacao: String(item.dataAtualizacao || '').trim(),
    orgaoSecundario: String(item.orgaoSecundario || '').trim(),
    tipoDocumento: String(item.tipoDocumento || '').trim(),
    numeroDocumento: String(item.numeroDocumento || '').trim(),
    instituicaoPublicadora: String(item.instituicaoPublicadora || '').trim(),
    biblioteca: String(item.biblioteca || item.library || '').trim(),
    dataRetirada: String(item.dataRetirada || item.retirada || item.borrowedAt || '').trim(),
    dataEntrega: String(item.dataEntrega || item.entrega || item.dueAt || '').trim(),
    categoriaId: findOrCreateCategory(item.categoria || item.category || item.categoriaId),
    status: statusIdFromImport(item.status),
    tagIds: findOrCreateTagIds(tagSource),
    resumo: String(item.resumo || item.summary || item.abstract || '').trim(),
    observacoes: String(item.observacoes || item.observações || item.notes || '').trim(),
    citacoes: Array.isArray(quoteSource) ? quoteSource.map(quote => ({
      id: quote.id || uid(),
      texto: String(quote.texto || quote.text || '').trim(),
      pagina: String(quote.pagina || quote.página || quote.page || '').trim(),
      comentario: String(quote.comentario || quote.comment || '').trim(),
      tagIds: findOrCreateTagIds(quote.tags || quote.tagIds || [])
    })).filter(quote => quote.texto) : [],
    criadoEm: item.criadoEm || now(),
    atualizadoEm: now()
  });
}

function readReferencesFromJson(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.references)) return data.references;
  if (Array.isArray(data.referencias)) return data.referencias;
  return [];
}

function importReferencesJson(data) {
  const rawReferences = readReferencesFromJson(data);
  if (!rawReferences.length) throw new Error('Sem referências');
  const imported = rawReferences.map(normalizeImportedReference);
  imported.forEach(reference => {
    const existing = state.references.find(item => item.id === reference.id);
    if (existing) Object.assign(existing, reference);
    else state.references.unshift(reference);
  });
  persist(`${imported.length} referência${imported.length === 1 ? '' : 's'} importada${imported.length === 1 ? '' : 's'}`);
}

function readSingleReferenceFromJson(data) {
  if (Array.isArray(data)) {
    if (data.length !== 1) throw new Error('Use apenas uma referência');
    return data[0];
  }
  const wrapped = readReferencesFromJson(data);
  if (wrapped.length) {
    if (wrapped.length !== 1) throw new Error('Use apenas uma referência');
    return wrapped[0];
  }
  return data;
}

function importSingleReferenceJson(data) {
  const reference = normalizeImportedReference(readSingleReferenceFromJson(data));
  const existing = state.references.find(item => item.id === reference.id);
  if (existing) Object.assign(existing, reference);
  else state.references.unshift(reference);
  persist('Referência importada');
  referenceDetail(reference);
}

function renderSelects() {
  $('#referenceType').innerHTML = options(REFERENCE_TYPES, 'Todos os tipos');
  $('#referenceCategory').innerHTML = options(state.referenceCategories, 'Todas as categorias');
  $('#referenceStatus').innerHTML = '<option value="">Todos os status</option>' + statusList().map(status => `<option value="${status.id}">${esc(status.nome)}</option>`).join('');
  $('#referenceTag').innerHTML = options(state.referenceTags, 'Todas as tags');
}

function referenceMatchesFilters(reference) {
  const query = $('#referenceSearch').value.toLowerCase();
  const type = $('#referenceType').value;
  const category = $('#referenceCategory').value;
  const status = $('#referenceStatus').value;
  const tag = $('#referenceTag').value;
  const haystack = [reference.titulo, reference.subtitulo, reference.autores, reference.autorInstitucional, reference.autorSite, reference.periodico, reference.nomeEvento, reference.nomeSite, reference.resumo, reference.observacoes].join(' ').toLowerCase();
  return (!query || haystack.includes(query)) &&
    (!type || reference.tipoReferencia === type) &&
    (!category || reference.categoriaId === category) &&
    (!status || reference.status === status) &&
    (!tag || reference.tagIds.includes(tag));
}

function sortedReferences(items) {
  const sort = $('#referenceSort')?.value || 'updated';
  return [...items].sort((a, b) => {
    if (sort === 'az') return (a.titulo || '').localeCompare(b.titulo || '');
    if (sort === 'yearDesc') return Number(referenceYear(b).replace(/\D/g, '') || 0) - Number(referenceYear(a).replace(/\D/g, '') || 0);
    if (sort === 'yearAsc') return Number(referenceYear(a).replace(/\D/g, '') || 9999) - Number(referenceYear(b).replace(/\D/g, '') || 9999);
    if (sort === 'recent') return (b.criadoEm || '').localeCompare(a.criadoEm || '');
    return (b.atualizadoEm || '').localeCompare(a.atualizadoEm || '');
  });
}

function referenceCard(reference) {
  const category = byId(state.referenceCategories, reference.categoriaId);
  const tags = reference.tagIds.map(id => byId(state.referenceTags, id)).filter(Boolean);
  return `<article class="reference-card" data-detail-reference="${reference.id}">
    <div class="reference-card-head"><label class="reference-select-wrap" title="Selecionar referência"><input type="checkbox" data-reference-select="${reference.id}" ${selectedReferenceIds.has(reference.id) ? 'checked' : ''}><span></span></label><span class="type-chip">${esc(refTypeName(reference.tipoReferencia))}</span><span class="status-chip static" ${chipStyle(statusColor(reference.status))}>${esc(statusName(reference.status))}</span></div>
    <h3>${esc(reference.titulo)}</h3>
    <p>${esc(referenceAuthorshipDisplay(reference))}${referenceYear(reference) !== 's.d.' ? `, ${esc(referenceYear(reference))}` : ''}</p>
    <div class="reference-meta">${category ? `<span class="tag" ${chipStyle(itemColor(category))}>${esc(category.nome)}</span>` : ''}${tags.slice(0, 3).map(tag => `<span class="tag" ${chipStyle(itemColor(tag))}>${esc(tag.nome)}</span>`).join('')}</div>
    <div class="reference-actions"><button class="small-btn" data-copy-abnt="${reference.id}">ABNT</button><button class="small-btn" data-edit-reference="${reference.id}">Editar</button></div>
  </article>`;
}

function referenceRow(reference) {
  return `<article class="reference-row" data-detail-reference="${reference.id}">
    <label class="reference-select-wrap" title="Selecionar referência"><input type="checkbox" data-reference-select="${reference.id}" ${selectedReferenceIds.has(reference.id) ? 'checked' : ''}><span></span></label>
    <div><button class="list-title">${esc(reference.titulo)}</button><p>${esc(referenceAuthorshipDisplay(reference))}</p></div>
    <span>${esc(refTypeName(reference.tipoReferencia))}</span>
    <span>${esc(referenceYear(reference))}</span>
    <span class="status-chip inline" ${chipStyle(statusColor(reference.status))}>${esc(statusName(reference.status))}</span>
    <button class="small-btn" data-copy-abnt="${reference.id}">ABNT</button>
  </article>`;
}

function renderReferenceBulkBar(visibleReferences = []) {
  selectedReferenceIds = new Set([...selectedReferenceIds].filter(id => byId(state.references, id)));
  const bar = $('#referenceBulkBar');
  if (!bar) return;
  const count = selectedReferenceIds.size;
  bar.classList.toggle('hidden', count === 0);
  if (!count) {
    bar.innerHTML = '';
    return;
  }
  const visibleIds = visibleReferences.map(reference => reference.id);
  const allVisibleSelected = visibleIds.length && visibleIds.every(id => selectedReferenceIds.has(id));
  bar.innerHTML = `<div class="bulk-count"><strong>${count}</strong> selecionada${count === 1 ? '' : 's'}</div>
    <button type="button" class="small-btn" data-select-visible-references="${allVisibleSelected ? 'clear' : 'select'}">${allVisibleSelected ? 'Desmarcar visíveis' : 'Selecionar visíveis'}</button>
    <select id="bulkCategorySelect">${options(state.referenceCategories, 'Categoria')}</select>
    <button type="button" class="small-btn" data-bulk-apply-category>Aplicar categoria</button>
    <select id="bulkStatusSelect"><option value="">Status</option>${statusList().map(status => `<option value="${status.id}">${esc(status.nome)}</option>`).join('')}</select>
    <button type="button" class="small-btn" data-bulk-apply-status>Aplicar status</button>
    <select id="bulkTagSelect">${options(state.referenceTags, 'Adicionar tag')}</select>
    <button type="button" class="small-btn" data-bulk-add-tag>Adicionar tag</button>
    <button type="button" class="small-btn" data-clear-reference-selection>Limpar</button>
    <button type="button" class="small-btn danger" data-bulk-delete-references>Excluir</button>`;
}

function kanbanColumns(references) {
  const group = state.settings.referenceKanbanGroup || 'status';
  if (group === 'type') {
    return REFERENCE_TYPES.map(type => ({ id: type.id, name: type.nome, color: '#6f746d', items: references.filter(ref => ref.tipoReferencia === type.id) }));
  }
  if (group === 'category') {
    return [...state.referenceCategories.map(category => ({ id: category.id, name: category.nome, color: category.cor, items: references.filter(ref => ref.categoriaId === category.id) })), { id: 'none', name: 'Sem categoria', color: '#6f746d', items: references.filter(ref => !ref.categoriaId) }];
  }
  return statusList().map(status => ({ id: status.id, name: status.nome, color: status.cor, items: references.filter(ref => ref.status === status.id) }));
}

function referenceKanban(references) {
  return `<div class="reference-kanban">${kanbanColumns(references).map(column => `<section class="kanban-column">
    <header class="kanban-head"><h3><span class="color-dot" ${chipStyle(column.color)}></span>${esc(column.name)}</h3><span class="kanban-count">${column.items.length}</span></header>
    <div class="kanban-stack">${column.items.map(reference => `<article class="kanban-card" data-detail-reference="${reference.id}"><div><h4>${esc(reference.titulo)}</h4><p>${esc(referenceAuthorshipDisplay(reference))} ${referenceYear(reference) !== 's.d.' ? `· ${esc(referenceYear(reference))}` : ''}</p></div></article>`).join('') || '<p class="kanban-empty">Nenhuma referência</p>'}</div>
  </section>`).join('')}</div>`;
}

function renderReferences() {
  const collapsed = !!state.settings.referenceSidebarCollapsed;
  $('#referenciasPage').classList.toggle('sidebar-collapsed', collapsed);
  const toggle = $('#referenceSidebarToggle');
  if (toggle) {
    const label = collapsed ? 'Expandir filtros' : 'Colapsar filtros';
    toggle.setAttribute('aria-pressed', String(collapsed));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
  }
  const refs = sortedReferences(state.references.filter(referenceMatchesFilters));
  const view = state.settings.referenceView || 'grid';
  const grid = $('#referenceGrid');
  $('#referenceSummary').innerHTML = `<strong>${refs.length}</strong> ${refs.length === 1 ? 'referência encontrada' : 'referências encontradas'}`;
  renderReferenceBulkBar(refs);
  $$('#referenceFilters [data-reference-view]').forEach(button => button.classList.toggle('active', button.dataset.referenceView === view));
  const groups = $('#referenceKanbanGroups');
  groups.classList.toggle('hidden', view !== 'kanban');
  groups.querySelectorAll('button').forEach(button => button.classList.toggle('active', button.dataset.kanbanGroup === (state.settings.referenceKanbanGroup || 'status')));
  grid.className = `reference-grid ${view}-view`;
  if (!refs.length) {
    grid.innerHTML = '<div class="empty-state"><h2>Nenhuma referência encontrada</h2><p>Ajuste filtros ou cadastre uma nova fonte.</p></div>';
  } else if (view === 'list') {
    const allSelected = refs.length && refs.every(reference => selectedReferenceIds.has(reference.id));
    grid.innerHTML = `<div class="reference-list-head"><label class="reference-select-wrap" title="Selecionar referências visíveis"><input type="checkbox" data-select-visible-references="${allSelected ? 'clear' : 'select'}" ${allSelected ? 'checked' : ''}><span></span></label><span>Título / autoria</span><span>Tipo</span><span>Ano</span><span>Status</span><span>Ações</span></div>` + refs.map(referenceRow).join('');
  } else if (view === 'kanban') {
    grid.innerHTML = referenceKanban(refs);
  } else {
    grid.innerHTML = refs.map(referenceCard).join('');
  }
}

function renderDashboard() {
  const dissertation = activeDissertation();
  const citedIds = new Set(dissertation.citations.map(citation => citation.referenceId));
  const taskRows = state.taskLists.flatMap(list => (list.items || []).map(item => ({ ...item, listId: list.id, listName: list.nome, listDate: list.data })));
  const doneTasks = taskRows.filter(item => item.done).length;
  const totalTasks = taskRows.length;
  const pendingTasks = taskRows
    .filter(item => !item.done)
    .sort((a, b) => (a.due || a.listDate || '9999-12-31').localeCompare(b.due || b.listDate || '9999-12-31'))
    .slice(0, 7);
  const stats = editorStats(dissertation);
  const taskPercent = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const citedPercent = state.references.length ? Math.round((citedIds.size / state.references.length) * 100) : 0;
  const recentReferences = sortedReferences(state.references).slice(0, 5);
  const uncitedReferences = state.references.filter(reference => !citedIds.has(reference.id)).slice(0, 4);
  const recentIdeas = state.ideas.slice(-4).reverse();
  const statusRows = statusList().map(status => {
    const count = state.references.filter(reference => reference.status === status.id).length;
    const percent = state.references.length ? Math.round((count / state.references.length) * 100) : 0;
    return { ...status, count, percent };
  });

  $('#dashboardFocus').innerHTML = `<div>
    <p class="eyebrow">DOCUMENTO ATIVO</p>
    <h2>${esc(dissertation.nome || dissertation.meta?.titulo || 'Documento sem título')}</h2>
    <p>${esc(dissertation.meta?.subtitulo || 'Continue escrevendo, revisando citações e fechando pendências.')}</p>
    <div class="dashboard-metrics">
      <div><strong>${stats.headings}</strong><span>títulos</span></div>
      <div><strong>${stats.words}</strong><span>palavras</span></div>
      <div><strong>${state.dissertations.length}</strong><span>documentos</span></div>
      <div><strong>${citedIds.size}</strong><span>fontes citadas</span></div>
    </div>
  </div>
  <div class="dashboard-focus-actions">
    <button class="btn btn-primary" data-dashboard-action="open-dissertation">Abrir editor</button>
    <button class="btn btn-secondary" data-dashboard-action="new-document">Novo documento</button>
  </div>`;

  $('#dashboardQuickActions').innerHTML = `<div class="panel-title"><div><h2>Ações rápidas</h2><p>Registre o que acabou de surgir sem sair do fluxo.</p></div></div>
    <div class="quick-action-grid">
      <button class="quick-action" data-dashboard-action="new-reference"><strong>Referência</strong><span>Cadastrar fonte</span></button>
      <button class="quick-action" data-dashboard-action="new-task"><strong>Tarefa</strong><span>Criar checklist</span></button>
      <button class="quick-action" data-dashboard-action="new-idea"><strong>Ideia</strong><span>Novo post-it</span></button>
      <button class="quick-action" data-dashboard-action="open-glossary"><strong>Glossário</strong><span>Revisar termos</span></button>
    </div>`;

  $('#dashboardWorkQueue').innerHTML = `<div class="panel-title"><div><h2>Fila de trabalho</h2><p>${doneTasks}/${totalTasks || 0} tarefas concluídas</p></div><span class="dashboard-percent">${taskPercent}%</span></div>
    <div class="dashboard-progress-line"><span style="width:${taskPercent}%"></span></div>
    <div class="dashboard-task-list">${pendingTasks.map(item => `<label class="dashboard-task"><input type="checkbox" data-toggle-task="${item.listId}:${item.id}"><span><strong>${esc(item.texto)}</strong><small>${esc(item.listName)}${item.due ? ` · ${formatDate(item.due)}` : item.listDate ? ` · ${formatDate(item.listDate)}` : ''}</small></span></label>`).join('') || '<p>Nenhuma tarefa pendente. Bonito de ver.</p>'}</div>`;

  $('#dashboardProgress').innerHTML = `<div class="panel-title"><div><h2>Referências</h2><p>${state.references.length} fontes no banco · ${citedPercent}% já citadas</p></div><button class="text-btn" data-dashboard-action="open-references">Ver banco</button></div>
    <div class="dashboard-progress-line"><span style="width:${citedPercent}%"></span></div>
    <div class="status-overview">${statusRows.map(status => `<div class="status-row"><span><i style="background:${esc(status.cor)}"></i>${esc(status.nome)}</span><strong>${status.count}</strong><div><b style="width:${status.percent}%"></b></div></div>`).join('')}</div>`;

  $('#dashboardSources').innerHTML = `<div class="panel-title"><div><h2>Fontes em foco</h2><p>Recentes e ainda não citadas.</p></div><button class="text-btn" data-dashboard-action="new-reference">Nova</button></div>
    <div class="dashboard-source-list">${recentReferences.map(reference => `<button class="dashboard-source" data-detail-reference="${reference.id}"><strong>${esc(reference.titulo)}</strong><span>${esc(referenceAuthorshipDisplay(reference))} ${referenceYear(reference) !== 's.d.' ? `· ${esc(referenceYear(reference))}` : ''}</span></button>`).join('') || '<p>Nenhuma referência cadastrada.</p>'}</div>
    ${uncitedReferences.length ? `<div class="dashboard-subsection"><h3>Para citar</h3>${uncitedReferences.map(reference => `<button class="mini-source" data-detail-reference="${reference.id}">${esc(reference.titulo)}</button>`).join('')}</div>` : ''}`;

  $('#dashboardNotes').innerHTML = `<div class="panel-title"><div><h2>Ideias e termos</h2><p>Material solto para transformar em texto.</p></div><button class="text-btn" data-dashboard-action="new-idea">Nova ideia</button></div>
    <div class="dashboard-idea-list">${recentIdeas.map(idea => `<button class="dashboard-idea" data-dashboard-action="open-ideas"><strong>${esc(idea.titulo || 'Ideia')}</strong><span>${esc(idea.texto || '').slice(0, 110)}</span></button>`).join('') || '<p>Nenhuma ideia cadastrada.</p>'}</div>
    <div class="dashboard-glossary-strip"><strong>${state.glossary.length}</strong><span>termos no glossário</span><button class="small-btn" data-dashboard-action="open-glossary">Abrir</button></div>`;
}

function renderIdeas() {
  const board = $('#ideaBoard');
  const links = state.ideaLinks.map(link => {
    const from = byId(state.ideas, link.from), to = byId(state.ideas, link.to);
    if (!from || !to) return '';
    const x1 = from.x + 95, y1 = from.y + 55, x2 = to.x + 95, y2 = to.y + 55;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;
  }).join('');
  board.innerHTML = `<svg class="idea-links">${links}</svg>` + state.ideas.map(idea => `<article class="idea-note" data-idea="${idea.id}" style="left:${idea.x}px;top:${idea.y}px;--note:${esc(idea.cor)}">
    <button class="note-edit" data-edit-idea="${idea.id}" title="Editar ideia">✎</button>
    <h3>${esc(idea.titulo || 'Ideia')}</h3><p>${esc(idea.texto || '')}</p>
  </article>`).join('');
}

function renderTasks() {
  $('#taskBoard').innerHTML = state.taskLists.map(list => {
    const done = list.items.filter(item => item.done).length;
    return `<section class="task-list panel"><header><div><h2>${esc(list.nome)}</h2><p>${done}/${list.items.length} concluídas${list.data ? ` · ${formatDate(list.data)}` : ''}</p></div><div><button class="small-btn" data-add-task="${list.id}">Item</button><button class="small-btn" data-edit-task-list="${list.id}">Editar</button></div></header>
      <div>${list.items.map(item => `<label class="task-item"><input type="checkbox" data-toggle-task="${list.id}:${item.id}" ${item.done ? 'checked' : ''}><span>${esc(item.texto)}${item.due ? `<small>${formatDate(item.due)}</small>` : ''}</span></label>`).join('') || '<p>Nenhum item nesta checklist.</p>'}</div>
    </section>`;
  }).join('') || '<div class="empty-state"><h2>Nenhuma checklist</h2><p>Crie uma checklist para acompanhar entregas e leituras.</p></div>';
}

function renderGlossary() {
  const query = ($('#glossarySearch')?.value || '').toLowerCase();
  const items = state.glossary
    .filter(item => !query || [item.termo, item.sigla, item.significado].join(' ').toLowerCase().includes(query))
    .sort((a, b) => (a.termo || '').localeCompare(b.termo || ''));
  $('#glossaryList').innerHTML = items.map(item => `<article class="glossary-card panel"><div><h2>${esc(item.termo)}</h2>${item.sigla ? `<strong>${esc(item.sigla)}</strong>` : ''}<p>${esc(item.significado)}</p>${item.notas ? `<small>${esc(item.notas)}</small>` : ''}</div><button class="small-btn" data-edit-glossary="${item.id}">Editar</button></article>`).join('') || '<div class="empty-state"><h2>Nenhum termo encontrado</h2></div>';
}

function renderSettings() {
  const statusListEl = $('#statusSettingsList');
  const categoryListEl = $('#categorySettingsList');
  const tagListEl = $('#tagSettingsList');
  if (!statusListEl || !categoryListEl || !tagListEl) return;
  statusListEl.innerHTML = statusList().map(status => `<div class="setting-row">
    <input data-setting-name="status:${status.id}" value="${esc(status.nome)}" aria-label="Nome do status">
    <input type="color" data-setting-color="status:${status.id}" value="${esc(status.cor || '#6f746d')}" aria-label="Cor do status ${esc(status.nome)}">
    <button type="button" class="small-btn danger" data-delete-status="${status.id}">Excluir</button>
  </div>`).join('');
  categoryListEl.innerHTML = state.referenceCategories.map(category => `<div class="setting-row">
    <input data-setting-name="category:${category.id}" value="${esc(category.nome)}" aria-label="Nome da categoria">
    <input type="color" data-setting-color="category:${category.id}" value="${esc(category.cor || '#2e604a')}" aria-label="Cor da categoria ${esc(category.nome)}">
    <button type="button" class="small-btn danger" data-delete-category="${category.id}">Excluir</button>
  </div>`).join('') || '<p>Nenhuma categoria criada.</p>';
  tagListEl.innerHTML = state.referenceTags.map(tag => `<div class="setting-row">
    <input data-setting-name="tag:${tag.id}" value="${esc(tag.nome)}" aria-label="Nome da tag">
    <input type="color" data-setting-color="tag:${tag.id}" value="${esc(tag.cor || '#4f7dbd')}" aria-label="Cor da tag ${esc(tag.nome)}">
    <button type="button" class="small-btn danger" data-delete-tag="${tag.id}">Excluir</button>
  </div>`).join('') || '<p>Nenhuma tag criada.</p>';
}

function headingNumbers(dissertation = activeDissertation()) {
  const counters = [0, 0, 0];
  const numbers = {};
  (dissertation.blocks || []).forEach(block => {
    if (!block.type.startsWith('heading')) return;
    const level = Number(block.type.replace('heading', '')) || 1;
    counters[level - 1] += 1;
    for (let i = level; i < counters.length; i++) counters[i] = 0;
    numbers[block.id] = counters.slice(0, level).filter(Boolean).join('.');
  });
  return numbers;
}

function referencedAbntList() {
  const dissertation = activeDissertation();
  const ids = [...new Set(dissertation.citations.map(citation => citation.referenceId))];
  return ids
    .map(id => byId(state.references, id))
    .filter(Boolean)
    .sort((a, b) => {
      const keyA = a.autoriaTipo === 'entidade' ? fieldValue(a, 'autorInstitucional') : authorLastName(authorsList(a)[0] || fieldValue(a, 'titulo'));
      const keyB = b.autoriaTipo === 'entidade' ? fieldValue(b, 'autorInstitucional') : authorLastName(authorsList(b)[0] || fieldValue(b, 'titulo'));
      const authorA = keyA.localeCompare(keyB, 'pt-BR', { sensitivity: 'base' });
      return authorA || (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR', { sensitivity: 'base' });
    })
    .map(formatAbnt);
}

function headingNumberForBlock(block, numbers = {}) {
  return numbers[block.id] ? `${numbers[block.id]} ` : '';
}

function blocksToEditorHtml(dissertation) {
  const numbers = headingNumbers(dissertation);
  return (dissertation.blocks || []).map(block => {
    if (block.type.startsWith('heading')) return `<p>${esc(headingNumberForBlock(block, numbers) + (block.text || ''))}</p>`;
    if (block.type === 'quote') return `<blockquote>${block.html || esc(block.text || '')}</blockquote>`;
    if (block.type === 'list') return `<ul>${block.html || String(block.text || '').split('\n').map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
    if (block.type === 'schedule') return scheduleTable(block.text || '');
    return `<p>${block.html || esc(block.text || '')}</p>`;
  }).join('');
}

function editorHtml(dissertation = activeDissertation()) {
  if (!dissertation.contentHtml) dissertation.contentHtml = blocksToEditorHtml(dissertation);
  dissertation.contentHtml = window.DissertationEditor?.cleanHtml(dissertation.contentHtml) || dissertation.contentHtml;
  return dissertation.contentHtml;
}

function plainTextFromHtml(html = '') {
  const element = document.createElement('div');
  element.innerHTML = html;
  return element.textContent || '';
}

function editorStats(dissertation = activeDissertation()) {
  const text = plainTextFromHtml(editorHtml(dissertation));
  const words = text.split(/\s+/).filter(Boolean).length;
  const headings = (window.DissertationEditor?.extractHeadings(editorHtml(dissertation)) || extractNumberedHeadings(editorHtml(dissertation))).length;
  return { words, headings };
}

function extractNumberedHeadings(html = '') {
  const element = document.createElement('div');
  element.innerHTML = html;
  const blockSelector = 'p, div, h1, h2, h3, h4, li, ul, ol, table, blockquote';
  const nodes = [...element.querySelectorAll('p, div, h1, h2, h3, h4, li')]
    .filter(node => ![...node.children].some(child => child.matches?.(blockSelector)));
  return nodes.map((node, index) => {
    const text = (node.textContent || '').trim();
    const match = text.match(/^(\d+(?:\.\d+)*)\s+(.+)/);
    if (!match) return null;
    const level = Math.min(match[1].split('.').length, 3);
    return { id: `heading-${index}`, number: match[1], title: match[2], level };
  }).filter(Boolean);
}

function updateEditorHeadingClasses(root) {
  if (!root) return;
  root.querySelectorAll('.dynamic-heading').forEach(node => node.classList.remove('dynamic-heading', 'level-1', 'level-2', 'level-3'));
  const blockSelector = 'p, div, h1, h2, h3, h4, li, ul, ol, table, blockquote';
  root.querySelectorAll('p, div, h1, h2, h3, h4, li').forEach(node => {
    if ([...node.children].some(child => child.matches?.(blockSelector))) return;
    const match = (node.textContent || '').trim().match(/^(\d+(?:\.\d+)*)\s+.+/);
    if (!match) return;
    node.classList.add('dynamic-heading', `level-${Math.min(match[1].split('.').length, 3)}`);
  });
}

function saveDissertationEditor(target) {
  const dissertation = activeDissertation();
  dissertation.contentHtml = window.DissertationEditor?.commit({ rerender: false }) || dissertation.contentHtml || '<p><br></p>';
  dissertation.atualizadoEm = now();
  renderDocumentOutline();
}

function focusEditor() {
  const editor = $('[data-page-body]');
  if (!editor) return null;
  editor.focus();
  return editor;
}

function storeEditorSelection() {
  window.DissertationEditor?.storeSelection();
}

function insertTextAtSavedCursor(text) {
  const html = window.DissertationEditor?.insertTextAtBookmark(text);
  if (!html) return false;
  const dissertation = activeDissertation();
  dissertation.contentHtml = html;
  dissertation.atualizadoEm = now();
  renderDocumentOutline();
  window.DissertationEditor?.render({
    container: $('#documentPage'),
    html: dissertation.contentHtml,
    references: referencedAbntList(),
    fontSize: String(state.settings.documentFontSize || '12')
  });
  Store.save();
  return true;
}

function nextHeadingNumber(level = 1) {
  const headings = extractNumberedHeadings(editorHtml());
  if (level === 1) {
    const topNumbers = headings.filter(item => item.level === 1).map(item => Number(item.number.split('.')[0])).filter(Number.isFinite);
    return String(Math.max(0, ...topNumbers) + 1);
  }
  const lastSameOrParent = [...headings].reverse().find(item => item.level <= level);
  const parts = lastSameOrParent ? lastSameOrParent.number.split('.').map(Number) : [1];
  while (parts.length < level) parts.push(0);
  parts.length = level;
  parts[level - 1] += 1;
  return parts.join('.');
}

function editorSnippet(type) {
  const snippets = {
    heading1: `<p>${nextHeadingNumber(1)} Nova seção</p>`,
    heading2: `<p>${nextHeadingNumber(2)} Nova subseção</p>`,
    heading3: `<p>${nextHeadingNumber(3)} Novo tópico</p>`,
    paragraph: '<p>Novo parágrafo.</p>',
    quote: '<blockquote>Citação longa.</blockquote>',
    schedule: scheduleTable('Atividade | Mês 1 | Mês 2\nNova atividade | X | ')
  };
  return snippets[type] || '<p>Novo texto.</p>';
}

function insertHtmlIntoEditor(html) {
  const clean = window.DissertationEditor?.insertHtmlAtSelection(html, { rerender: true });
  if (clean) {
    const dissertation = activeDissertation();
    dissertation.contentHtml = clean;
    dissertation.atualizadoEm = now();
    renderDocumentOutline();
  }
  Store.save();
}

function appendCitationToEditor(text) {
  insertTextAtSavedCursor(text);
}

function textToEditorHtml(text = '') {
  return window.DissertationEditor?.textToHtml(text) || '<p><br></p>';
}

function syncEditorPages() {
  window.DissertationEditor?.render();
}

function blockContent(block) {
  return block.html || esc(block.text || '');
}

function renderDocumentOutline() {
  const outline = $('#documentOutline');
  if (!outline) return;
  const headings = window.DissertationEditor?.extractHeadings(editorHtml()) || extractNumberedHeadings(editorHtml());
  outline.innerHTML = headings.map((heading, index) => `<button type="button" class="outline-link level-${heading.level}" data-jump-heading="${index}"><span>${esc(heading.number)}</span>${esc(heading.title || 'Sem título')}</button>`).join('') || '<p>Nenhum título numerado encontrado.</p>';
}

function renderDocumentTabs() {
  const list = $('#documentList');
  if (!list) return;
  const active = activeDissertation();
  list.innerHTML = state.dissertations.map(document => {
    const title = document.nome || document.meta?.titulo || 'Documento sem título';
    const stats = editorStats(document);
    return `<button type="button" class="document-tab ${document.id === active.id ? 'active' : ''}" data-open-document="${document.id}">
      <strong>${esc(title)}</strong><span>${stats.headings} títulos · ${stats.words} palavras</span>
    </button>`;
  }).join('');
}

function estimateBlockSize(block) {
  const textLength = String(block.text || '').length;
  if (block.type === 'schedule') return 260;
  if (block.type === 'quote') return 150 + Math.ceil(textLength / 95) * 24;
  if (block.type === 'list') return 80 + String(block.text || '').split('\n').length * 26;
  if (block.type === 'heading1') return 82;
  if (block.type === 'heading2') return 64;
  if (block.type === 'heading3') return 54;
  return 70 + Math.ceil(textLength / 115) * 26;
}

function paginateBlocks(blocks) {
  const pages = [];
  let page = [];
  let used = 0;
  const limit = 790;
  blocks.forEach(block => {
    const size = estimateBlockSize(block);
    if (page.length && used + size > limit) {
      pages.push(page);
      page = [];
      used = 0;
    }
    page.push(block);
    used += size;
  });
  if (page.length) pages.push(page);
  return pages.length ? pages : [[]];
}

function renderDissertation() {
  const dissertation = activeDissertation();
  renderDocumentTabs();
  const fontSize = String(state.settings.documentFontSize || '12');
  const fontSizeField = $('#documentFontSize');
  if (fontSizeField && fontSizeField.value !== fontSize) fontSizeField.value = fontSize;
  renderDocumentOutline();
  const references = referencedAbntList();
  window.DissertationEditor.render({
    container: $('#documentPage'),
    html: editorHtml(dissertation),
    references,
    fontSize,
    onChange(html) {
      dissertation.contentHtml = html;
      dissertation.atualizadoEm = now();
      renderDocumentOutline();
      clearTimeout(dissertationSaveTimer);
      dissertationSaveTimer = setTimeout(() => Store.save(), 450);
    }
  });
}

function blockHtml(block, numbers, citationText = '') {
  const controls = `<div class="block-actions"><button data-move-block="${block.id}:up" title="Mover para cima">↑</button><button data-move-block="${block.id}:down" title="Mover para baixo">↓</button><button data-delete-block="${block.id}" title="Excluir">×</button></div>`;
  if (block.type.startsWith('heading')) {
    const level = Number(block.type.replace('heading', '')) || 1;
    return `<div class="doc-block" id="block-${block.id}" data-block="${block.id}">${controls}<h${Math.min(level + 1, 4)} contenteditable="true" data-edit-block="${block.id}" spellcheck="true"><span contenteditable="false">${numbers[block.id]}</span> ${esc(block.text)}</h${Math.min(level + 1, 4)}></div>`;
  }
  if (block.type === 'quote') return `<div class="doc-block" id="block-${block.id}" data-block="${block.id}">${controls}<blockquote contenteditable="true" data-edit-block="${block.id}" spellcheck="true">${blockContent(block)}</blockquote>${citationText ? `<p class="inline-citation">${esc(citationText)}</p>` : ''}</div>`;
  if (block.type === 'list') return `<div class="doc-block" id="block-${block.id}" data-block="${block.id}">${controls}<ul contenteditable="true" data-edit-block="${block.id}" spellcheck="true">${block.html || String(block.text || '').split('\n').map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>`;
  if (block.type === 'schedule') return `<div class="doc-block" id="block-${block.id}" data-block="${block.id}">${controls}${scheduleTable(block.text)}</div>`;
  return `<div class="doc-block" id="block-${block.id}" data-block="${block.id}">${controls}<p contenteditable="true" data-edit-block="${block.id}" spellcheck="true">${blockContent(block)}</p>${citationText ? `<p class="inline-citation">${esc(citationText)}</p>` : ''}</div>`;
}

function scheduleTable(text = '') {
  const rows = text.split('\n').map(row => row.split('|').map(cell => cell.trim()));
  return `<table class="doc-table" contenteditable="true" data-edit-table><tbody>${rows.map((row, index) => `<tr>${row.map(cell => `<${index ? 'td' : 'th'}>${esc(cell)}</${index ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function updateBlockFromEditable(target) {
  const dissertation = activeDissertation();
  const blockId = target.closest('[data-edit-block]')?.dataset.editBlock;
  if (!blockId) return null;
  const block = byId(dissertation.blocks, blockId);
  if (!block) return null;
  if (block.type === 'list') {
    block.text = [...target.querySelectorAll('li')].map(li => li.textContent.trim()).filter(Boolean).join('\n');
    block.html = target.innerHTML.trim();
  } else if (block.type.startsWith('heading')) {
    block.text = target.textContent.replace(/^\d+(\.\d+)*\s*/, '').trim();
    delete block.html;
  } else {
    block.text = target.textContent.trim();
    block.html = target.innerHTML.trim();
  }
  dissertation.atualizadoEm = now();
  return block;
}

function updateTableFromEditable(target) {
  const dissertation = activeDissertation();
  const blockId = target.closest('[data-block]')?.dataset.block;
  const block = byId(dissertation.blocks, blockId);
  if (!block || block.type !== 'schedule') return null;
  block.text = [...target.querySelectorAll('tr')]
    .map(row => [...row.children].map(cell => cell.textContent.trim()).join(' | '))
    .join('\n');
  dissertation.atualizadoEm = now();
  return block;
}

function renderAll() {
  renderSelects();
  renderDashboard();
  renderReferences();
  renderIdeas();
  renderTasks();
  renderGlossary();
  renderSettings();
  renderDissertation();
  document.documentElement.dataset.theme = state.settings.theme;
  $('#themeToggle').textContent = state.settings.theme === 'dark' ? '☀' : '☾';
  $$('.segmented [data-theme]').forEach(button => button.classList.toggle('active', button.dataset.theme === state.settings.theme));
}

function openModal(html, type = 'modal') {
  $('#modalContent').innerHTML = html;
  $('#modalBackdrop').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  currentModal = type;
  setTimeout(() => $('#modal input, #modal textarea, #modal button')?.focus(), 20);
}

function closeModal() {
  if (currentModal === 'reference-form') reopenCitationAfterReference = false;
  $('#modalBackdrop').classList.add('hidden');
  $('#modalContent').innerHTML = '';
  document.body.style.overflow = '';
  currentModal = null;
}

function referenceForm(reference = {}, formOptions = {}) {
  reference = reference.id || reference.__fromJson
    ? normalizeReferenceSchema({ ...reference })
    : { tipoReferencia: 'livro', autoriaTipo: 'pessoa', status: 'a_fichar', tagIds: [], citacoes: [] };
  const isEdit = !!reference.id && !reference.__fromJson;
  const jsonExample = JSON.stringify(referenceTemplatePayload().references[0], null, 2);
  openModal(`<form class="form-modal" id="referenceForm">
    <p class="eyebrow">${isEdit ? 'EDITAR' : 'NOVA'} REFERÊNCIA</p><h2 id="modalTitle">${isEdit ? 'Editar referência' : 'Cadastrar referência'}</h2>
    <input type="hidden" name="id" value="${esc(reference.__fromJson ? '' : reference.id || '')}">
    <div class="reference-json-fill">
      <button type="button" class="small-btn" data-toggle-reference-json>${formOptions.showJson ? 'Ocultar JSON' : 'Preencher por JSON'}</button>
      <div class="reference-json-panel ${formOptions.showJson ? '' : 'hidden'}" data-reference-json-panel>
        <label>JSON da referência<textarea name="referenceJson" rows="10" spellcheck="false">${esc(jsonExample)}</textarea></label>
        <div class="reference-json-actions"><button type="button" class="small-btn" data-apply-reference-json>Preencher campos</button><button type="button" class="small-btn" data-download-reference-template>Baixar modelo</button></div>
      </div>
    </div>
    <div class="form-grid">
      <label>Tipo<select name="tipoReferencia">${REFERENCE_TYPES.map(type => `<option value="${type.id}" ${reference.tipoReferencia === type.id ? 'selected' : ''}>${esc(type.nome)}</option>`).join('')}</select></label>
      <label>Status<select name="status">${statusList().map(status => `<option value="${status.id}" ${reference.status === status.id ? 'selected' : ''}>${esc(status.nome)}</option>`).join('')}</select></label>
      <label>Autoria<select name="autoriaTipo">${AUTHORSHIP_TYPES.map(type => `<option value="${type.id}" ${reference.autoriaTipo === type.id ? 'selected' : ''}>${esc(type.nome)}</option>`).join('')}</select></label>
      <label class="full">Título *<input name="titulo" required value="${esc(reference.titulo || '')}"></label>
      <label class="full">Subtítulo<input name="subtitulo" value="${esc(reference.subtitulo || '')}"></label>
      <label class="full">Autores <small>Separe vários autores com ponto e vírgula.</small><input name="autores" value="${esc(reference.autores || '')}"></label>
      <label class="full">Autor institucional<input name="autorInstitucional" value="${esc(reference.autorInstitucional || '')}"></label>
      <label class="full">Organizadores<input name="organizadores" value="${esc(reference.organizadores || '')}"></label>
      <label class="full">Tradutores<input name="tradutores" value="${esc(reference.tradutores || '')}"></label>
      <label>Ano<input name="ano" inputmode="numeric" value="${esc(reference.ano || '')}"></label>
      <label>Data de publicação<input name="dataPublicacaoCompleta" type="date" value="${esc(reference.dataPublicacaoCompleta || '')}"></label>
      <label>Mês de publicação<input name="mesPublicacao" placeholder="dez." value="${esc(reference.mesPublicacao || '')}"></label>
      <label>Idioma<input name="idioma" placeholder="pt-BR" value="${esc(reference.idioma || '')}"></label>
      <label>Local de publicação<input name="localPublicacao" value="${esc(reference.localPublicacao || '')}"></label>
      <label>Editora<input name="editora" value="${esc(reference.editora || '')}"></label>
      <label>Edição<input name="edicao" placeholder="2. ed." value="${esc(reference.edicao || '')}"></label>
      <label>ISBN<input name="isbn" value="${esc(reference.isbn || '')}"></label>
      <label>Total de páginas<input name="totalPaginas" value="${esc(reference.totalPaginas || '')}"></label>
      <label>Suporte<select name="suporte">${SUPPORT_TYPES.map(type => `<option value="${type.id}" ${reference.suporte === type.id ? 'selected' : ''}>${esc(type.nome)}</option>`).join('')}</select></label>
      <label>Coleção<input name="colecao" value="${esc(reference.colecao || '')}"></label>
      <label>Periódico<input name="periodico" value="${esc(reference.periodico || '')}"></label>
      <label>Local do periódico<input name="localPeriodico" value="${esc(reference.localPeriodico || '')}"></label>
      <label>Volume<input name="volume" value="${esc(reference.volume || '')}"></label>
      <label>Número<input name="numero" value="${esc(reference.numero || '')}"></label>
      <label>Páginas<input name="paginas" value="${esc(reference.paginas || '')}"></label>
      <label>ISSN<input name="issn" value="${esc(reference.issn || '')}"></label>
      <label>DOI<input name="doi" placeholder="10.xxxx/xxxxx" value="${esc(reference.doi || '')}"></label>
      <label class="full">URL<input name="url" type="url" placeholder="https://" value="${esc(reference.url || '')}"></label>
      <label>Data de acesso<input name="dataAcesso" type="date" value="${esc(reference.dataAcesso || '')}"></label>
      <label>Nome do evento<input name="nomeEvento" value="${esc(reference.nomeEvento || '')}"></label>
      <label>Edição do evento<input name="edicaoEvento" value="${esc(reference.edicaoEvento || '')}"></label>
      <label>Ano do evento<input name="anoEvento" inputmode="numeric" value="${esc(reference.anoEvento || '')}"></label>
      <label>Local do evento<input name="localEvento" value="${esc(reference.localEvento || '')}"></label>
      <label class="full">Título dos anais<input name="tituloAnais" value="${esc(reference.tituloAnais || '')}"></label>
      <label>Local dos anais<input name="localPublicacaoAnais" value="${esc(reference.localPublicacaoAnais || '')}"></label>
      <label>Editora dos anais<input name="editoraAnais" value="${esc(reference.editoraAnais || '')}"></label>
      <label>Número do artigo<input name="numeroArtigo" value="${esc(reference.numeroArtigo || '')}"></label>
      <label>Nome do site / revista online<input name="nomeSite" value="${esc(reference.nomeSite || '')}"></label>
      <label>Autor no site<input name="autorSite" value="${esc(reference.autorSite || '')}"></label>
      <label>Data de atualização<input name="dataAtualizacao" type="date" value="${esc(reference.dataAtualizacao || '')}"></label>
      <label>Órgão secundário<input name="orgaoSecundario" value="${esc(reference.orgaoSecundario || '')}"></label>
      <label>Tipo de documento<select name="tipoDocumento">${DOCUMENT_TYPES.map(type => `<option value="${type.id}" ${reference.tipoDocumento === type.id ? 'selected' : ''}>${esc(type.nome)}</option>`).join('')}</select></label>
      <label>Número do documento<input name="numeroDocumento" value="${esc(reference.numeroDocumento || '')}"></label>
      <label>Instituição publicadora<input name="instituicaoPublicadora" value="${esc(reference.instituicaoPublicadora || '')}"></label>
      <label>Biblioteca<input name="biblioteca" value="${esc(reference.biblioteca || '')}"></label>
      <label>Data de retirada<input name="dataRetirada" type="date" value="${esc(reference.dataRetirada || '')}"></label>
      <label>Data de entrega<input name="dataEntrega" type="date" value="${esc(reference.dataEntrega || '')}"></label>
      <label>Categoria<select name="categoriaId">${options(state.referenceCategories, 'Sem categoria')}</select></label>
      <label class="full">Tags<div class="check-grid">${state.referenceTags.map(tag => `<label class="check-pill" ${chipStyle(itemColor(tag))}><input type="checkbox" name="tagIds" value="${tag.id}" ${(reference.tagIds || []).includes(tag.id) ? 'checked' : ''}><span>${esc(tag.nome)}</span></label>`).join('')}</div></label>
      <label class="full">Notas de publicação<textarea name="notasPublicacao" rows="2">${esc(reference.notasPublicacao || '')}</textarea></label>
      <label class="full">Resumo<textarea name="resumo" rows="4">${esc(reference.resumo || '')}</textarea></label>
      <label class="full">Observações<textarea name="observacoes" rows="3">${esc(reference.observacoes || '')}</textarea></label>
    </div>
    <div class="form-actions"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button class="btn btn-primary">Salvar referência</button></div>
  </form>`, 'reference-form');
  $('#referenceForm').elements.categoriaId.value = reference.categoriaId || '';
}

function singleReferenceImportForm() {
  const example = referenceTemplatePayload().references[0];
  openModal(`<form class="form-modal" id="singleReferenceImportForm">
    <p class="eyebrow">IMPORTAR REFERÊNCIA</p><h2 id="modalTitle">Importar individualmente</h2>
    <p>Cole um JSON com uma única referência. Pode ser um objeto direto ou um arquivo exportado contendo apenas uma referência em <code>references</code>.</p>
    <label class="full">JSON da referência<textarea name="json" rows="16" spellcheck="false" required>${esc(JSON.stringify(example, null, 2))}</textarea></label>
    <div class="form-actions"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button class="btn btn-primary">Importar referência</button></div>
  </form>`, 'single-reference-import');
}

function referenceDetail(reference) {
  reference = normalizeReferenceSchema({ ...reference });
  const tags = reference.tagIds.map(id => byId(state.referenceTags, id)).filter(Boolean);
  openModal(`<div class="detail-modal">
    <p class="eyebrow">${esc(refTypeName(reference.tipoReferencia))}</p><h2 id="modalTitle" class="detail-title">${esc(reference.titulo)}</h2>
    ${reference.subtitulo ? `<p class="alt-title">${esc(reference.subtitulo)}</p>` : ''}
    <div class="detail-meta-grid">
      <div class="detail-field"><small>Autoria</small>${esc(referenceAuthorshipDisplay(reference))}</div>
      <div class="detail-field"><small>Ano</small>${esc(referenceYear(reference))}</div>
      <div class="detail-field"><small>Fonte</small>${esc(reference.periodico || reference.nomeSite || reference.nomeEvento || reference.instituicaoPublicadora || reference.editora || 'Não informada')}</div>
      <div class="detail-field"><small>DOI / URL</small>${esc(reference.doi || reference.url || 'Não informado')}</div>
      <div class="detail-field"><small>Status</small><span class="status-chip inline" ${chipStyle(statusColor(reference.status))}>${esc(statusName(reference.status))}</span></div>
      <div class="detail-field"><small>Biblioteca</small>${esc(reference.biblioteca || 'Não informada')}</div>
      <div class="detail-field"><small>Retirada</small>${esc(formatDate(reference.dataRetirada) || '—')}</div>
      <div class="detail-field"><small>Entrega</small>${esc(formatDate(reference.dataEntrega) || '—')}</div>
    </div>
    <div class="detail-section"><h3>Resumo</h3><p>${esc(reference.resumo || 'Sem resumo.')}</p></div>
    <div class="detail-section"><h3>Tags</h3>${tags.map(tag => `<span class="tag" ${chipStyle(itemColor(tag))}>${esc(tag.nome)}</span>`).join('') || '<p>Sem tags</p>'}</div>
    <div class="detail-section"><h3>Citações relevantes</h3>${reference.citacoes.map(citation => `<article class="quote-item"><blockquote>${esc(citation.texto)}</blockquote><small>p. ${esc(citation.pagina || '—')} ${citation.comentario ? `· ${esc(citation.comentario)}` : ''}</small></article>`).join('') || '<p>Nenhuma citação cadastrada.</p>'}</div>
    <div class="detail-section"><h3>ABNT</h3><p class="abnt-preview">${esc(formatAbnt(reference))}</p></div>
    <div class="detail-actions"><button class="btn btn-secondary" data-add-quote="${reference.id}">Adicionar citação</button><button class="btn btn-secondary" data-copy-abnt="${reference.id}">Copiar ABNT</button><button class="btn btn-secondary" data-edit-reference="${reference.id}">Editar</button><button class="btn btn-danger-outline" data-delete-reference="${reference.id}">Excluir</button><button class="btn btn-primary" data-close>Fechar</button></div>
  </div>`, 'reference-detail');
}

function citationForm(referenceId) {
  const reference = byId(state.references, referenceId);
  openModal(`<form class="form-modal" id="quoteForm"><p class="eyebrow">CITAÇÃO</p><h2 id="modalTitle">${esc(reference.titulo)}</h2><input type="hidden" name="referenceId" value="${referenceId}">
    <label>Texto da citação<textarea name="texto" rows="4" required></textarea></label>
    <label>Página<input name="pagina" placeholder="24"></label>
    <label>Comentário<input name="comentario" placeholder="Onde usar esta citação"></label>
    <div class="form-actions"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button class="btn btn-primary">Salvar citação</button></div>
  </form>`, 'quote-form');
}

function insertCitationModal() {
  if (!state.references.length) {
    openModal(`<div class="form-modal"><p class="eyebrow">REFERÊNCIA NO TEXTO</p><h2 id="modalTitle">Nenhuma referência cadastrada</h2><p>Cadastre uma referência no banco para inserir citações narrativas ou parentéticas no documento.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-new-reference-inline>Cadastrar referência</button></div></div>`, 'insert-citation-empty');
    return;
  }
  openModal(`<form class="form-modal" id="insertCitationForm"><p class="eyebrow">REFERÊNCIA NO TEXTO</p><h2 id="modalTitle">Adicionar referência</h2>
    <label>Referência<select name="referenceId" required>${state.references.map(ref => `<option value="${ref.id}">${esc(ref.titulo)} ${ref.ano ? `(${esc(ref.ano)})` : ''}</option>`).join('')}</select></label>
    <label>Modo de citação<select name="mode"><option value="narrativa-direta">Santos (2013, p. 24)</option><option value="parentetica-direta">(SANTOS, 2013, p. 24)</option><option value="narrativa-indireta">Santos (2013)</option><option value="parentetica-indireta">(SANTOS, 2013)</option></select></label>
    <label>Página<input name="page" placeholder="24"></label>
    <p class="form-hint">A citação será inserida ao final do editor e adicionada automaticamente à lista de referências citadas.</p>
    <div class="form-actions"><button type="button" class="btn btn-secondary" data-new-reference-inline>Cadastrar nova referência</button><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button class="btn btn-primary">Inserir citação</button></div>
  </form>`, 'insert-citation');
}

function ideaForm(idea = {}) {
  openModal(`<form class="form-modal" id="ideaForm"><p class="eyebrow">IDEIA</p><h2 id="modalTitle">${idea.id ? 'Editar ideia' : 'Novo post-it'}</h2><input type="hidden" name="id" value="${esc(idea.id || '')}">
    <label>Título<input name="titulo" value="${esc(idea.titulo || '')}" required></label>
    <label>Texto<textarea name="texto" rows="4">${esc(idea.texto || '')}</textarea></label>
    <label>Cor<input type="color" name="cor" value="${esc(idea.cor || '#fff1a8')}"></label>
    <div class="form-actions"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button class="btn btn-primary">Salvar ideia</button></div>
  </form>`, 'idea-form');
}

function taskListForm(list = {}) {
  openModal(`<form class="form-modal" id="taskListForm"><p class="eyebrow">CHECKLIST</p><h2 id="modalTitle">${list.id ? 'Editar checklist' : 'Nova checklist'}</h2><input type="hidden" name="id" value="${esc(list.id || '')}">
    <label>Nome<input name="nome" value="${esc(list.nome || '')}" required></label>
    <label>Data<input type="date" name="data" value="${esc(list.data || '')}"></label>
    <div class="form-actions"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button class="btn btn-primary">Salvar checklist</button></div>
  </form>`, 'task-list-form');
}

function taskItemForm(listId) {
  openModal(`<form class="form-modal" id="taskItemForm"><p class="eyebrow">TAREFA</p><h2 id="modalTitle">Novo item</h2><input type="hidden" name="listId" value="${esc(listId)}">
    <label>Descrição<input name="texto" required></label>
    <label>Prazo<input type="date" name="due"></label>
    <label>Prioridade<select name="priority"><option value="baixa">Baixa</option><option value="media" selected>Média</option><option value="alta">Alta</option></select></label>
    <div class="form-actions"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button class="btn btn-primary">Adicionar item</button></div>
  </form>`, 'task-item-form');
}

function glossaryForm(term = {}) {
  openModal(`<form class="form-modal" id="glossaryForm"><p class="eyebrow">GLOSSÁRIO</p><h2 id="modalTitle">${term.id ? 'Editar termo' : 'Novo termo'}</h2><input type="hidden" name="id" value="${esc(term.id || '')}">
    <label>Termo<input name="termo" value="${esc(term.termo || '')}" required></label>
    <label>Sigla<input name="sigla" value="${esc(term.sigla || '')}"></label>
    <label>Significado<textarea name="significado" rows="4" required>${esc(term.significado || '')}</textarea></label>
    <label>Notas<textarea name="notas" rows="3">${esc(term.notas || '')}</textarea></label>
    <label>Referência relacionada<select name="referenceId">${options(state.references, 'Nenhuma', 'id', 'titulo')}</select></label>
    <div class="form-actions"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button class="btn btn-primary">Salvar termo</button></div>
  </form>`, 'glossary-form');
  $('#glossaryForm').elements.referenceId.value = term.referenceId || '';
}

function route() {
  const page = (location.hash.slice(1) || 'dashboard').split('/')[0];
  $$('.page').forEach(section => section.classList.add('hidden'));
  $(`#${page}Page`)?.classList.remove('hidden');
  $$('[data-page]').forEach(link => link.classList.toggle('active', link.dataset.page === page));
  $('#mainNav').classList.remove('open');
  window.scrollTo(0, 0);
}

document.addEventListener('submit', event => {
  if (event.target.id === 'authForm') return;
  event.preventDefault();
  const form = event.target;
  const fd = new FormData(form);
  if (form.id === 'referenceForm') {
    const id = fd.get('id') || uid();
    const old = byId(state.references, id);
    const data = normalizeReferenceSchema({
      id,
      tipoReferencia: fd.get('tipoReferencia'),
      status: fd.get('status'),
      autoriaTipo: fd.get('autoriaTipo'),
      titulo: String(fd.get('titulo') || '').trim(),
      subtitulo: String(fd.get('subtitulo') || '').trim(),
      autores: String(fd.get('autores') || '').trim(),
      autorInstitucional: String(fd.get('autorInstitucional') || '').trim(),
      organizadores: String(fd.get('organizadores') || '').trim(),
      tradutores: String(fd.get('tradutores') || '').trim(),
      ano: String(fd.get('ano') || '').trim(),
      dataPublicacaoCompleta: String(fd.get('dataPublicacaoCompleta') || ''),
      mesPublicacao: String(fd.get('mesPublicacao') || '').trim(),
      idioma: String(fd.get('idioma') || '').trim(),
      notasPublicacao: String(fd.get('notasPublicacao') || '').trim(),
      edicao: String(fd.get('edicao') || '').trim(),
      localPublicacao: String(fd.get('localPublicacao') || '').trim(),
      editora: String(fd.get('editora') || '').trim(),
      isbn: String(fd.get('isbn') || '').trim(),
      totalPaginas: String(fd.get('totalPaginas') || '').trim(),
      suporte: String(fd.get('suporte') || '').trim(),
      colecao: String(fd.get('colecao') || '').trim(),
      periodico: String(fd.get('periodico') || '').trim(),
      localPeriodico: String(fd.get('localPeriodico') || '').trim(),
      volume: String(fd.get('volume') || '').trim(),
      numero: String(fd.get('numero') || '').trim(),
      paginas: String(fd.get('paginas') || '').trim(),
      issn: String(fd.get('issn') || '').trim(),
      doi: String(fd.get('doi') || '').trim(),
      url: String(fd.get('url') || '').trim(),
      dataAcesso: String(fd.get('dataAcesso') || ''),
      nomeEvento: String(fd.get('nomeEvento') || '').trim(),
      edicaoEvento: String(fd.get('edicaoEvento') || '').trim(),
      anoEvento: String(fd.get('anoEvento') || '').trim(),
      localEvento: String(fd.get('localEvento') || '').trim(),
      tituloAnais: String(fd.get('tituloAnais') || '').trim(),
      localPublicacaoAnais: String(fd.get('localPublicacaoAnais') || '').trim(),
      editoraAnais: String(fd.get('editoraAnais') || '').trim(),
      numeroArtigo: String(fd.get('numeroArtigo') || '').trim(),
      nomeSite: String(fd.get('nomeSite') || '').trim(),
      autorSite: String(fd.get('autorSite') || '').trim(),
      dataAtualizacao: String(fd.get('dataAtualizacao') || ''),
      orgaoSecundario: String(fd.get('orgaoSecundario') || '').trim(),
      tipoDocumento: String(fd.get('tipoDocumento') || '').trim(),
      numeroDocumento: String(fd.get('numeroDocumento') || '').trim(),
      instituicaoPublicadora: String(fd.get('instituicaoPublicadora') || '').trim(),
      biblioteca: String(fd.get('biblioteca') || '').trim(),
      dataRetirada: String(fd.get('dataRetirada') || ''),
      dataEntrega: String(fd.get('dataEntrega') || ''),
      categoriaId: String(fd.get('categoriaId') || ''),
      tagIds: fd.getAll('tagIds'),
      resumo: String(fd.get('resumo') || '').trim(),
      observacoes: String(fd.get('observacoes') || '').trim(),
      citacoes: old?.citacoes || [],
      criadoEm: old?.criadoEm || now(),
      atualizadoEm: now()
    });
    if (old) Object.assign(old, data); else state.references.unshift(data);
    const shouldReopenCitation = reopenCitationAfterReference;
    reopenCitationAfterReference = false;
    closeModal();
    persist('Referência salva');
    if (shouldReopenCitation) insertCitationModal();
  }
  if (form.id === 'singleReferenceImportForm') {
    try {
      const data = JSON.parse(String(fd.get('json') || ''));
      closeModal();
      importSingleReferenceJson(data);
    } catch (error) {
      console.error('Falha ao importar referência individual:', error);
      toast(error.message === 'Use apenas uma referência' ? 'Cole apenas uma referência' : 'JSON inválido');
    }
  }
  if (form.id === 'quoteForm') {
    const reference = byId(state.references, fd.get('referenceId'));
    reference.citacoes.push({ id: uid(), texto: String(fd.get('texto') || '').trim(), pagina: String(fd.get('pagina') || '').trim(), comentario: String(fd.get('comentario') || '').trim(), tagIds: [] });
    reference.atualizadoEm = now();
    closeModal();
    persist('Citação cadastrada');
    referenceDetail(reference);
  }
  if (form.id === 'insertCitationForm') {
    const dissertation = activeDissertation();
    const reference = byId(state.references, fd.get('referenceId'));
    if (!reference) return toast('Selecione uma referência válida');
    const text = formatCitation(reference, fd.get('mode'), fd.get('page'));
    dissertation.citations.push({ id: uid(), referenceId: reference.id, mode: fd.get('mode'), page: String(fd.get('page') || '').trim(), text });
    appendCitationToEditor(text);
    dissertation.atualizadoEm = now();
    reference.status = 'citado';
    closeModal();
    persist('Citação inserida');
    location.hash = '#dissertacao';
  }
  if (form.id === 'ideaForm') {
    const id = fd.get('id') || uid();
    const old = byId(state.ideas, id);
    const data = { id, titulo: String(fd.get('titulo') || '').trim(), texto: String(fd.get('texto') || '').trim(), cor: fd.get('cor'), x: old?.x ?? 80, y: old?.y ?? 90, tagIds: old?.tagIds || [], criadoEm: old?.criadoEm || now(), atualizadoEm: now() };
    if (old) Object.assign(old, data); else state.ideas.push(data);
    closeModal();
    persist('Ideia salva');
  }
  if (form.id === 'taskListForm') {
    const id = fd.get('id') || uid();
    const old = byId(state.taskLists, id);
    const data = { id, nome: String(fd.get('nome') || '').trim(), data: String(fd.get('data') || ''), items: old?.items || [], criadoEm: old?.criadoEm || now(), atualizadoEm: now() };
    if (old) Object.assign(old, data); else state.taskLists.push(data);
    closeModal();
    persist('Checklist salva');
  }
  if (form.id === 'taskItemForm') {
    const list = byId(state.taskLists, fd.get('listId'));
    list.items.push({ id: uid(), texto: String(fd.get('texto') || '').trim(), due: String(fd.get('due') || ''), priority: fd.get('priority'), done: false });
    list.atualizadoEm = now();
    closeModal();
    persist('Item adicionado');
  }
  if (form.id === 'glossaryForm') {
    const id = fd.get('id') || uid();
    const old = byId(state.glossary, id);
    const data = { id, termo: String(fd.get('termo') || '').trim(), sigla: String(fd.get('sigla') || '').trim(), significado: String(fd.get('significado') || '').trim(), notas: String(fd.get('notas') || '').trim(), referenceId: String(fd.get('referenceId') || ''), criadoEm: old?.criadoEm || now(), atualizadoEm: now() };
    if (old) Object.assign(old, data); else state.glossary.push(data);
    closeModal();
    persist('Termo salvo');
  }
  if (form.id === 'dissertationMetaForm') {
    const dissertation = activeDissertation();
    Object.keys(dissertation.meta).forEach(key => dissertation.meta[key] = String(fd.get(key) || '').trim());
    dissertation.nome = dissertation.meta.titulo || dissertation.nome;
    dissertation.atualizadoEm = now();
    persist('Metadados salvos');
  }
  if (form.id === 'displayNameForm') {
    state.settings.displayName = $('#displayNameInput').value.trim();
    persist('Nome salvo');
  }
  if (form.id === 'statusForm') {
    state.settings.statuses.push({ id: uid(), nome: String(fd.get('nome') || '').trim(), cor: String(fd.get('cor') || '#2e604a') });
    form.reset();
    persist('Status adicionado');
  }
  if (form.id === 'categoryForm') {
    state.referenceCategories.push({ id: uid(), nome: String(fd.get('nome') || '').trim(), cor: String(fd.get('cor') || '#4f7dbd') });
    form.reset();
    persist('Categoria adicionada');
  }
  if (form.id === 'tagForm') {
    state.referenceTags.push({ id: uid(), nome: String(fd.get('nome') || '').trim(), cor: String(fd.get('cor') || '#b9822f') });
    form.reset();
    persist('Tag adicionada');
  }
});

document.addEventListener('click', event => {
  const dashboardAction = event.target.closest('[data-dashboard-action]')?.dataset.dashboardAction;
  if (dashboardAction) {
    if (dashboardAction === 'open-dissertation') location.hash = '#dissertacao';
    if (dashboardAction === 'open-references') location.hash = '#referencias';
    if (dashboardAction === 'open-ideas') location.hash = '#ideias';
    if (dashboardAction === 'open-glossary') location.hash = '#glossario';
    if (dashboardAction === 'new-reference') referenceForm();
    if (dashboardAction === 'new-task') taskListForm();
    if (dashboardAction === 'new-idea') ideaForm();
    if (dashboardAction === 'new-document') $('#addDocumentBtn')?.click();
    return;
  }
  const detailReference = event.target.closest('[data-detail-reference]')?.dataset.detailReference;
  if (detailReference && !event.target.closest('[data-edit-reference],[data-copy-abnt],[data-reference-select],.reference-select-wrap')) return referenceDetail(byId(state.references, detailReference));
  const editReference = event.target.closest('[data-edit-reference]')?.dataset.editReference;
  if (editReference) return referenceForm(byId(state.references, editReference));
  const copyAbnt = event.target.closest('[data-copy-abnt]')?.dataset.copyAbnt;
  if (copyAbnt) {
    const text = formatAbnt(byId(state.references, copyAbnt));
    navigator.clipboard?.writeText(text).then(() => toast('Referência ABNT copiada')).catch(() => prompt('Copie a referência:', text));
    return;
  }
  const addQuote = event.target.closest('[data-add-quote]')?.dataset.addQuote;
  if (addQuote) return citationForm(addQuote);
  const deleteReference = event.target.closest('[data-delete-reference]')?.dataset.deleteReference;
  if (deleteReference && confirm('Excluir esta referência?')) {
    state.references = state.references.filter(ref => ref.id !== deleteReference);
    selectedReferenceIds.delete(deleteReference);
    state.dissertations.forEach(document => document.citations = (document.citations || []).filter(citation => citation.referenceId !== deleteReference));
    closeModal();
    return persist('Referência excluída');
  }
  const selectVisible = event.target.closest('[data-select-visible-references]')?.dataset.selectVisibleReferences;
  if (selectVisible) {
    const refs = sortedReferences(state.references.filter(referenceMatchesFilters));
    refs.forEach(reference => selectVisible === 'clear' ? selectedReferenceIds.delete(reference.id) : selectedReferenceIds.add(reference.id));
    renderReferences();
    return;
  }
  if (event.target.closest('[data-clear-reference-selection]')) {
    selectedReferenceIds.clear();
    renderReferences();
    return;
  }
  if (event.target.closest('[data-bulk-apply-category]')) {
    const categoryId = $('#bulkCategorySelect')?.value || '';
    if (!categoryId) return toast('Escolha uma categoria');
    state.references.forEach(reference => { if (selectedReferenceIds.has(reference.id)) { reference.categoriaId = categoryId; reference.atualizadoEm = now(); } });
    return persist('Categoria aplicada');
  }
  if (event.target.closest('[data-bulk-apply-status]')) {
    const status = $('#bulkStatusSelect')?.value || '';
    if (!status) return toast('Escolha um status');
    state.references.forEach(reference => { if (selectedReferenceIds.has(reference.id)) { reference.status = status; reference.atualizadoEm = now(); } });
    return persist('Status aplicado');
  }
  if (event.target.closest('[data-bulk-add-tag]')) {
    const tagId = $('#bulkTagSelect')?.value || '';
    if (!tagId) return toast('Escolha uma tag');
    state.references.forEach(reference => {
      if (selectedReferenceIds.has(reference.id)) {
        reference.tagIds = Array.from(new Set([...(reference.tagIds || []), tagId]));
        reference.atualizadoEm = now();
      }
    });
    return persist('Tag adicionada');
  }
  if (event.target.closest('[data-bulk-delete-references]')) {
    const ids = [...selectedReferenceIds];
    if (!ids.length) return;
    if (!confirm(`Excluir ${ids.length} referência${ids.length === 1 ? '' : 's'} selecionada${ids.length === 1 ? '' : 's'}?`)) return;
    state.references = state.references.filter(reference => !selectedReferenceIds.has(reference.id));
    state.dissertations.forEach(document => document.citations = (document.citations || []).filter(citation => !selectedReferenceIds.has(citation.referenceId)));
    selectedReferenceIds.clear();
    return persist('Referências excluídas');
  }
  const openDocument = event.target.closest('[data-open-document]')?.dataset.openDocument;
  if (openDocument) {
    state.activeDissertationId = openDocument;
    state.dissertation = activeDissertation();
    Store.save();
    renderDissertation();
    return;
  }
  if (event.target.closest('[data-close]')) return closeModal();
  if (event.target.closest('[data-new-reference-inline]')) {
    reopenCitationAfterReference = true;
    return referenceForm();
  }
  if (event.target.closest('[data-toggle-reference-json]')) {
    const panel = $('[data-reference-json-panel]');
    panel?.classList.toggle('hidden');
    const button = event.target.closest('[data-toggle-reference-json]');
    if (button && panel) button.textContent = panel.classList.contains('hidden') ? 'Preencher por JSON' : 'Ocultar JSON';
    return;
  }
  if (event.target.closest('[data-download-reference-template]')) {
    downloadJson('modelo-referencia-individual-dissertar.json', referenceTemplatePayload().references[0]);
    return toast('Modelo individual baixado');
  }
  if (event.target.closest('[data-apply-reference-json]')) {
    const form = $('#referenceForm');
    try {
      const parsed = JSON.parse(form.elements.referenceJson.value);
      const reference = normalizeImportedReference(readSingleReferenceFromJson(parsed));
      reference.__fromJson = true;
      referenceForm(reference, { showJson: true });
      toast('Campos preenchidos pelo JSON');
    } catch (error) {
      console.error('Falha ao preencher referência por JSON:', error);
      toast(error.message === 'Use apenas uma referência' ? 'Cole apenas uma referência' : 'JSON inválido');
    }
    return;
  }
  const referenceView = event.target.closest('[data-reference-view]')?.dataset.referenceView;
  if (referenceView) { state.settings.referenceView = referenceView; Store.save(); return renderReferences(); }
  const kanbanGroup = event.target.closest('[data-kanban-group]')?.dataset.kanbanGroup;
  if (kanbanGroup) { state.settings.referenceKanbanGroup = kanbanGroup; Store.save(); return renderReferences(); }
  const editIdea = event.target.closest('[data-edit-idea]')?.dataset.editIdea;
  if (editIdea) return ideaForm(byId(state.ideas, editIdea));
  const editTaskList = event.target.closest('[data-edit-task-list]')?.dataset.editTaskList;
  if (editTaskList) return taskListForm(byId(state.taskLists, editTaskList));
  const addTask = event.target.closest('[data-add-task]')?.dataset.addTask;
  if (addTask) return taskItemForm(addTask);
  const toggleTask = event.target.closest('[data-toggle-task]')?.dataset.toggleTask;
  if (toggleTask) {
    const [listId, itemId] = toggleTask.split(':');
    const item = byId(byId(state.taskLists, listId)?.items || [], itemId);
    if (item) item.done = !item.done;
    return persist('Tarefa atualizada');
  }
  const editGlossary = event.target.closest('[data-edit-glossary]')?.dataset.editGlossary;
  if (editGlossary) return glossaryForm(byId(state.glossary, editGlossary));
  const deleteStatus = event.target.closest('[data-delete-status]')?.dataset.deleteStatus;
  if (deleteStatus && statusList().length > 1 && confirm('Excluir este status? Referências nele voltarão para "A fichar".')) {
    state.settings.statuses = statusList().filter(status => status.id !== deleteStatus);
    state.references.forEach(reference => { if (reference.status === deleteStatus) reference.status = 'a_fichar'; });
    return persist('Status excluído');
  }
  const deleteCategory = event.target.closest('[data-delete-category]')?.dataset.deleteCategory;
  if (deleteCategory && confirm('Excluir esta categoria? As referências permanecerão sem categoria.')) {
    state.referenceCategories = state.referenceCategories.filter(category => category.id !== deleteCategory);
    state.references.forEach(reference => { if (reference.categoriaId === deleteCategory) reference.categoriaId = ''; });
    return persist('Categoria excluída');
  }
  const deleteTag = event.target.closest('[data-delete-tag]')?.dataset.deleteTag;
  if (deleteTag && confirm('Excluir esta tag? Ela será removida das referências.')) {
    state.referenceTags = state.referenceTags.filter(tag => tag.id !== deleteTag);
    state.references.forEach(reference => reference.tagIds = (reference.tagIds || []).filter(id => id !== deleteTag));
    return persist('Tag excluída');
  }
  const addBlock = event.target.closest('[data-add-block]')?.dataset.addBlock;
  if (addBlock) {
    insertHtmlIntoEditor(editorSnippet(addBlock));
    return toast('Trecho inserido');
  }
  const editorCommand = event.target.closest('[data-editor-command]')?.dataset.editorCommand;
  if (editorCommand) {
    const html = window.DissertationEditor?.execCommand(editorCommand);
    if (html) {
      const dissertation = activeDissertation();
      dissertation.contentHtml = html;
      dissertation.atualizadoEm = now();
      renderDocumentOutline();
    }
    Store.save();
    focusEditor();
    return;
  }
  const jumpHeading = event.target.closest('[data-jump-heading]')?.dataset.jumpHeading;
  if (jumpHeading) {
    const nodes = [...document.querySelectorAll('.doc-page-body p, .doc-page-body div, .doc-page-body h1, .doc-page-body h2, .doc-page-body h3, .doc-page-body h4, .doc-page-body li')];
    const headingNodes = nodes.filter(node => /^\d+(?:\.\d+)*\s+.+/.test((node.textContent || '').trim()));
    headingNodes[Number(jumpHeading)]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
});

document.addEventListener('input', event => {
  if (['referenceSearch', 'referenceType', 'referenceCategory', 'referenceStatus', 'referenceTag', 'referenceSort'].includes(event.target.id)) renderReferences();
  if (event.target.id === 'glossarySearch') renderGlossary();
});

document.addEventListener('change', event => {
  const selectedReference = event.target.closest('[data-reference-select]')?.dataset.referenceSelect;
  if (selectedReference) {
    if (event.target.checked) selectedReferenceIds.add(selectedReference);
    else selectedReferenceIds.delete(selectedReference);
    renderReferences();
    return;
  }
  const selectVisible = event.target.closest('[data-select-visible-references]')?.dataset.selectVisibleReferences;
  if (selectVisible) {
    const refs = sortedReferences(state.references.filter(referenceMatchesFilters));
    refs.forEach(reference => selectVisible === 'clear' ? selectedReferenceIds.delete(reference.id) : selectedReferenceIds.add(reference.id));
    renderReferences();
    return;
  }
  if (['referenceType', 'referenceCategory', 'referenceStatus', 'referenceTag', 'referenceSort'].includes(event.target.id)) renderReferences();
  const settingName = event.target.dataset.settingName;
  const settingColor = event.target.dataset.settingColor;
  const target = settingName || settingColor;
  if (target) {
    const [kind, id] = target.split(':');
    const collection = kind === 'status' ? state.settings.statuses : kind === 'category' ? state.referenceCategories : state.referenceTags;
    const item = byId(collection, id);
    if (item) item[settingName ? 'nome' : 'cor'] = event.target.value.trim();
    return persist('Personalização salva');
  }
  if (event.target.id === 'documentFontSize') {
    state.settings.documentFontSize = String(event.target.value || '12');
    Store.save();
    renderDissertation();
    return;
  }
});

document.addEventListener('selectionchange', () => {
  storeEditorSelection();
});

document.addEventListener('blur', event => {
  if (event.target.closest('[data-page-body]')) renderDocumentTabs();
}, true);

document.addEventListener('paste', event => {
  if (event.target.closest?.('[data-page-body]')) return;
});

document.addEventListener('mousedown', event => {
  if (event.target.closest('[data-editor-command]')) {
    event.preventDefault();
    return;
  }
  const note = event.target.closest('.idea-note');
  if (!note || event.target.closest('button')) return;
  const idea = byId(state.ideas, note.dataset.idea);
  draggingIdea = { idea, startX: event.clientX, startY: event.clientY, x: idea.x, y: idea.y };
  note.classList.add('dragging');
});

document.addEventListener('mousemove', event => {
  if (!draggingIdea) return;
  draggingIdea.idea.x = Math.max(8, draggingIdea.x + event.clientX - draggingIdea.startX);
  draggingIdea.idea.y = Math.max(8, draggingIdea.y + event.clientY - draggingIdea.startY);
  renderIdeas();
});

document.addEventListener('mouseup', () => {
  if (!draggingIdea) return;
  draggingIdea.idea.atualizadoEm = now();
  draggingIdea = null;
  Store.save();
  renderIdeas();
});

window.addEventListener('hashchange', route);
$('#mobileMenu').onclick = () => { $('#mainNav').classList.toggle('open'); $('#mobileMenu').setAttribute('aria-expanded', $('#mainNav').classList.contains('open')); };
$('#addReferenceBtn').onclick = () => referenceForm();
$('#clearReferenceFilters').onclick = () => { ['referenceSearch', 'referenceType', 'referenceCategory', 'referenceStatus', 'referenceTag'].forEach(id => $('#' + id).value = ''); $('#referenceSort').value = 'updated'; renderReferences(); };
$('#referenceFilterToggle').onclick = () => $('#referenceFilters').classList.toggle('open');
$('#referenceSidebarToggle').onclick = () => { state.settings.referenceSidebarCollapsed = !state.settings.referenceSidebarCollapsed; Store.save(); renderReferences(); };
$('#addIdeaBtn').onclick = () => ideaForm();
$('#addTaskListBtn').onclick = () => taskListForm();
$('#addGlossaryBtn').onclick = () => glossaryForm();
$('#insertCitationBtn').onclick = () => { storeEditorSelection(); insertCitationModal(); };
$('#addDocumentBtn').onclick = () => {
  const name = prompt('Nome do novo documento:', 'Novo documento');
  if (!name) return;
  const document = defaultDissertation();
  document.nome = name.trim();
  state.dissertations.push(document);
  state.activeDissertationId = document.id;
  persist('Documento criado');
};
$('#duplicateDocumentBtn').onclick = () => {
  const current = activeDissertation();
  const name = prompt('Nome da cópia:', `${current.nome || current.meta.titulo || 'Documento'} - cópia`);
  if (!name) return;
  const copy = JSON.parse(JSON.stringify(current));
  copy.id = uid();
  copy.nome = name.trim();
  copy.meta.titulo = name.trim();
  copy.criadoEm = now();
  copy.atualizadoEm = now();
  state.dissertations.push(copy);
  state.activeDissertationId = copy.id;
  persist('Documento duplicado');
};
$('#deleteDocumentBtn').onclick = () => {
  const current = activeDissertation();
  if (state.dissertations.length <= 1) return toast('Mantenha pelo menos um documento');
  if (!confirm(`Excluir "${current.nome || current.meta.titulo}"?`)) return;
  state.dissertations = state.dissertations.filter(document => document.id !== current.id);
  state.activeDissertationId = state.dissertations[0].id;
  persist('Documento excluído');
};
$('#modalClose').onclick = closeModal;
$('#modalBackdrop').onclick = event => { if (event.target === event.currentTarget) closeModal(); };
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });
$('#themeToggle').onclick = () => { state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark'; persist('Tema atualizado'); };
$$('.segmented [data-theme]').forEach(button => button.onclick = () => { state.settings.theme = button.dataset.theme; persist('Tema atualizado'); });
$('#importSingleReferenceBtn').onclick = () => referenceForm({}, { showJson: true });
$('#exportReferencesBtn').onclick = () => {
  downloadJson(`dissertar-referencias-${today()}.json`, referenceExportPayload());
  toast('Referências exportadas');
};
$('#downloadReferenceTemplateBtn').onclick = () => {
  downloadJson('modelo-referencias-dissertar.json', referenceTemplatePayload());
  toast('Modelo JSON baixado');
};
$('#importReferencesInput').onchange = event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      importReferencesJson(JSON.parse(reader.result));
    } catch (error) {
      console.error('Falha ao importar referências:', error);
      toast('JSON de referências inválido');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
};
$('#exportBtn').onclick = () => {
  downloadJson(`dissertar-backup-${today()}.json`, state);
  toast('Backup exportado');
};
$('#importInput').onchange = event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Store.valid(data)) throw Error();
      if (confirm('Importar este backup e substituir os dados atuais?')) {
        state = normalizeStateData(data);
        persist('Projeto importado');
      }
    } catch {
      toast('Arquivo inválido');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
};
$('#resetBtn').onclick = () => { if (confirm('Restaurar os dados de demonstração?')) { state = demo(); persist('Dados restaurados'); } };

function authMessage(error) {
  const messages = {
    'auth/email-already-in-use': 'Este e-mail já possui uma conta.',
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    'auth/network-request-failed': 'Não foi possível conectar ao Firebase.'
  };
  return messages[error.code] || 'Não foi possível concluir. Verifique os dados e tente novamente.';
}

function setAuthMode(mode) {
  authMode = mode;
  const register = mode === 'register';
  $('#authTitle').textContent = register ? 'Crie seu projeto' : 'Entre no seu projeto';
  $('#authSubtitle').textContent = register ? 'Cadastre-se para manter sua dissertação sincronizada.' : 'Referências, ideias, tarefas e texto em qualquer dispositivo.';
  $('#authSubmit').textContent = register ? 'Criar conta' : 'Entrar';
  $('#authSwitch').textContent = register ? 'Já tenho uma conta — entrar' : 'Ainda não tenho conta — cadastrar';
  $('#authPassword').autocomplete = register ? 'new-password' : 'current-password';
  $('#authError').classList.add('hidden');
}

$('#authSwitch').onclick = () => setAuthMode(authMode === 'login' ? 'register' : 'login');
$('#authForm').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('#authSubmit'), errorBox = $('#authError');
  const email = $('#authEmail').value.trim(), password = $('#authPassword').value;
  button.disabled = true;
  button.textContent = authMode === 'register' ? 'Criando conta…' : 'Entrando…';
  errorBox.classList.add('hidden');
  try {
    if (authMode === 'register') await FirebaseBackend.register(email, password);
    else await FirebaseBackend.login(email, password);
  } catch (error) {
    errorBox.textContent = authMessage(error);
    errorBox.classList.remove('hidden');
    button.disabled = false;
    button.textContent = authMode === 'register' ? 'Criar conta' : 'Entrar';
  }
});
$('#logoutBtn').onclick = () => FirebaseBackend.logout();

FirebaseBackend.auth.onAuthStateChanged(async user => {
  if (!user) {
    syncReady = false;
    $('#appShell').classList.add('hidden');
    $('#authScreen').classList.remove('hidden');
    $('#authForm').reset();
    setAuthMode('login');
    return;
  }
  $('#authSubmit').disabled = false;
  $('#userEmail').textContent = user.email || '';
  $('#authScreen').classList.add('hidden');
  $('#appShell').classList.remove('hidden');
  try {
    const cloudState = await FirebaseBackend.loadState(user.uid);
    if (Store.valid(cloudState)) {
      state = normalizeStateData(cloudState);
      localStorage.setItem(Store.key, JSON.stringify(state));
    } else {
      await FirebaseBackend.saveState(user.uid, state);
    }
    syncReady = true;
    renderAll();
    route();
    $('#displayNameInput').value = state.settings.displayName || '';
    toast('Projeto sincronizado');
  } catch (error) {
    console.error('Erro ao carregar projeto:', error);
    syncReady = true;
    renderAll();
    route();
    $('#displayNameInput').value = state.settings.displayName || '';
    toast('Usando dados salvos neste dispositivo');
  }
});

renderAll();
route();
