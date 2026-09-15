const groups = {
  livro: ['edicao','isbn','totalPaginas','suporte','colecao','tradutores','editora'],
  ebook: ['edicao','isbn','totalPaginas','suporte','colecao','tradutores','editora'],
  artigo: ['periodico','localPeriodico','volume','numero','paginas','issn','mesPublicacao'],
  evento: ['nomeEvento','edicaoEvento','anoEvento','localEvento','tituloAnais','localPublicacaoAnais','editoraAnais','numeroArtigo','paginas'],
  site: ['nomeSite','autorSite','dataAtualizacao','dataPublicacaoCompleta'],
  documento_institucional: ['orgaoSecundario','tipoDocumento','numeroDocumento','instituicaoPublicadora'],
  relatorio: ['orgaoSecundario','tipoDocumento','numeroDocumento','instituicaoPublicadora'],
  capitulo: ['tituloObra','organizadores','edicao','editora','paginas','isbn'],
  dissertacao: ['instituicaoAcademica','curso','grau','totalPaginas'],
  tese: ['instituicaoAcademica','curso','grau','totalPaginas'],
  tcc: ['instituicaoAcademica','curso','grau','totalPaginas'],
  legislacao: ['jurisdicao','tipoDocumento','numeroDocumento','dataPublicacaoCompleta','veiculoPublicacao'],
  outro: ['editora','suporte','dataPublicacaoCompleta','paginas']
};
export function configureReferenceForm(form) {
  const specific = new Set(Object.values(groups).flat());
  const update = () => {
    const fields = groups[form.elements.tipoReferencia.value] || groups.outro;
    for (const field of specific) {
      const input = form.elements[field];
      if (input) input.closest('label').hidden = !fields.includes(field);
    }
    const entity = form.elements.autoriaTipo.value === 'entidade';
    const none = form.elements.autoriaTipo.value === 'sem_autor';
    form.elements.autores.closest('label').hidden = entity || none;
    form.elements.autorInstitucional.closest('label').hidden = !entity;
  };
  form.elements.tipoReferencia.addEventListener('change', update);
  form.elements.autoriaTipo.addEventListener('change', update);
  update();
}
