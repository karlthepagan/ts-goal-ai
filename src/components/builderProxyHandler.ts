import {log} from "./support/log";

const _terminal: any = {
  callAnd: true,
  call: true,
  apply: true,
};

class AccumulatorStack {
  private _value: string[][] = [];
  public push(...items: string[][]): number {
    return this._value.push(...items);
  }
}

interface Accumulator {
  stack: AccumulatorStack;
  position: number;
  terminal: boolean;
}

export default class BuilderProxyHandler implements ProxyHandler<Accumulator> {
  public static newTarget(last?: Accumulator, terminal?: boolean): Accumulator {
    const accumulator: Accumulator = (() => undefined) as any;
    if (last === undefined) {
      accumulator.position = 0;
      accumulator.stack = new AccumulatorStack();
      accumulator.terminal = terminal === true;
    } else {
      accumulator.position = last.position + 1;
      accumulator.stack = last.stack;
      accumulator.terminal = terminal === true;
    }
    return accumulator;
  }

  public get(target: Accumulator, eventMethod: string, receiver: any): any {
    receiver = receiver;
    debugger;
    target.stack.push([eventMethod]);
    if (_terminal[eventMethod] === true) {
      // next function call is the end!
      return new Proxy(BuilderProxyHandler.newTarget(target, true), this);
    }

    // TODO tree structure to support multiple call chains
    return new Proxy(BuilderProxyHandler.newTarget(target), this);
    // consider incrementing on each call so that target is forked per call
  }

  public apply(target: Accumulator, thisArg: any, argArray?: any): any {
    debugger;
    target.stack.push(argArray);
    if (target.terminal) {
      log.debug("TODO emit binding registration!"); // TODO THIS NEXT
    }
    return thisArg;
  }
}
