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

export class RectangularSelection {
  #container;
  #network;
  #nodes;
  #colors;

  #drag = false;
  #rectDOM = {};

  #mousedown;
  #mousemove;
  #mouseup;
  #afterDrawing;
  #preventContextMenu;

  constructor(container, network, nodes, colors) {
    this.#container = container;
    this.#network = network;
    this.#nodes = nodes;
    this.#colors = colors;
  }

  attach() {
    // Prepare callback
    this.#mousedown = (...args) => this.#mousedownListener(...args);
    this.#mousemove = (...args) => this.#mousemoveListener(...args);
    this.#mouseup = (...args) => this.#mouseupListener(...args);
    this.#afterDrawing = (...args) => this.#afterDrawingListener(...args);

    // Listeners
    this.#container.addEventListener("mousedown", this.#mousedown);
    this.#container.addEventListener("mousemove", this.#mousemove);
    this.#container.addEventListener("mouseup", this.#mouseup);
    this.#network.on("afterDrawing", this.#afterDrawing);

    // Disable right click menu
    this.#preventContextMenu = (e) => e.preventDefault();
    this.#container.addEventListener("contextmenu", this.#preventContextMenu);
  }

  detach() {
    // Listeners
    this.#container.removeEventListener("mousedown", this.#mousedown);
    this.#container.removeEventListener("mousemove", this.#mousemove);
    this.#container.removeEventListener("mouseup", this.#mouseup);
    this.#network.off("afterDrawing", this.#afterDrawing);

    // Restore right click menu
    this.#container.removeEventListener(
      "contextmenu",
      this.#preventContextMenu,
    );

    // Remove leftovers
    this.#network.redraw();
  }

  get #rectCanvas() {
    let { x: startX, y: startY } = this.#network.DOMtoCanvas({
      x: this.#rectDOM.startX,
      y: this.#rectDOM.startY,
    });
    let { x: endX, y: endY } = this.#network.DOMtoCanvas({
      x: this.#rectDOM.endX,
      y: this.#rectDOM.endY,
    });
    [startX, endX] = this.#orderPair(startX, endX);
    [startY, endY] = this.#orderPair(startY, endY);
    return { startX, startY, endX, endY };
  }

  #orderPair(a, b) {
    return a < b ? [a, b] : [b, a];
  }

  #selectNodes(mode, event) {
    const { startX, startY, endX, endY } = this.#rectCanvas;

    const selected = this.#nodes
      .get()
      .filter(({ id }) => {
        const { x, y } = this.#network.getPositions(id)[id];
        return startX <= x && x <= endX && startY <= y && y <= endY;
      })
      .map(({ id }) => id);

    this.#network.selectNodes(this.#prepareNodeSelection(selected, mode));

    // Fabricate select event
    // It should be fired because this is user interaction
    const pointerDOM = {
      x: event.offsetX,
      y: event.offsetY,
    };
    this.#network.emit("select", {
      ...this.#network.getSelection(),
      event,
      pointer: {
        DOM: pointerDOM,
        canvas: this.#network.DOMtoCanvas(pointerDOM),
      },
    });
  }

  #prepareNodeSelection(curr, mode) {
    if (mode === "set") {
      return curr;
    }
    const prev = this.#network.getSelectedNodes();
    if (mode === "add") {
      return [...new Set([...prev, ...curr])];
    }
    if (mode === "del") {
      return prev.filter((id) => !curr.includes(id));
    }
  }

  #mousedownListener({ which, offsetX: x, offsetY: y }) {
    if (which === 3) {
      // Init the rectangle
      this.#rectDOM.startX = x - this.#container.offsetLeft;
      this.#rectDOM.startY = y - this.#container.offsetTop;
      this.#rectDOM.endX = x - this.#container.offsetLeft;
      this.#rectDOM.endY = y - this.#container.offsetTop;
      this.#drag = true;
    }
  }

  #mousemoveListener({ which, offsetX: x, offsetY: y }) {
    if (which !== 3 && this.#drag) {
      // Mouse released outside of the container, abort
      this.#drag = false;
      this.#network.redraw();
    } else if (this.#drag) {
      this.#rectDOM.endX = x - this.#container.offsetLeft;
      this.#rectDOM.endY = y - this.#container.offsetTop;
      this.#network.redraw();
    }
  }

  #mouseupListener(event) {
    const { which, ctrlKey, shiftKey } = event;
    if (which === 3) {
      // Select nodes
      this.#drag = false;
      this.#network.redraw();
      this.#selectNodes(keysModeMap[ctrlKey][shiftKey], event);
    }
  }

  #afterDrawingListener(ctx) {
    if (this.#drag) {
      const { startX, startY, endX, endY } = this.#rectCanvas;

      ctx.lineWidth = 4;
      ctx.strokeStyle = this.#colors.border;
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
      ctx.fillStyle = this.#colors.background;
      ctx.fillRect(startX, startY, endX - startX, endY - startY);
    }
  }
}
