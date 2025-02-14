import { signal, Signal, signalSymbol } from "./signal";

type BaseAcceptedNode =
  | Node
  | string
  | number
  | null
  | undefined
  | (() => AcceptedNode)
  | Signal<AcceptedNode>;

export type AcceptedNode =
  | BaseAcceptedNode
  | AcceptedNode[];

export function tag(
  tagName: string,
  attributes: Record<string, string>,
  listeners: Record<string, (event: Event) => void>,
  children: AcceptedNode[]
) {
  return function () {
    const node = document.createElement(tagName);

    for (const [key, value] of Object.entries(attributes)) {
      node.setAttribute(key, value);
    }

    for (const [key, value] of Object.entries(listeners)) {
      node.addEventListener(key, value);
    }

    const childNodes = children.map(getNodeValue).flat();
    childNodes.forEach((child, i) => {
      node.appendChild(child.node);
      if (child.subscribe) {
        child.subscribe((newChild) => {
          node.replaceChild(newChild, node.childNodes[i]);
        });
      }
    });

    return node;
  };
}

type ResultNode = {
  node: Node;
  subscribe?: (cb: (node: Node) => void) => void;
};

function getNodeValue(value: AcceptedNode): ResultNode[] {
  if (value === null || value === undefined) {
    return [];
  }
  switch (typeof value) {
    case "function": {
      const result = value();
      if (Array.isArray(result)) {
        const arr = [];
        for (const item of result) {
          arr.push(...getNodeValue(item));
        }
        return arr;
      }
      return getNodeValue(result);
    }
    case "object": {
      if (value instanceof Node) {
        return [{ node: value }];
      }
      if (Array.isArray(value)) {
        const arr = [];
        for (const item of value) {
          arr.push(...getNodeValue(item));
        }
        return arr;
      }
      if (value[signalSymbol]) {
        const fragNode = document.createDocumentFragment();
        const newSignal = signal(fragNode);
        const children: ResultNode[] = [];
        const rerender = (index: number, node: Node) => {
          fragNode.replaceChild(node, fragNode.childNodes[index]);
        };
        const render = () => {
          children.length = 0;
          fragNode.textContent = "";
          const result = getNodeValue(value.value);
          result.forEach((child, i) => {
            fragNode.appendChild(child.node);
            if (child.subscribe) {
              child.subscribe(rerender.bind(null, i));
            }
            children.push(child);
          });
          newSignal.value = fragNode;
        };
        value.subscribe(render);
        render();
        return [
          { node: fragNode, subscribe: newSignal.subscribe.bind(newSignal) },
        ];
      }
      console.error("Invalid value", value);
      return [];
    }
    case "string":
    case "number": {
      return [{ node: document.createTextNode(value.toString()) }];
    }
    default: {
      console.error("Invalid value", value);
      return [];
    }
  }
}

export function text(strings: TemplateStringsArray, ...values: AcceptedNode[]) {
  const result: AcceptedNode[] = [];

  for (let i = 0; i < strings.length; i++) {
    result.push(strings[i]);
    if (i < values.length) {
      result.push(values[i]);
    }
  }

  return result;
}

export function render(node: AcceptedNode, target: HTMLElement) {
  target.textContent = "";
  for (const child of getNodeValue(node)) {
    target.appendChild(child.node);
  }
}
