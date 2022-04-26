// [ctrl][shift]
const keysModeMap = {
  false: {
    false: "set",
    true: "add",
  },
  true: {
    false: "del",
    true: "set",
  },
};

export default class {
  constructor(container, network, nodes, colors) {
    this._container = container;
    this._network = network;
    this._nodes = nodes;
    this._colors = colors;

    this._drag = false;
    this._rectDOM = {};
  }

  attach() {
    // Prepare callback
    this._mousedown = (...args) => this._mousedownListener(...args);
    this._mousemove = (...args) => this._mousemoveListener(...args);
    this._mouseup = (...args) => this._mouseupListener(...args);
    this._afterDrawing = (...args) => this._afterDrawingListener(...args);

    // Listeners
    this._container.addEventListener("mousedown", this._mousedown);
    this._container.addEventListener("mousemove", this._mousemove);
    this._container.addEventListener("mouseup", this._mouseup);
    this._network.on("afterDrawing", this._afterDrawing);

    // Disable right click menu
    this._oncontextmenu = this._container.oncontextmenu;
    this._container.oncontextmenu = () => false;
  }

  detach() {
    // Listeners
    this._container.removeEventListener("mousedown", this._mousedown);
    this._container.removeEventListener("mousemove", this._mousemove);
    this._container.removeEventListener("mouseup", this._mouseup);
    this._network.off("afterDrawing", this._afterDrawing);

    // Restore right click menu
    this._container.oncontextmenu = this._oncontextmenu;

    // Remove leftovers
    this._network.redraw();
  }

  get _rectCanvas() {
    let { x: startX, y: startY } = this._network.DOMtoCanvas({
      x: this._rectDOM.startX,
      y: this._rectDOM.startY,
    });
    let { x: endX, y: endY } = this._network.DOMtoCanvas({
      x: this._rectDOM.endX,
      y: this._rectDOM.endY,
    });
    [startX, endX] = this._orderPair(startX, endX);
    [startY, endY] = this._orderPair(startY, endY);
    return { startX, startY, endX, endY };
  }

  _orderPair(a, b) {
    return a < b ? [a, b] : [b, a];
  }

  _selectNodes(mode, event) {
    const { startX, startY, endX, endY } = this._rectCanvas;

    const selected = this._nodes
      .get()
      .filter(({ id }) => {
        const { x, y } = this._network.getPositions(id)[id];
        return startX <= x && x <= endX && startY <= y && y <= endY;
      })
      .map(({ id }) => id);

    this._network.selectNodes(this._prepareNodeSelection(selected, mode));

    // Fabricate select event
    // It should be fired because this is user interaction
    const pointerDOM = {
      x: event.offsetX,
      y: event.offsetY,
    };
    this._network.emit("select", {
      ...this._network.getSelection(),
      event,
      pointer: {
        DOM: pointerDOM,
        canvas: this._network.DOMtoCanvas(pointerDOM),
      },
    });
  }

  _prepareNodeSelection(curr, mode) {
    if (mode === "set") {
      return curr;
    }
    const prev = this._network.getSelectedNodes();
    if (mode === "add") {
      return [...new Set([...prev, ...curr])];
    }
    if (mode === "del") {
      return prev.filter((id) => !curr.includes(id));
    }
  }

  _mousedownListener({ which, offsetX: x, offsetY: y }) {
    if (which === 3) {
      // Init the rectangle
      this._rectDOM.startX = x - this._container.offsetLeft;
      this._rectDOM.startY = y - this._container.offsetTop;
      this._rectDOM.endX = x - this._container.offsetLeft;
      this._rectDOM.endY = y - this._container.offsetTop;
      this._drag = true;
    }
  }

  _mousemoveListener({ which, offsetX: x, offsetY: y }) {
    if (which !== 3 && this._drag) {
      // Mouse released outside of the container, abort
      this._drag = false;
      this._network.redraw();
    } else if (this._drag) {
      this._rectDOM.endX = x - this._container.offsetLeft;
      this._rectDOM.endY = y - this._container.offsetTop;
      this._network.redraw();
    }
  }

  _mouseupListener({ which, ctrlKey, shiftKey }) {
    if (which === 3) {
      // Select nodes
      this._drag = false;
      this._network.redraw();
      this._selectNodes(keysModeMap[ctrlKey][shiftKey], event);
    }
  }

  _afterDrawingListener(ctx) {
    if (this._drag) {
      const { startX, startY, endX, endY } = this._rectCanvas;

      ctx.lineWidth = 4;
      ctx.strokeStyle = this._colors.border;
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
      ctx.fillStyle = this._colors.background;
      ctx.fillRect(startX, startY, endX - startX, endY - startY);
    }
  }
}
