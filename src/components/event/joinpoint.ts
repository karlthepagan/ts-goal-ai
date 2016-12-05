export default class Joinpoint<I, T> {
  public className: string;
  public objectId?: string;
  public target?: I;
  public method: string;
  public args: any[] = [];
  public returnValue?: T;
  public thrownException?: string|Error;
  public proceedApply?: Function;

  constructor(className: string, method: string, objectId?: string) {
    this.className = className;
    this.method = method;
    this.objectId = objectId;
  }

  public proceed(): T {
    if (this.proceedApply === undefined) {
      throw new Error("method not resolved");
    }

    if (this.target === undefined) {
      throw new Error("target not resolved");
    }

    try {
      return this.returnValue = this.proceedApply.apply(this.target, this.args);
    } catch (err) {
      this.thrownException = err;
      throw err;
    }
  }

  public asVoid(): Joinpoint<I, void> {
    return this.map( () => undefined ) as any;
  }

  public map<R>(f: () => R): Joinpoint<I, R> {
    f = f; // TODO write transformation
    return this as any;
  }
}
