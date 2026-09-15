const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('Academic editor: editing, history, linked citations, pagination and serialization', async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.setContent('<div id="dissertacaoPage"><div class="word-shell"><div class="word-workspace"><input id="academicDocumentTitle"><span id="academicSaveState"></span><div id="academicToolbar"></div><div class="word-page-wrap"><div id="documentPage"></div></div><span id="academicStats"></span></div><nav id="documentOutline"></nav></div></div>');
    await page.addStyleTag({ path: path.join(root, 'academic-editor/editor.css') });
    await page.addScriptTag({ path: path.join(root, 'dissertation-editor.js') });
    await page.evaluate(() => {
      window.references = [{id:'norman',autores:'Donald Norman',ano:'2026',titulo:'Design'}, {id:'nielsen',autores:'Jakob Nielsen',ano:'1993',titulo:'Usability'}, {id:'openai',autoriaTipo:'entidade',autorInstitucional:'OpenAI',ano:'2026',titulo:'Report'}];
      window.saved = null;
      window.options = {container: document.querySelector('#documentPage'), document:{id:'test',nome:'Teste',contentHtml:'<p>Este princípio é importante aqui.</p>'},references,
        formatBibliography:r => `${r.autores || r.autorInstitucional}. ${r.titulo}. ${r.ano}.`, onChange:data => { window.latest = data; }, onSave:() => {window.saved = window.latest;}};
      DissertationEditor.render(options);
    });
    await page.locator('.academic-prose').click();
    await page.evaluate(() => DissertationEditor.getEditor().commands.setTextSelection(28));
    await page.keyboard.type('muito ');
    await page.keyboard.press('Control+z');
    assert(!(await page.locator('.academic-prose').innerText()).includes('muito'));
    await page.keyboard.press('Control+y');
    assert((await page.locator('.academic-prose').innerText()).includes('muito'));
    await page.evaluate(() => {
      const ed = DissertationEditor.getEditor();
      ed.commands.setTextSelection(6); ed.commands.focus(); DissertationEditor.storeSelection();
    });
    await page.locator('#academicDocumentTitle').focus();
    await page.evaluate(() => DissertationEditor.insertCitation({id:'c1',referenceId:'norman',mode:'parentetica'}));
    assert((await page.locator('.academic-prose > p').first().innerText()).startsWith('Este (NORMAN, 2026)'));
    await page.evaluate(() => {
      DissertationEditor.getEditor().commands.focus('end');
      DissertationEditor.storeSelection();
      DissertationEditor.insertCitation({id:'c2',referenceId:'nielsen',mode:'narrativa'});
      DissertationEditor.insertCitation({id:'c3',referenceId:'openai',mode:'parentetica'});
    });
    assert.deepEqual(await page.locator('[data-bibliography-id]').evaluateAll(nodes => nodes.map(n => n.dataset.bibliographyId)), ['nielsen','norman','openai']);
    await page.evaluate(() => { references[0].ano = '2025'; DissertationEditor.refreshReferences(references); });
    await page.waitForFunction(() => document.querySelector('[data-citation-id="c1"]').textContent.includes('2025'));
    await page.evaluate(() => {
      const ed = DissertationEditor.getEditor();
      let at; ed.state.doc.descendants((node,pos) => {if(node.attrs.id === 'c2') at=pos;});
      ed.commands.deleteRange({from:at,to:at+1});
    });
    assert.equal(await page.locator('[data-bibliography-id="nielsen"]').count(), 0);
    await page.evaluate(() => {
      const ed=DissertationEditor.getEditor();
      ed.commands.focus('end');
      ed.commands.insertContent(Array.from({length:65},(_,i)=>({type:'paragraph',content:[{type:'text',text:`Parágrafo ${i}. ` + 'A pesquisa em design considera pessoas, métodos e resultados. '.repeat(7)}]})));
    });
    const layout = await page.evaluate(() => {
      const root=document.querySelector('.academic-prose');
      const r=root.getBoundingClientRect();
      const ranges=[];
      for(const p of root.querySelectorAll(':scope > p')) {
        const range=document.createRange();range.selectNodeContents(p);
        for(const rect of range.getClientRects()) if(rect.width>2) ranges.push({top:rect.top-r.top,bottom:rect.bottom-r.top});
      }
      const guides = [...root.querySelectorAll('.academic-page-guide')].map(node => node.getBoundingClientRect().top-r.top);
      return {width:r.width,pages:guides.length+1,ranges,guides};
    });
    assert(Math.abs(layout.width - 793.7) < 2);
    assert(layout.pages >= 3, 'Long content must span multiple A4 pages');
    assert(layout.guides.every((top, index) => top > 933.543 + index * 1150.52 - 2), 'Page guides must follow the usable page height');
    await page.locator('.academic-prose > p').nth(35).click();
    await page.keyboard.type('EDIÇÃO NA OUTRA PÁGINA ');
    assert((await page.locator('.academic-prose').innerText()).includes('EDIÇÃO NA OUTRA PÁGINA'));
    await page.evaluate(() => DissertationEditor.flush());
    const serialized=await page.evaluate(()=>window.saved);
    assert.equal(serialized.content.type,'doc');
    assert(!/rm-page|academic-bibliography|editor-page-spacer/.test(serialized.contentHtml));
    assert.equal(serialized.citations.length,2);
    await page.evaluate(() => DissertationEditor.render({...options,document:{id:'reload',nome:'Reaberto',...saved}}));
    await page.waitForFunction(() => document.querySelector('.academic-prose').scrollHeight > 933);
    assert((await page.locator('.academic-prose').innerText()).includes('EDIÇÃO NA OUTRA PÁGINA'));
    await page.screenshot({path:path.join(root,'test-results/editor-desktop.png'),fullPage:false});
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
});

test('App integration: document lifecycle, reference form, autosave and reload', async () => {
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(10000);
  page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.route('https://www.gstatic.com/firebasejs/**',route=>route.fulfill({body:''}));
    await page.route('**/firebase-config.js',route=>route.fulfill({contentType:'application/javascript',body:`window.FirebaseBackend={auth:{currentUser:null,onAuthStateChanged(cb){setTimeout(()=>cb({uid:'test',email:'test@local'}),10)}},loadState:async()=>null,saveState:async()=>{},logout:async()=>{}};`}));
    await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({body:''}));
    await page.goto('http://127.0.0.1:5174/#dissertacao', {waitUntil:'domcontentloaded'});
    await page.waitForSelector('.academic-prose');
    await page.waitForSelector('#appShell:not(.hidden)');
    await page.locator('#academicDocumentTitle').fill('Documento de teste');
    await page.locator('#academicDocumentTitle').press('Tab');
    await page.locator('.academic-prose').click();
    await page.keyboard.type('Texto persistido.');
    await page.waitForFunction(()=>document.querySelector('#academicSaveState').textContent==='Salvo');
    assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('entrelinhas-data-v1')).dissertations[0].contentHtml)).includes('Texto persistido.'));
    await page.reload();
    await page.waitForSelector('.academic-prose');
    assert((await page.locator('.academic-prose').innerText()).includes('Texto persistido.'));
    await page.locator('[data-academic-command="citation"]').click();
    await page.locator('[data-new-reference-inline]').click();
    await page.locator('#referenceForm [name="titulo"]').fill('Design de teste');
    await page.locator('#referenceForm [name="autores"]').fill('Donald Norman');
    await page.locator('#referenceForm [name="ano"]').fill('2026');
    await page.locator('#referenceForm [name="tipoReferencia"]').selectOption('tese');
    assert(await page.locator('[name="instituicaoAcademica"]').isVisible());
    assert(!(await page.locator('[name="periodico"]').isVisible()));
    await page.locator('#referenceForm [name="tipoReferencia"]').selectOption('livro');
    console.log('Form validity',await page.locator('#referenceForm').evaluate(form=>({valid:form.checkValidity(),invalid:[...form.elements].filter(el=>el.validity&&!el.validity.valid).map(el=>({name:el.name,value:el.value,reason:el.validationMessage}))})));
    await page.locator('#referenceForm button', {hasText:'Salvar referência'}).click();
    await page.locator('#insertCitationForm [name="referenceId"]').selectOption({label:'Donald Norman · Design de teste (2026)'});
    await page.locator('#insertCitationForm button', {hasText:'Inserir citação'}).click();
    await page.waitForSelector('.academic-citation');
    assert((await page.locator('.academic-citation').innerText()).includes('NORMAN, 2026'));
    assert((await page.locator('.academic-bibliography').innerText()).includes('Design de teste'));
    await page.locator('.word-page-wrap').evaluate(el=>el.scrollTop=0);
    await page.screenshot({path:path.join(root,'test-results/app-editor-desktop.png')});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(root,'test-results/app-editor-mobile.png')});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
    assert.deepEqual(errors,[]);
  } catch(error) { console.error('App errors:',errors); await page.screenshot({path:path.join(root,'test-results/app-failure.png'),timeout:3000}).catch(()=>{}); throw error; }
  finally {await browser.close();}
});

test('Empty academic document remains one page and starts at position 1', async () => {
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1200,height:900}});
  try {
    await page.setContent('<div id="dissertacaoPage"><div class="word-shell"><div class="word-workspace"><input id="academicDocumentTitle"><span id="academicSaveState"></span><div id="academicToolbar"></div><div class="word-page-wrap"><div id="documentPage"></div></div><span id="academicStats"></span></div><nav id="documentOutline"></nav></div></div>');
    await page.addStyleTag({path:path.join(root,'academic-editor/editor.css')});
    await page.addScriptTag({path:path.join(root,'dissertation-editor.js')});
    await page.evaluate(() => DissertationEditor.render({container:document.querySelector('#documentPage'),document:{id:'empty',nome:'Novo documento',contentHtml:'<p><br></p>'},references:[],formatBibliography:()=>'',onChange:()=>{},onSave:()=>{}}));
    await page.waitForTimeout(300);
    assert.equal((await page.locator('.academic-prose').innerText()).trim(), '');
    assert.equal(await page.locator('.academic-page-guide').count(), 0);
    assert.equal(await page.evaluate(() => DissertationEditor.getEditor().state.selection.from), 1);
    await page.locator('.academic-prose').click({position:{x:140,y:140}});
    await page.keyboard.type('Primeiro texto');
    await page.waitForTimeout(300);
    assert((await page.locator('.academic-prose').innerText()).includes('Primeiro texto'));
    assert.equal(await page.locator('.academic-page-guide').count(), 0);
  } finally { await browser.close(); }
});
