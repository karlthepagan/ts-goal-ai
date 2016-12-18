import * as Debug from "../../util/debug";

type NameAndArgs = {name: string, args: any[]|undefined };

interface CaptureTarget {
  count?: number;
  callback?: (properties: NameAndArgs[]) => any;
  properties: NameAndArgs[];
}

export class NameCapture implements ProxyHandler<CaptureTarget> {
  public newTarget(count?: number, callback?: (properties: NameAndArgs[]) => any) {
    if (count !== undefined && callback === undefined) {
      throw new Error("callback required");
    }
    const properties = [];
    return {properties, count, callback} as CaptureTarget;
  }

  public capture(method: (i: any) => Function): string {
    const gets = this.newTarget();
    const capture = new Proxy(gets, this) as any;
    method(capture);
    return gets.properties[0].name;
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
  public captureAsync<T>(count: number, callback: (properties: NameAndArgs[]) => T): (i: any) => T {
    Debug.temporary(); // TODO test this
    const gets = this.newTarget(count, callback); // TODO test deep replacement
    return new Proxy(gets, this) as any;
  }

  public get (target: CaptureTarget, name: string, receiver: any): any {
    // Proxy coerces p into a string
    const args = undefined;
    target.properties.push({name, args});
    if (target.count !== undefined) {
      target.count--;
    }

    return receiver;
  }

  public apply(target: CaptureTarget, thisArg: any, argArray?: any): any {
    if (target.count === 0) {
      // TODO assertion function?
      return (target.callback as any)(target.properties)(argArray) as any;
    }

    target.properties[target.properties.length - 1].args = argArray;

    return thisArg;
  }
}

const NAME_CAPTURE = new NameCapture();
export default NAME_CAPTURE;
