export interface CaptureTarget {
  count?: number;
  callback?: (names: string[]) => any;
  names: string[]; // TODO this will only be strings, see HACK below
}

export class NameCapture implements ProxyHandler<CaptureTarget> {
  public newTarget(count?: number, callback?: (names: string[]) => any) {
    if (count !== undefined && callback === undefined) {
      throw new Error("callback required");
    }
    const names: string[] = [];
    return {names, count, callback};
  }

  public capture(method: (i: any) => Function): string {
    const gets = this.newTarget();
    const capture = new Proxy(gets, this) as any;
    method(capture);
    return gets.names[0];
  }

  /**
   * not really async, but it captures names via callback
   *
   * use-case
   * capture(Class).classMethod(args);
   *               ^ = T
   *
   * where T is Function that is executed and captures args, then the callback provides
   * the names to reach it.
   *
   * Intermediate function calls are too complex for this class, use proxyChainBuilder for that.
   */
  public captureAsync<T>(count: number, callback: (names: string[]) => T): (i: any) => T {
    debugger; // TODO test this
    const gets = this.newTarget(count, callback); // TODO test deep replacement
    return new Proxy(gets, this) as any;
  }

  public get (target: CaptureTarget, p: string, receiver: any): any {
    // Proxy coerces p into a string
    target.names.push(p);
    if (target.count !== undefined) {
      target.count--;
    }

    return receiver;
  }

  public apply(target: CaptureTarget, thisArg: any, argArray?: any): any {
    if (target.count === 0) {
      // TODO assertion function?
      return (target.callback as any)(target.names)(argArray) as any;
    }

    return thisArg;
  }
}

const NAME_CAPTURE = new NameCapture();
export default NAME_CAPTURE;
