export type AnyJP = Joinpoint<any, any>;
export function newJP(className: string, method: string, objectId?: string) {
  return new Joinpoint<any, any>(className, method, objectId);
}

export default class Joinpoint<I, T> {
  public className: string;
  public objectId?: string;
  public target: I;
  public method: string;
  public args: any[];
  public proceedApply: Function;
  public returnValue?: T;
  public thrownException?: string|Error;
  public source?: any;

  constructor(className: string, method: string, objectId?: string) {
    this.className = className;
    this.method = method;
    this.objectId = objectId;
  }

  public isValid(): boolean {
    return !(this.className === undefined || this.objectId === undefined || this.target === undefined
      || this.method === undefined || this.args === undefined || this.proceedApply === undefined);
  }

  public proceed(): T {
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
