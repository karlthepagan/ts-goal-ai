type StackHandler<O> = (value: O, ... push: any[]) => [O, Function];
type TerminalCallback<O> = (spec: O) => void;
type Map<T> = { [key: string]: T };

interface Accumulator {
  stack: any;
  step: Function;
  position: number;
  terminal: number|undefined;
}

function newTarget(last?: Accumulator, push?: any[], terminal?: number): Accumulator {
  const accumulator: Accumulator = (() => undefined) as any;
  if (last === undefined) {
    accumulator.position = 0;
    accumulator.terminal = terminal;
  } else {
    if (push === undefined) {
      push = [];
    }
    accumulator.position = last.position + 1; // TODO call stack concat names for debugger?
    let [stack, step] = last.step(last.stack, ...push);  // TODO NOW spread bad es6 perf
    accumulator.stack = stack;
    accumulator.step = step;
    // last & param == undef -> undef, otherwise last.terminal takes priority
    terminal = last.terminal === undefined ? terminal : last.terminal;
    accumulator.terminal = terminal === undefined ? undefined : (terminal - 1);
  }
  return accumulator;
}

export default class ProxyChainBuilder<O> implements ProxyHandler<Accumulator> {
  private _stackHandler: StackHandler<O>;
  private _callback: TerminalCallback<O>;
  /**
   * defines number of steps to emit the callback after a given method is invoked
   */
  private _terminal: Map<number>;

  constructor(terminal: Map<number>, stackHandler: StackHandler<O>, callback: TerminalCallback<O>) {
    this._stackHandler = stackHandler;
    this._callback = callback;
    this._terminal = terminal;
  }

  public target(): Accumulator {
    const acc = newTarget();
    acc.step = this._stackHandler;
    return acc;
  }

  public newProxyChain( ... args: any[]) {
    const target = this.target();
    if (args === undefined || args.length === 0) {
      return new Proxy(target, this);
    } else {
      return new Proxy(newTarget(target, args), this);
    }
  }

  public get(target: Accumulator, eventMethod: string): any {
    return new Proxy(newTarget(target, [eventMethod], this._terminal[eventMethod]), this);
  }

  public apply(target: Accumulator, thisArg: any, argArray?: any): any {
    thisArg = thisArg; // TODO webpack smell
    target = newTarget(target, argArray);
    if (target.terminal === 0) {
      this._callback(target.stack);
    }
    return target.step === undefined ? undefined : new Proxy(target, this);
  }
}
