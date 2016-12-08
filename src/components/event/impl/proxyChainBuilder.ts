import * as F from "../../functions";
import {AnyIS} from "./interceptorSpec";

const _terminal: any = {
  callAnd: 2,
  call: 4,
  apply: 2,
  fireEvent: 2,
};

type StackHandler<O extends AnyIS> = (value: O, ...push: any[]) => [O, Function];
type TerminalCallback<O extends AnyIS> = (spec: O) => void;

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
    terminal = F.elvis(last.terminal, terminal);
    accumulator.position = last.position + 1; // TODO call stack concat names for debugger?
    let [stack, step] = last.step(last.stack, ...push);
    accumulator.stack = stack;
    accumulator.step = step;
    accumulator.terminal = terminal === undefined ? undefined : (terminal - 1);
  }
  return accumulator;
}

export default class ProxyChainBuilder<O extends AnyIS> implements ProxyHandler<Accumulator> {
  private _stackHandler: StackHandler<O>;
  private _callback: TerminalCallback<O>;

  constructor(stackHandler: StackHandler<O>, callback: TerminalCallback<O>) {
    this._stackHandler = stackHandler;
    this._callback = callback;
  }

  public target(): Accumulator {
    const acc = newTarget();
    acc.step = this._stackHandler;
    return acc;
  }

  public newProxyChain(...args: any[]) {
    const target = this.target();
    if (args === undefined || args.length === 0) {
      return new Proxy(target, this);
    } else {
      return new Proxy(newTarget(target, args), this);
    }
  }

  public get(target: Accumulator, eventMethod: string, receiver: any): any {
    receiver = receiver;
    return new Proxy(newTarget(target, [eventMethod], _terminal[eventMethod]), this);
  }

  public apply(target: Accumulator, thisArg: any, argArray?: any): any {
    thisArg = thisArg;
    target = newTarget(target, argArray);
    if (target.terminal === 0) {
      this._callback(target.stack); // target.step(target.stack, ...argArray)[0]); // unwrap
    }
    return target.step === undefined ? undefined : new Proxy(target, this);
  }
}
