import { createIcons, Undo2, Redo2, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, IndentIncrease, IndentDecrease, Link, RemoveFormatting, Search, BookOpen, Library, ChevronUp, ChevronDown, X, PanelLeftClose } from 'lucide';
const icons = { Undo2, Redo2, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, IndentIncrease, IndentDecrease, Link, RemoveFormatting, Search, BookOpen, Library, ChevronUp, ChevronDown, X, PanelLeftClose };
const button = (action, title, icon) => `<button type="button" data-academic-command="${action}" title="${title}" aria-label="${title}"><i data-lucide="${icon}"></i></button>`;
export function mountToolbar(root, api) {
  root.innerHTML = `<div class="academic-toolbar" role="toolbar" aria-label="Formatação do documento">
    ${button('sidebar', 'Mostrar ou ocultar documentos', 'panel-left-close')}
    ${button('undo', 'Desfazer (Ctrl+Z)', 'undo-2')}${button('redo', 'Refazer (Ctrl+Y)', 'redo-2')}
    <select data-academic-control="style" aria-label="Estilo de parágrafo"><option value="paragraph">Texto normal</option><option value="heading1">Título 1</option><option value="heading2">Título 2</option><option value="heading3">Título 3</option><option value="quote">Citação longa</option><option value="caption">Legenda</option><option value="reference">Referência</option></select>
    <select data-academic-control="font" aria-label="Fonte"><option selected>Times New Roman</option><option>Arial</option><option>Calibri</option></select>
    <select data-academic-control="size" aria-label="Tamanho da fonte">${[8,9,10,11,12,14,16,18,20,24,28,36].map(n => `<option ${n === 12 ? 'selected' : ''}>${n}</option>`).join('')}</select>
    ${button('bold','Negrito (Ctrl+B)','bold')}${button('italic','Itálico (Ctrl+I)','italic')}${button('underline','Sublinhado (Ctrl+U)','underline')}${button('strike','Tachado','strikethrough')}
    <input type="color" data-academic-control="color" aria-label="Cor do texto" title="Cor do texto" value="#000000">
    ${button('left','Alinhar à esquerda','align-left')}${button('center','Centralizar','align-center')}${button('right','Alinhar à direita','align-right')}${button('justify','Justificar','align-justify')}
    ${button('bullet','Lista com marcadores','list')}${button('numbered','Lista numerada','list-ordered')}${button('outdent','Diminuir recuo','indent-decrease')}${button('indent','Aumentar recuo','indent-increase')}
    <select data-academic-control="spacing" aria-label="Espaçamento entre linhas"><option value="1">1,0</option><option value="1.5" selected>1,5</option><option value="2">2,0</option></select>
    ${button('link','Inserir link','link')}${button('clear','Limpar formatação','remove-formatting')}${button('find','Localizar (Ctrl+F)','search')}
    <select data-academic-control="pageNumber" aria-label="Número de página"><option value="bottom">Número no rodapé</option><option value="top">Número no cabeçalho</option><option value="none">Sem número</option></select>
    <button type="button" data-academic-command="citation" class="academic-reference-btn"><i data-lucide="book-open"></i>Referência</button>
    ${button('library','Gerenciar referências','library')}
  </div>
  <div class="academic-find" hidden><input type="search" aria-label="Localizar no documento" placeholder="Localizar no documento"><output>0 resultados</output>${button('previous','Resultado anterior','chevron-up')}${button('next','Próximo resultado','chevron-down')}${button('closeFind','Fechar busca','x')}</div>`;
  createIcons({ icons, root });
  root.addEventListener('pointerdown', event => {
    const button = event.target.closest('button');
    if (!button) return;
    event.preventDefault();
    api.storeSelection();
    const command = button.dataset.academicCommand;
    if (command) api.command(command);
  });
  root.addEventListener('change', event => {
    const control = event.target.dataset.academicControl;
    if (control) api.control(control, event.target.value);
  });
  root.querySelector('.academic-find input').addEventListener('input', event => api.find(event.target.value));
}

export function updateToolbar(root, editor) {
  for (const mark of ['bold','italic','underline','strike']) {
    root.querySelector(`[data-academic-command="${mark}"]`)?.setAttribute('aria-pressed', editor.isActive(mark));
  }
  for (const align of ['left','center','right','justify']) root.querySelector(`[data-academic-command="${align}"]`)?.setAttribute('aria-pressed', editor.isActive({ textAlign: align }));
  const text = editor.getAttributes('textStyle');
  const controls = { font: text.fontFamily || 'Arial', size: String(text.fontSize || '12').replace('pt',''), style: editor.isActive('heading') ? `heading${editor.getAttributes('heading').level}` : editor.isActive('blockquote') ? 'quote' : editor.getAttributes('paragraph').academicStyle || 'paragraph', spacing: editor.getAttributes('paragraph').lineHeight || '1.5' };
  for (const [key,value] of Object.entries(controls)) {
    const el = root.querySelector(`[data-academic-control="${key}"]`);
    if (el && document.activeElement !== el) el.value = value;
  }
}
