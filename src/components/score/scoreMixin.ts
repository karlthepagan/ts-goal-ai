import State from "../state/abstractState";
import * as Debug from "../util/debug";

class GetDefaultProxy<T extends State<any>> implements ProxyHandler<ScoreMixin<T>> {
  public get(target: ScoreMixin<T>, p: PropertyKey): any {
    const existing = (target as any)[p];
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

  protected _state: T;
  private _timeFunctions?: { [stat: string]: string };

  constructor(state: T) {
    this._state = state;
  }

  /**
   * cache a set or computed value until the scheduled time
   * @param timeFunctionRef name of this mixin's relative time function
   * @param valueFunction
   * @returns {()=>number}
   */
  public timed(timeFunctionRef: string, valueFunction: () => number|undefined): () => number {
    if (!this._timeFunctions) {
      this._timeFunctions = {};
    }
    this._timeFunctions[valueFunction.name] = timeFunctionRef;
    return () => { // binding this
      Debug.always("observe function wrapping");
      const expiration = this._getTime(valueFunction.name);
      const value = this._getScore(valueFunction.name); // TODO this function name!
      if (value !== undefined && expiration !== undefined && expiration <= Game.time) { // TODO Game.time
        return value;
      } else {
        const computed = valueFunction();
        if (computed === undefined) {
          Debug.always("unscored " + valueFunction.name);
          return 0;
        }
        this._setScore(valueFunction.name, computed);
        this._updateTime(valueFunction.name, timeFunctionRef);
        return computed;
      }
    };
  }

  public cached(valueFunction: () => number|undefined): () => number {
    return () => {
      const computed = valueFunction();
      if (computed === undefined) {
        return 0;
      }
      this._setScore(valueFunction.name, computed);
      return computed;
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

  public timeout(name: string) {
    this._clearTime(name);
  }

  protected _updateTime(name: string, timeFunctionRef: string) {
    const timeFunction = (this as any)[timeFunctionRef] as () => number;

    this._setTime(name, Game.time + timeFunction()); // TODO Game.time
  }

  protected _getTime(name: string): number|undefined {
    return this._state.memory.score_time[name];
  }

  protected _setTime(name: string, value: number) {
    this._state.memory.score_time[name] = value;
  }

  protected _clearTime(name: string, ) {
    delete this._state.memory.score_time[name];
  }

  protected _getScore(name: string): number|undefined {
    return this._state.memory.score[name];
  }

  protected _setScore(name: string, value: number) {
    this._state.memory.score[name] = value;
  }
}
