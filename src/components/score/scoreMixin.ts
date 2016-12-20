import State from "../state/abstractState";
import * as Debug from "../util/debug";

class GetDefaultProxy<T extends State<any>> implements ProxyHandler<ScoreMixin<T>> {
  public get(target: ScoreMixin<T>, p: PropertyKey, receiver: any): any {
    receiver = receiver;
    const existing = (target as any)[p] as Function;
    if (existing) {
      return existing;
    }

    const value = target.getScore(p as string);

    return function() {
      return value;
    };
  }
}

const GET_DEFAULT_PROXY = new GetDefaultProxy<any>();

export default class ScoreMixin<T extends State<any>> {
  public static withDefaults<X extends State<any>>(state: X): ScoreMixin<X> {
    return new Proxy(new ScoreMixin<X>(state), GET_DEFAULT_PROXY);
  }

  /**
   * cache a set or computed value until the scheduled time
   * @param mixin the decorating class
   * @param timeFunctionRef name of this mixin's relative time function
   * @param valueFunction
   * @returns {()=>number}
   */
  public static timed(proto: ScoreMixin<any>, timeFunctionRef: string, valueFunction: () => number|undefined): () => number {
    if (!proto._timeFunctions) {
      proto._timeFunctions = {};
    }
    proto._timeFunctions[valueFunction.name] = timeFunctionRef;
    return function() {
      const expiration = this._getTime(valueFunction.name);
      const value = this._getScore(valueFunction.name); // TODO this function name!
      if (value !== undefined && !(expiration > Game.time)) { // TODO Game.time
        return value;
      } else {
        const computed = valueFunction.apply(this);
        if (computed === undefined) {
          Debug.always("unscored " + valueFunction.name);
          return 0;
        }
        this.timeoutScore(valueFunction.name);
        this._setScore(valueFunction.name, computed);
        this._updateTime(valueFunction.name, timeFunctionRef);
        return computed;
      }
    };
  }

  public static memoized(valueFunction: () => number|undefined): () => number {
    return function() {
      const saved = this._getScore(valueFunction.name);
      if (saved !== undefined) {
        return saved;
      }
      return this._computeAndSave(valueFunction);
    };
  }

  protected _state: T;
  private _timeFunctions?: { [stat: string]: string };

  constructor(state: T) {
    this._state = state;
  }

  public saved(valueFunction: () => number|undefined): () => number {
    return function() {
      return this._computeAndSave(valueFunction);
    };
  }

  public copyScore(dstMetric: string, srcMetric: string): boolean {
    const value = this._getScore(srcMetric);
    if (value !== undefined) {
      this._setScore(dstMetric, value);
      return true;
    }
    return false;
  }

  public getScore(name: string): number {
    const value = this._getScore(name);
    if (value === undefined) {
      return 0;
    }
    return value;
  }

  public setScore(name: string, value: number) {
    this._setScore(name, value);

    const timeFunctionRef = this._timeFunctions ? this._timeFunctions[name] : undefined;

    if (timeFunctionRef) {
      this._updateTime(name, timeFunctionRef);
    }
  }

  public clearScore(name: string) {
    delete this._state.memory.score[name];
  }

  public timeoutScore(name: string) {
    delete this._state.memory.score_time[name];
  }

  protected _computeAndSave(valueFunction: () => number|undefined): number {
    const computed = valueFunction.apply(this);
    if (computed === undefined) {
      return 0;
    }
    this._setScore(valueFunction.name, computed);
    return computed;
  }

  protected _updateTime(name: string, timeFunctionRef: string) {
    const timeFunction = (this as any)[timeFunctionRef] as () => number;

    this._setTime(name, Game.time + timeFunction.apply(this)); // TODO Game.time
  }

  protected _getTime(name: string): number|undefined {
    return this._state.memory.score_time[name];
  }

  protected _setTime(name: string, value: number) {
    this._state.memory.score_time[name] = value;
  }

  protected _getScore(name: string): number|undefined {
    return this._state.memory.score[name];
  }

  protected _setScore(name: string, value: number) {
    this._state.memory.score[name] = value;
  }
}
