let tracked: Set<Signal<any>> = new Set();
const trackStack: Set<Signal<any>>[] = [];

export function pushTrackStack() {
  trackStack.push(tracked);
  tracked = new Set();
}

export function popTrackStack() {
  const current = tracked;
  tracked = trackStack.pop()!;
  return current;
}

export const signalSymbol = Symbol("signal");

export function signal<T>(defaultValue: T) {
  const listeners = new Set<(value: T) => void>();
  const obj = {
    subscribe(listener: (value: T) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit(value: T) {
      listeners.forEach((listener) => listener(value));
    },
    value: defaultValue,
    [signalSymbol]: true as const,
  };

  const proxy = new Proxy(obj, {
    get(target, prop) {
      if (prop === "value") {
        tracked.add(target as Signal<T>);
      }
      if (prop === signalSymbol) {
        return true;
      }
      return target[prop as keyof typeof target];
    },
    set(target, prop, value) {
      target[prop as keyof typeof target] = value;
      if (prop === "value") {
        target.emit(value);
      }
      return true;
    },
  });

  return proxy;
}

export type Signal<T> = ReturnType<typeof signal<T>> & {
  [signalSymbol]: true;
};
