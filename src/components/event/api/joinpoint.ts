import {getType} from "../../functions";
export type AnyJP = Joinpoint<any, any>;
import * as F from "../../functions";

export default class Joinpoint<I, T> {
  public static forInstance<T>(instance: T, id: string) {
    return new Joinpoint<T, any>(getType(instance), "?", id);
  }

  public static newEvent(name: string, id: string) {
    // TODO refactor from "__events__", name to targetType, "__event__$name"
    return new Joinpoint<any, any>("__events__", name, id);
  }

  public static withSource<X>(src: Joinpoint<any, T>, dstInstance: X, dstId: string) {
    const jp = new Joinpoint<X, any>(getType(dstInstance), "?", dstId);
    // TODO set source on jp?
    jp.args = src.args.concat();
    jp.target = dstInstance;
    jp.returnValue = src.returnValue;
    jp.thrownException = src.thrownException;
    jp.source = src.clone();
    return jp;
  }

  public className: string;
  public objectId?: string;
  public target: I;
  // this disambiguates event dispatch from source for events & intercepts
  public category?: string;
  public method: string;
  public args: any[];
  public proceedApply?: Function;
  public returnValue?: T;
  public thrownException?: string|Error;
  public source?: Joinpoint<any, any>;

  constructor(className: string, method: string, objectId?: string) {
    this.className = className;
    this.method = method;
    this.objectId = objectId;
  }

  public clone<R extends Joinpoint<I, T>>(into?: R): R {
    if (into === undefined) {
      into = new Joinpoint<I, T>(this.className, this.method, this.objectId) as R;
    }
    if (this.category !== undefined) {
      into.category = this.category;
    }
    if (this.target !== undefined) {
      into.target = this.target;
    }
    if (this.args !== undefined) {
      into.args = this.args.concat();
    }
    if (this.proceedApply !== undefined) {
      into.proceedApply = this.proceedApply;
    }
    if (this.returnValue !== undefined) {
      into.returnValue = this.returnValue;
    }
    if (this.thrownException !== undefined) {
      into.thrownException = this.thrownException;
    }
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

  public getMatchingClass(): string {
    return F.elvis(this.category, this.className);
  }

  // public getInvocationClass(): string {
    // for api intercepts this is the proceeding type
    // for triggers following an intercept use the matching class
    // for event triggers this is the materialized type
  // }

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

  // TODO resolve takes className -> set target, method -> set proceedApply - except for intercept proceed

  /**
   * throw out anything that won't survive memory
   */
  public unresolve() {
    delete this.target;
    delete this.proceedApply;
  }
}
