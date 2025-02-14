let tracked: Set<SignalImpl<any>> = new Set();
const trackStack: Set<SignalImpl<any>>[] = [];

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

class SignalImpl<T> implements Signal<T> {
  private listeners = new Set<(value: T) => void>();
  private _value: T;

  constructor(defaultValue: T) {
    this._value = defaultValue;
  }

  subscribe(listener: (value: T) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(value: T) {
    this.listeners.forEach((listener) => listener(value));
  }

  get value() {
    tracked.add(this);
    return this._value;
  }

  set value(newValue: T) {
    this._value = newValue;
    this.emit(newValue);
  }

  readonly [signalSymbol] = true as const;
}

export interface Signal<T> {
  value: T;
  subscribe(listener: (value: T) => void): () => void;
  [signalSymbol]: true;
}

export function signal<T>(defaultValue: T) {
  return new SignalImpl<T>(defaultValue);
}
