import * as F from "../../functions";
import getConstructor from "../../types";

export default class Joinpoint<I, T> {
  public static forInstance<T>(instance: T, id: string) {
    const jp = new Joinpoint<T, any>();
    jp.className = F.getType(instance);
    jp.objectId = id;
    return jp;
  }

  public static newEvent(name: string, template?: Joinpoint<any, any>) {
    const jp = template === undefined ? new Joinpoint<any, any>() : Object.create(template);
    // TODO? refactor from "__events__", name to targetType, "__events__$name"
    jp.category = "__events__";
    jp.method = name;
    return jp;
  }

  public static withSource<X>(src: Joinpoint<any, any>, dstInstance?: X, dstId?: string) {
    if (dstInstance === undefined) {
      const jp = src.clone();
      jp.unresolve();
      jp.source = jp.clone();
      return jp;
    }
    const jp = new Joinpoint<X, any>();
    jp.className = F.getType(dstInstance);
    jp.objectId = dstId;
    jp.args = src.args.concat();
    jp.target = dstInstance;
    jp.returnValue = src.returnValue;
    jp.thrownException = src.thrownException;
    jp.source = src.clone();
    jp.source.unresolve();
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

  public clone<R extends Joinpoint<I, T>>(into?: R): R {
    if (into === undefined) {
      into = new Joinpoint<I, T>() as R;
    }
    into.className = this.className;
    into.method = this.method;
    if (this.objectId !== undefined) {
      into.objectId = this.objectId;
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
    if (this.source !== undefined) {
      into.source = this.source;
    }
    return into;
  }

  public isRegisterable(): boolean {
    return !(this.getMatchingClass() === undefined
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

  public resolve() {
    const ctor = getConstructor(this.className) as any;
    this.target = ctor.vright(this.objectId as string); // TODO silly convention
    // TODO method -> set proceedApply
    if (this.source !== undefined) {
      this.source.resolve();
    }
  }

  /**
   * throw out anything that won't survive memory
   */
  public unresolve() {
    delete this.target;
    delete this.proceedApply;
  }
}
