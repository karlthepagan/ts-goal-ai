export type AnyJP = Joinpoint<any, any>;

export default class Joinpoint<I, T> {
  public className: string;
  public objectId?: string;
  public target?: I;
  // public targetType?: string; // TODO consider this to disambiguate event dispatch from source (also useful for intercepting!)
  public method: string;
  public args: any[];
  public proceedApply?: Function;
  public returnValue?: T;
  public thrownException?: string|Error;
  // public source?: any;

  constructor(className: string, method: string, objectId?: string) {
    this.className = className;
    this.method = method;
    this.objectId = objectId;
  }

  public clone<R extends Joinpoint<I, T>>(into?: R): R {
    if (into === undefined) {
      into = new Joinpoint<I, T>(this.className, this.method, this.objectId) as R;
    }
    into.target = this.target;
    if (this.args !== undefined) {
      into.args = this.args.concat();
    }
    into.proceedApply = this.proceedApply;
    into.returnValue = this.returnValue;
    into.thrownException = this.thrownException;
    // into.source = this.source;
    return into;
  }

  public isRegisterable(): boolean {
    return !(this.className === undefined
      || this.method === undefined
    );
  }

  public isCaptured(): boolean {
    return !(this.className === undefined
      || this.method === undefined
      || this.objectId === undefined
      || this.target === undefined
      || this.proceedApply === undefined
    );
  }

  public isReturned(): boolean {
    // TODO undefined holder for void return value?
    return !(this.className === undefined
      || this.method === undefined
      || this.objectId === undefined
      || this.thrownException !== undefined
    );
  }

  public isFailed(): boolean {
    return !(this.thrownException === undefined);
  }

  public proceed(): T {
    try {
      return this.returnValue = (this.proceedApply as Function).apply(this.target, this.args);
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

  // TODO resolve takes targetType || className -> set target, method -> set proceedApply

  /**
   * throw out anything that won't survive memory
   */
  public unresolve() {
    delete this.target;
    delete this.proceedApply;
  }
}
