(function () {
  const SIDES = ['top', 'right', 'bottom', 'left'];
  const COLORS = ['#fff1a8', '#cce8ff', '#d8f3dc', '#ffd6e0', '#e7ddff', '#ffe0b5'];
  const FONT_SIZES = { small: 14, medium: 18, large: 26 };
  const MIN_TEXT_WIDTH = 150;
  const MIN_POSTIT_WIDTH = 150;
  const MIN_POSTIT_HEIGHT = 120;
  const HANDLE_OFFSET = 10;
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 1.8;
  const ZOOM_STEP = 0.1;
  const GRID_SIZE = 24;

  const uid = () => globalThis.crypto?.randomUUID?.() || `idea-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const clamp = (value, minimum) => Math.max(minimum, Number(value) || minimum);
  const clampRange = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const snapToGrid = value => Math.round((Number(value) || 0) / GRID_SIZE) * GRID_SIZE;

  class IdeasCanvas {
    constructor(options) {
      this.container = options.container;
      this.elements = options.elements;
      this.connections = options.connections;
      this.onChange = options.onChange || (() => {});
      this.selectedId = null;
      this.selectedConnectionId = null;
      this.activeTextControlsId = null;
      this.editingElementId = null;
      this.interaction = null;
      this.saveTimer = null;
      this.zoom = 1;
      this.cameraX = 0;
      this.cameraY = 0;
      this.viewportWidth = 0;
      this.viewportHeight = 0;
      this.hasCentered = false;
      this.render();
    }

    destroy() {
      clearTimeout(this.saveTimer);
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
      window.removeEventListener('pointercancel', this.onPointerCancel);
      window.removeEventListener('keydown', this.onKeyDown);
      this.resizeObserver?.disconnect();
      this.container.replaceChildren();
    }

    render() {
      this.container.innerHTML = `
        <div class="ideas-canvas-shell">
          <div class="ideas-canvas" tabindex="0" aria-label="Canvas de ideias">
            <svg class="ideas-connections" aria-hidden="true">
              <defs><marker id="ideaArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z"></path></marker></defs>
              <g data-connections></g><path class="idea-connection-preview" data-connection-preview hidden></path>
            </svg>
            <div class="ideas-connection-labels" data-connection-labels></div>
            <div class="ideas-scene">
              <div class="ideas-elements" data-elements></div>
            </div>
          </div>
          <div class="ideas-floating-toolbar" role="toolbar" aria-label="Ferramentas do canvas">
            <div class="idea-tool-wrap"><button type="button" class="idea-tool" data-tool="text"><span class="idea-tool-icon">T</span><span>Texto</span></button><div class="idea-tool-popover" data-text-popover hidden><button type="button" data-add-text="title">Título</button><button type="button" data-add-text="body">Texto corrido</button></div></div>
            <div class="idea-tool-divider"></div>
            <div class="idea-tool-wrap"><button type="button" class="idea-tool" data-tool="postit"><span class="idea-tool-icon idea-note-icon"></span><span>Post-it</span></button><div class="idea-tool-popover idea-color-popover" data-color-popover hidden>${COLORS.map(color => `<button type="button" data-add-postit="${color}" style="--swatch:${color}" aria-label="Criar post-it ${color}"></button>`).join('')}</div></div>
            <div class="idea-tool-divider"></div>
            <div class="idea-zoom-controls" aria-label="Zoom do canvas">
              <button type="button" data-zoom="out" aria-label="Diminuir zoom">−</button>
              <button type="button" data-zoom="reset" class="idea-zoom-value" aria-label="Restaurar zoom"><span data-zoom-label>100%</span></button>
              <button type="button" data-zoom="in" aria-label="Aumentar zoom">+</button>
            </div>
          </div>
        </div>`;
      this.shell = this.container.querySelector('.ideas-canvas-shell');
      this.canvas = this.container.querySelector('.ideas-canvas');
      this.scene = this.container.querySelector('.ideas-scene');
      this.elementsLayer = this.container.querySelector('[data-elements]');
      this.connectionsLayer = this.container.querySelector('[data-connections]');
      this.connectionLabelsLayer = this.container.querySelector('[data-connection-labels]');
      this.preview = this.container.querySelector('[data-connection-preview]');
      this.zoomLabel = this.container.querySelector('[data-zoom-label]');
      this.bind();
      this.renderElements();
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.canvas);
      requestAnimationFrame(() => this.centerOnElements());
    }

    bind() {
      this.shell.addEventListener('click', event => this.onClick(event));
      this.shell.addEventListener('pointerdown', event => this.onPointerDown(event));
      this.shell.addEventListener('pointerover', event => this.onConnectionHover(event, true));
      this.shell.addEventListener('pointerout', event => this.onConnectionHover(event, false));
      this.shell.addEventListener('input', event => this.onInput(event));
      this.shell.addEventListener('focusout', event => {
        if (event.target.matches('.idea-node-content')) {
          const node = event.target.closest('.idea-node');
          this.commit();
          requestAnimationFrame(() => {
            if (!node.contains(document.activeElement)) {
              this.editingElementId = null;
              this.activeTextControlsId = null;
              node.classList.remove('is-editing');
              event.target.setAttribute('contenteditable', 'false');
              node.querySelector('.idea-text-controls')?.remove();
            }
          });
        }
        if (event.target.matches('.idea-connection-label-editor')) this.finishConnectionLabel(event.target);
      });
      this.canvas.addEventListener('wheel', event => this.onWheel(event), { passive: false });
      this.onPointerMove = event => this.pointerMove(event);
      this.onPointerUp = event => this.pointerUp(event);
      this.onPointerCancel = () => this.cancelInteraction();
      this.onKeyDown = event => this.handleKeyDown(event);
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
      window.addEventListener('pointercancel', this.onPointerCancel);
      window.addEventListener('keydown', this.onKeyDown);
    }

    onConnectionHover(event, active) {
      const connection = event.target.closest('[data-connection-id]');
      if (!connection) return;
      if (!active && event.relatedTarget?.closest?.('[data-connection-id]') === connection) return;
      this.connectionLabelsLayer
        .querySelector(`[data-label-connection="${CSS.escape(connection.dataset.connectionId)}"]`)
        ?.classList.toggle('is-connection-hovered', active);
    }

    onClick(event) {
      if (this.ignoreNextClick) return;
      const addConnectionLabel = event.target.closest('[data-add-connection-label]');
      if (addConnectionLabel) {
        event.preventDefault();
        this.enableConnectionLabel(addConnectionLabel.dataset.addConnectionLabel);
        return;
      }
      const labelEditor = event.target.closest('.idea-connection-label-editor');
      if (labelEditor) {
        this.selectedConnectionId = labelEditor.dataset.connectionLabelEditor;
        return;
      }
      const connection = event.target.closest('[data-connection-id]');
      if (connection) {
        event.preventDefault();
        this.selectConnection(connection.dataset.connectionId);
        return;
      }
      const zoomAction = event.target.closest('[data-zoom]')?.dataset.zoom;
      if (zoomAction) {
        event.preventDefault();
        if (zoomAction === 'reset') this.setZoom(1);
        else this.setZoom(this.zoom + (zoomAction === 'in' ? ZOOM_STEP : -ZOOM_STEP));
        return;
      }
      const tool = event.target.closest('[data-tool]');
      if (tool) {
        event.stopPropagation();
        this.togglePopover(tool.dataset.tool);
        return;
      }
      const textType = event.target.closest('[data-add-text]')?.dataset.addText;
      if (textType) {
        this.addElement('text', { textType });
        return;
      }
      const color = event.target.closest('[data-add-postit]')?.dataset.addPostit;
      if (color) {
        this.addElement('postit', { color });
        return;
      }
      const fontSize = event.target.closest('[data-font-size]')?.dataset.fontSize;
      if (fontSize) {
        const element = this.elements.find(item => item.id === this.selectedId);
        if (element?.type === 'text') {
          element.fontSize = fontSize;
          element.atualizadoEm = new Date().toISOString();
          this.renderElements();
          this.commit();
        }
        return;
      }
      const textAlign = event.target.closest('[data-text-align]')?.dataset.textAlign;
      if (textAlign) {
        const element = this.elements.find(item => item.id === this.selectedId);
        if (element?.type === 'text') {
          element.textAlign = textAlign;
          element.atualizadoEm = new Date().toISOString();
          this.renderElements();
          this.commit();
        }
        return;
      }
      const node = event.target.closest('.idea-node');
      if (node) this.select(node.dataset.ideaId);
      else if (!event.target.closest('.ideas-floating-toolbar')) this.select(null);
    }

    togglePopover(type) {
      const textPopover = this.container.querySelector('[data-text-popover]');
      const colorPopover = this.container.querySelector('[data-color-popover]');
      textPopover.hidden = type !== 'text' || !textPopover.hidden;
      colorPopover.hidden = type !== 'postit' || !colorPopover.hidden;
    }

    addElement(type, options = {}) {
      const rect = this.canvas.getBoundingClientRect();
      const offset = (this.elements.length % 6) * 38;
      const x = (rect.width / 2 - this.cameraX) / this.zoom - 110 + offset;
      const y = (rect.height / 2 - this.cameraY) / this.zoom - 70 + offset;
      const element = {
        id: uid(), type, x, y,
        width: type === 'postit' ? 220 : 260,
        height: type === 'postit' ? 160 : 72,
        content: '', textType: options.textType || 'body',
        fontSize: 'medium', textAlign: 'left', color: options.color || COLORS[0],
        criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString()
      };
      this.elements.push(element);
      this.closePopovers();
      this.selectedId = element.id;
      this.activeTextControlsId = type === 'text' ? element.id : null;
      this.editingElementId = element.id;
      this.renderElements();
      this.commit();
      requestAnimationFrame(() => {
        const editable = this.elementsLayer.querySelector(`[data-idea-id="${CSS.escape(element.id)}"] [contenteditable]`);
        editable?.focus();
      });
      return element;
    }

    closePopovers() {
      this.container.querySelectorAll('.idea-tool-popover').forEach(popover => { popover.hidden = true; });
    }

    renderElements() {
      this.elementsLayer.innerHTML = this.elements.map(element => {
        const selected = element.id === this.selectedId;
        const type = element.type === 'text' ? 'text' : 'postit';
        const textAlign = ['left', 'center', 'right'].includes(element.textAlign) ? element.textAlign : 'left';
        const style = `left:${element.x}px;top:${element.y}px;width:${element.width}px;${type === 'postit' ? `height:${element.height}px;--idea-color:${escapeHtml(element.color)}` : `min-height:${element.height}px;--idea-font-size:${FONT_SIZES[element.fontSize] || FONT_SIZES.medium}px;--idea-text-align:${textAlign}`}`;
        const editing = element.id === this.editingElementId;
        return `<article class="idea-node idea-node-${type} ${selected ? 'is-selected' : ''} ${editing ? 'is-editing' : ''} ${element.textType === 'title' ? 'is-title' : ''}" data-idea-id="${escapeHtml(element.id)}" style="${style}">
          <div class="idea-node-drag" aria-label="Arrastar elemento"></div>
          ${type === 'text' && selected && this.activeTextControlsId === element.id ? `<div class="idea-text-controls" aria-label="Formatação do texto">
            <div class="idea-font-sizes" aria-label="Tamanho do texto">${['small', 'medium', 'large'].map(size => `<button type="button" data-font-size="${size}" class="${element.fontSize === size ? 'active' : ''}" aria-label="Tamanho ${size}">A</button>`).join('')}</div>
            <span class="idea-control-divider"></span>
            <div class="idea-alignments" aria-label="Alinhamento do texto">${['left', 'center', 'right'].map(align => `<button type="button" data-text-align="${align}" class="${textAlign === align ? 'active' : ''}" aria-label="Alinhar ${align === 'left' ? 'à esquerda' : align === 'center' ? 'ao centro' : 'à direita'}"><span class="idea-align-icon align-${align}"><i></i><i></i><i></i></span></button>`).join('')}</div>
          </div>` : ''}
          <div class="idea-node-content" contenteditable="${editing ? 'true' : 'false'}" role="textbox" spellcheck="true" data-placeholder="${type === 'postit' ? 'Escreva uma ideia' : element.textType === 'title' ? 'Digite um título' : 'Digite seu texto'}">${escapeHtml(element.content)}</div>
          ${SIDES.map(side => `<button type="button" class="connection-handle handle-${side}" data-handle="${side}" aria-label="Conectar pelo lado ${side}"></button>`).join('')}
          <button type="button" class="idea-resize-handle" aria-label="Redimensionar elemento"></button>
        </article>`;
      }).join('');
      this.drawConnections();
    }

    select(id) {
      const element = this.elements.find(item => item.id === id);
      const controlsAlreadyVisible = id && this.activeTextControlsId === id && this.elementsLayer.querySelector(`[data-idea-id="${CSS.escape(id)}"] .idea-text-controls`);
      if (this.selectedId === id && !this.selectedConnectionId && (!element || element.type !== 'text' || controlsAlreadyVisible)) return;
      this.selectedId = id;
      this.selectedConnectionId = null;
      this.activeTextControlsId = element?.type === 'text' ? id : null;
      this.renderElements();
    }

    selectConnection(id) {
      this.selectedId = null;
      this.activeTextControlsId = null;
      this.editingElementId = null;
      this.selectedConnectionId = id;
      this.elementsLayer.querySelectorAll('.idea-node').forEach(node => node.classList.remove('is-selected'));
      this.drawConnections();
      this.canvas.focus({ preventScroll: true });
    }

    beginEditing(id, clientX, clientY) {
      const element = this.elements.find(item => item.id === id);
      if (!element) return;
      this.selectedId = id;
      this.selectedConnectionId = null;
      this.editingElementId = id;
      this.activeTextControlsId = element.type === 'text' ? id : null;
      this.renderElements();
      requestAnimationFrame(() => {
        const editable = this.elementsLayer.querySelector(`[data-idea-id="${CSS.escape(id)}"] .idea-node-content`);
        if (!editable) return;
        editable.focus();
        const range = document.caretRangeFromPoint?.(clientX, clientY);
        const selection = window.getSelection();
        if (range && editable.contains(range.startContainer)) {
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        }
        const fallback = document.createRange();
        fallback.selectNodeContents(editable);
        fallback.collapse(false);
        selection.removeAllRanges();
        selection.addRange(fallback);
      });
    }

    suppressNextClick() {
      this.ignoreNextClick = true;
      setTimeout(() => { this.ignoreNextClick = false; }, 0);
    }

    enableConnectionLabel(id) {
      const connection = this.connections.find(item => item.id === id);
      if (!connection) return;
      connection.labelEnabled = true;
      this.selectedConnectionId = id;
      this.drawConnections();
      requestAnimationFrame(() => {
        const editor = this.connectionLabelsLayer.querySelector(`[data-connection-label-editor="${CSS.escape(id)}"]`);
        editor?.focus();
      });
    }

    finishConnectionLabel(editor) {
      const connection = this.connections.find(item => item.id === editor.dataset.connectionLabelEditor);
      if (!connection) return;
      connection.label = editor.innerText.trim();
      connection.labelEnabled = Boolean(connection.label);
      connection.atualizadoEm = new Date().toISOString();
      this.drawConnections();
      this.commit();
    }

    handleKeyDown(event) {
      if (event.target.matches?.('.idea-connection-label-editor') && event.key === 'Enter') {
        event.preventDefault();
        event.target.blur();
        return;
      }
      if (!this.selectedConnectionId || !['Backspace', 'Delete'].includes(event.key)) return;
      if (event.target.closest?.('input, textarea, [contenteditable="true"]')) return;
      const index = this.connections.findIndex(connection => connection.id === this.selectedConnectionId);
      if (index < 0) return;
      event.preventDefault();
      this.connections.splice(index, 1);
      this.selectedConnectionId = null;
      this.drawConnections();
      this.commit();
    }

    onInput(event) {
      const labelEditor = event.target.closest('.idea-connection-label-editor');
      if (labelEditor) {
        const connection = this.connections.find(item => item.id === labelEditor.dataset.connectionLabelEditor);
        if (!connection) return;
        connection.label = labelEditor.innerText.replace(/\n/g, ' ');
        connection.labelEnabled = true;
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.commit(), 350);
        return;
      }
      const content = event.target.closest('.idea-node-content');
      if (!content) return;
      const element = this.elements.find(item => item.id === content.closest('.idea-node').dataset.ideaId);
      if (!element) return;
      element.content = content.innerText.replace(/\n{3,}/g, '\n\n');
      const lines = element.content.split('\n');
      element.titulo = lines[0] || (element.type === 'postit' ? 'Post-it' : element.textType === 'title' ? 'Título' : 'Texto');
      element.texto = lines.slice(1).join('\n') || element.content;
      element.atualizadoEm = new Date().toISOString();
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.commit(), 350);
    }

    onPointerDown(event) {
      if (event.button !== 0) return;
      const handle = event.target.closest('.connection-handle');
      const resize = event.target.closest('.idea-resize-handle');
      const node = event.target.closest('.idea-node');
      const element = node ? this.elements.find(item => item.id === node.dataset.ideaId) : null;
      if (event.target.closest('[data-connection-id]')) return;
      if (event.target.closest('.idea-connection-label')) return;
      if (handle) {
        event.preventDefault();
        this.markSelected(node.dataset.ideaId);
        this.interaction = { type: 'connect', element, side: handle.dataset.handle, pointerId: event.pointerId, captureTarget: handle };
        handle.setPointerCapture?.(event.pointerId);
        this.canvas.classList.add('is-connecting');
        this.preview.removeAttribute('hidden');
        this.updateConnectionPreview(event.clientX, event.clientY);
        return;
      }
      if (resize) {
        event.preventDefault();
        this.markSelected(node.dataset.ideaId);
        this.interaction = { type: 'resize', element, startX: event.clientX, startY: event.clientY, width: element.width, height: element.height };
        return;
      }
      if (node) {
        if (event.target.closest('.idea-text-controls')) return;
        event.preventDefault();
        this.markSelected(node.dataset.ideaId);
        this.interaction = {
          type: 'node',
          element,
          node,
          pointerId: event.pointerId,
          captureTarget: node,
          startX: event.clientX,
          startY: event.clientY,
          x: element.x,
          y: element.y,
          dragging: false
        };
        node.setPointerCapture?.(event.pointerId);
        return;
      }
      if (event.target.closest('.ideas-floating-toolbar')) return;
      if (!event.target.closest('.ideas-canvas')) return;
      event.preventDefault();
      this.closePopovers();
      this.markSelected(null);
      this.interaction = {
        type: 'pan',
        startX: event.clientX,
        startY: event.clientY,
        cameraX: this.cameraX,
        cameraY: this.cameraY
      };
      this.canvas.classList.add('is-panning');
    }

    markSelected(id) {
      this.selectedId = id;
      this.selectedConnectionId = null;
      const element = this.elements.find(item => item.id === id);
      this.activeTextControlsId = element?.type === 'text' ? id : null;
      if (!id) {
        this.editingElementId = null;
        this.elementsLayer.querySelectorAll('.idea-text-controls').forEach(controls => controls.remove());
        this.elementsLayer.querySelectorAll('.idea-node-content').forEach(content => content.setAttribute('contenteditable', 'false'));
      }
      this.elementsLayer.querySelectorAll('.idea-node').forEach(node => node.classList.toggle('is-selected', node.dataset.ideaId === id));
      this.drawConnections();
    }

    onWheel(event) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.deltaY) return;
      const direction = event.deltaY < 0 ? 1 : -1;
      this.setZoom(this.zoom + direction * ZOOM_STEP, event.clientX, event.clientY);
    }

    setZoom(value, clientX, clientY) {
      const nextZoom = Math.round(clampRange(value, ZOOM_MIN, ZOOM_MAX) * 10) / 10;
      if (nextZoom === this.zoom) return;
      const rect = this.canvas.getBoundingClientRect();
      const focusX = clientX == null ? rect.width / 2 : clientX - rect.left;
      const focusY = clientY == null ? rect.height / 2 : clientY - rect.top;
      const worldX = (focusX - this.cameraX) / this.zoom;
      const worldY = (focusY - this.cameraY) / this.zoom;
      this.zoom = nextZoom;
      this.cameraX = focusX - worldX * this.zoom;
      this.cameraY = focusY - worldY * this.zoom;
      this.applyCamera();
    }

    applyCamera() {
      this.scene.style.transform = `translate(${this.cameraX}px,${this.cameraY}px) scale(${this.zoom})`;
      this.canvas.style.setProperty('--idea-grid-size', `${24 * this.zoom}px`);
      this.canvas.style.setProperty('--idea-grid-x', `${this.cameraX}px`);
      this.canvas.style.setProperty('--idea-grid-y', `${this.cameraY}px`);
      if (this.zoomLabel) this.zoomLabel.textContent = `${Math.round(this.zoom * 100)}%`;
      this.drawConnections();
    }

    centerOnElements() {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      if (!width || !height) return;
      const bounds = this.elements.reduce((result, element) => {
        const node = this.elementsLayer.querySelector(`[data-idea-id="${CSS.escape(element.id)}"]`);
        const elementWidth = node?.offsetWidth || Number(element.width) || 220;
        const elementHeight = node?.offsetHeight || Number(element.height) || (element.type === 'postit' ? 160 : 72);
        const x = Number(element.x) || 0;
        const y = Number(element.y) || 0;
        result.left = Math.min(result.left, x);
        result.top = Math.min(result.top, y);
        result.right = Math.max(result.right, x + elementWidth);
        result.bottom = Math.max(result.bottom, y + elementHeight);
        return result;
      }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
      const centerX = this.elements.length ? (bounds.left + bounds.right) / 2 : 0;
      const centerY = this.elements.length ? (bounds.top + bounds.bottom) / 2 : 0;
      this.cameraX = width / 2 - centerX * this.zoom;
      this.cameraY = height / 2 - centerY * this.zoom;
      this.viewportWidth = width;
      this.viewportHeight = height;
      this.hasCentered = true;
      this.applyCamera();
    }

    handleResize() {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      if (!width || !height) return;
      if (!this.hasCentered) {
        this.centerOnElements();
        return;
      }
      const worldCenterX = (this.viewportWidth / 2 - this.cameraX) / this.zoom;
      const worldCenterY = (this.viewportHeight / 2 - this.cameraY) / this.zoom;
      this.cameraX = width / 2 - worldCenterX * this.zoom;
      this.cameraY = height / 2 - worldCenterY * this.zoom;
      this.viewportWidth = width;
      this.viewportHeight = height;
      this.applyCamera();
    }

    pointerMove(event) {
      if (!this.interaction) return;
      const action = this.interaction;
      if (action.type === 'node') {
        const deltaX = event.clientX - action.startX;
        const deltaY = event.clientY - action.startY;
        if (!action.dragging && Math.hypot(deltaX, deltaY) >= 5) {
          action.dragging = true;
          this.editingElementId = null;
          this.activeTextControlsId = null;
          action.node.classList.add('is-dragging');
          action.node.querySelector('.idea-node-content')?.setAttribute('contenteditable', 'false');
          action.node.querySelector('.idea-text-controls')?.remove();
        }
        if (action.dragging) {
          action.element.x = snapToGrid(action.x + deltaX / this.zoom);
          action.element.y = snapToGrid(action.y + deltaY / this.zoom);
          this.updateElementPosition(action.element);
        }
      } else if (action.type === 'resize') {
        action.element.width = clamp(action.width + (event.clientX - action.startX) / this.zoom, action.element.type === 'postit' ? MIN_POSTIT_WIDTH : MIN_TEXT_WIDTH);
        if (action.element.type === 'postit') action.element.height = clamp(action.height + (event.clientY - action.startY) / this.zoom, MIN_POSTIT_HEIGHT);
        this.updateElementSize(action.element);
      } else if (action.type === 'connect') {
        this.updateConnectionPreview(event.clientX, event.clientY);
      } else if (action.type === 'pan') {
        this.cameraX = action.cameraX + event.clientX - action.startX;
        this.cameraY = action.cameraY + event.clientY - action.startY;
        this.applyCamera();
      }
    }

    pointerUp(event) {
      if (!this.interaction) return;
      const action = this.interaction;
      if (action.type === 'node') {
        this.interaction = null;
        this.releasePointer(action);
        action.node.classList.remove('is-dragging');
        this.suppressNextClick();
        if (!action.dragging) {
          this.beginEditing(action.element.id, event.clientX, event.clientY);
          return;
        }
        action.element.atualizadoEm = new Date().toISOString();
        this.renderElements();
        this.commit();
        return;
      }
      if (action.type === 'connect') {
        const target = this.connectionTargetAt(event.clientX, event.clientY, action.element.id);
        const targetHandle = target?.handle;
        const targetNode = target?.node;
        if (targetHandle && targetNode && targetNode.dataset.ideaId !== action.element.id) {
          this.connections.push({ id: uid(), sourceElementId: action.element.id, sourceHandle: action.side, targetElementId: targetNode.dataset.ideaId, targetHandle: targetHandle.dataset.handle, label: '', labelEnabled: false });
        }
      }
      this.hideConnectionPreview();
      this.canvas.classList.remove('is-panning', 'is-connecting');
      this.interaction = null;
      this.releasePointer(action);
      if (action.type === 'pan') return;
      action.element.atualizadoEm = new Date().toISOString();
      this.renderElements();
      this.commit();
    }

    cancelInteraction() {
      if (!this.interaction) return;
      const action = this.interaction;
      this.interaction = null;
      if (action.type === 'node') {
        action.node.classList.remove('is-dragging');
        if (action.dragging) {
          action.element.x = action.x;
          action.element.y = action.y;
          this.updateElementPosition(action.element);
        }
      }
      this.canvas.classList.remove('is-panning', 'is-connecting');
      this.hideConnectionPreview();
      this.releasePointer(action);
    }

    releasePointer(action) {
      if (action?.captureTarget?.hasPointerCapture?.(action.pointerId)) {
        action.captureTarget.releasePointerCapture(action.pointerId);
      }
    }

    connectionTargetAt(clientX, clientY, sourceId) {
      return [...this.elementsLayer.querySelectorAll('.connection-handle')]
        .map(handle => ({ handle, node: handle.closest('.idea-node'), rect: handle.getBoundingClientRect() }))
        .filter(candidate => candidate.node?.dataset.ideaId !== sourceId)
        .map(candidate => ({
          ...candidate,
          distance: Math.hypot(clientX - (candidate.rect.left + candidate.rect.width / 2), clientY - (candidate.rect.top + candidate.rect.height / 2))
        }))
        .filter(candidate => candidate.distance <= Math.max(22, candidate.rect.width * 0.8))
        .sort((a, b) => a.distance - b.distance)[0] || null;
    }

    hideConnectionPreview() {
      this.hoveredHandle?.classList.remove('is-connection-target');
      this.hoveredHandle = null;
      this.preview.setAttribute('hidden', '');
      this.preview.removeAttribute('d');
    }

    updateElementPosition(element) {
      const node = this.elementsLayer.querySelector(`[data-idea-id="${CSS.escape(element.id)}"]`);
      if (!node) return;
      node.style.left = `${element.x}px`;
      node.style.top = `${element.y}px`;
      this.drawConnections();
    }

    updateElementSize(element) {
      const node = this.elementsLayer.querySelector(`[data-idea-id="${CSS.escape(element.id)}"]`);
      if (!node) return;
      node.style.width = `${element.width}px`;
      if (element.type === 'postit') node.style.height = `${element.height}px`;
      this.drawConnections();
    }

    point(element, side) {
      const node = this.elementsLayer.querySelector(`[data-idea-id="${CSS.escape(element.id)}"]`);
      const width = node?.offsetWidth || Number(element.width) || 220;
      const height = node?.offsetHeight || Number(element.height) || (element.type === 'postit' ? 160 : 72);
      const points = {
        top: { x: element.x + width / 2, y: element.y - HANDLE_OFFSET },
        right: { x: element.x + width + HANDLE_OFFSET, y: element.y + height / 2 },
        bottom: { x: element.x + width / 2, y: element.y + height + HANDLE_OFFSET },
        left: { x: element.x - HANDLE_OFFSET, y: element.y + height / 2 }
      };
      return points[side] || points.right;
    }

    drawConnections() {
      const labels = [];
      this.connectionsLayer.innerHTML = this.connections.map(connection => {
        const source = this.elements.find(item => item.id === (connection.sourceElementId || connection.from));
        const target = this.elements.find(item => item.id === (connection.targetElementId || connection.to));
        if (!source || !target) return '';
        const sourceSide = connection.sourceHandle || 'right';
        const targetSide = connection.targetHandle || 'left';
        const start = this.worldToScreen(this.point(source, sourceSide));
        const end = this.worldToScreen(this.point(target, targetSide));
        const curve = this.curve(start, end, sourceSide, targetSide);
        const path = curve.d;
        const selected = connection.id === this.selectedConnectionId;
        const labelEnabled = Boolean(connection.labelEnabled || connection.label);
        labels.push(`<div class="idea-connection-label ${selected ? 'is-selected' : ''} ${labelEnabled ? 'has-label' : ''}" data-label-connection="${escapeHtml(connection.id)}" style="left:${curve.midpoint.x}px;top:${curve.midpoint.y}px">
          ${labelEnabled
            ? `<div class="idea-connection-label-editor" contenteditable="true" role="textbox" spellcheck="true" data-connection-label-editor="${escapeHtml(connection.id)}" data-placeholder="Texto">${escapeHtml(connection.label || '')}</div>`
            : `<button type="button" data-add-connection-label="${escapeHtml(connection.id)}" aria-label="Adicionar texto à seta">+</button>`}
        </div>`);
        return `<g data-connection-id="${escapeHtml(connection.id)}" class="idea-connection ${selected ? 'is-selected' : ''}">
          <path class="idea-connection-hit" d="${path}" tabindex="0" role="button" aria-label="Selecionar conexão"></path>
          <path class="idea-connection-line" d="${path}" marker-end="url(#ideaArrow)"></path>
        </g>`;
      }).join('');
      this.connectionLabelsLayer.innerHTML = labels.join('');
    }

    updateConnectionPreview(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const start = this.worldToScreen(this.point(this.interaction.element, this.interaction.side));
      const target = this.connectionTargetAt(clientX, clientY, this.interaction.element.id);
      this.hoveredHandle?.classList.remove('is-connection-target');
      this.hoveredHandle = target?.handle || null;
      this.hoveredHandle?.classList.add('is-connection-target');
      const targetElement = target ? this.elements.find(element => element.id === target.node.dataset.ideaId) : null;
      const end = targetElement
        ? this.worldToScreen(this.point(targetElement, target.handle.dataset.handle))
        : { x: clientX - rect.left, y: clientY - rect.top };
      const targetSide = target?.handle.dataset.handle || this.inferTargetSide(start, end);
      this.preview.setAttribute('d', this.path(start, end, this.interaction.side, targetSide));
    }

    worldToScreen(point) {
      return { x: this.cameraX + point.x * this.zoom, y: this.cameraY + point.y * this.zoom };
    }

    inferTargetSide(start, end) {
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      if (Math.abs(deltaX) >= Math.abs(deltaY)) return deltaX >= 0 ? 'left' : 'right';
      return deltaY >= 0 ? 'top' : 'bottom';
    }

    curve(start, end, sourceSide = 'right', targetSide = 'left') {
      const directions = {
        top: { x: 0, y: -1 },
        right: { x: 1, y: 0 },
        bottom: { x: 0, y: 1 },
        left: { x: -1, y: 0 }
      };
      const sourceDirection = directions[sourceSide] || directions.right;
      const targetDirection = directions[targetSide] || directions.left;
      const distance = Math.hypot(end.x - start.x, end.y - start.y);
      const bend = Math.min(190, Math.max(52, distance * 0.38));
      const firstControl = { x: start.x + sourceDirection.x * bend, y: start.y + sourceDirection.y * bend };
      const secondControl = { x: end.x + targetDirection.x * bend, y: end.y + targetDirection.y * bend };
      const midpoint = {
        x: (start.x + 3 * firstControl.x + 3 * secondControl.x + end.x) / 8,
        y: (start.y + 3 * firstControl.y + 3 * secondControl.y + end.y) / 8
      };
      return { d: `M ${start.x} ${start.y} C ${firstControl.x} ${firstControl.y}, ${secondControl.x} ${secondControl.y}, ${end.x} ${end.y}`, midpoint };
    }

    path(start, end, sourceSide = 'right', targetSide = 'left') {
      return this.curve(start, end, sourceSide, targetSide).d;
    }

    commit() {
      clearTimeout(this.saveTimer);
      this.onChange(this.elements, this.connections);
    }
  }

  let instance = null;
  window.IdeasCanvas = {
    render(options) {
      instance?.destroy();
      instance = new IdeasCanvas(options);
      return instance;
    },
    create(type, options) { return instance?.addElement(type, options); },
    destroy() { instance?.destroy(); instance = null; }
  };
})();
