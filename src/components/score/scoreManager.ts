import * as F from "../functions";
import ScoreHandler from "./scoreHandler";
import Named from "../named";
import {log} from "../support/log";

export const SCORE_KEY = "score";
export const TIME_KEY = "time";

function defaultScore(state: any, score: ScoreManager<any>, time: number) {
  const memory = state.memory(SCORE_KEY);
  return _.sum(score.getMetricKeys(state), function(key) {
    return score.getOrRescore(state, memory, key, time);
  });
}

export default class ScoreManager<C> {
  private _metricKeys: { [key: string]: string[] } = {};
  private _metrics: { [key: string]: { [className: string]: ScoreHandler<Named, C> } } = {};

  private _context: C;

  public addMetric(name: string, metric: string) {
    if (metric !== SCORE_KEY) {
      F.expand([ name ], this._metricKeys, true).push(metric);
    }
    if (metric === TIME_KEY) {
      throw new Error("illegal argument");
    }
    if (this._metrics[metric] === undefined) {
      this._metrics[metric] = {};
    }
  }

  public addHandler<T extends Named>(name: string, handlers: { [key: string]: ScoreHandler<T, C> }) {
    for (const key in handlers) {
      this.addMetric(name, key);

      this._metrics[key][name] = handlers[key];
    }
  }

  public getHandler(metric: string, className: string): ScoreHandler<Named, C>|undefined {
    if (metric === SCORE_KEY) {
      return defaultScore;
    }

    const metricHandlers = this._metrics[metric];
    if (metricHandlers === undefined) {
      return undefined;
    }

    return metricHandlers[className];
  }

  public setContext(context: C) {
    this._context = context;
  }

  public getContext(): C {
    return this._context;
  }

  public getOrRescore(object: Named, memory: any, metric?: string, time?: number) {
    const value = this.getScore(memory, metric, time); // TODO time should always be undefined?
    if (value === undefined || value === null) {
      return this.rescore(object, memory, metric, time);
    }
    return value;
  }

  // TODO higher order sum? call like: return score.sum("venergy", state.eachSource, s => s.memory(SCORE_KEY));
  // public sum<T extends Named>(time: number, metric: string,
  // visitor: (callback: (o: T) => any) => any[], mem: (o: T) => any): number {
  //   return _(visitor(object => {
  //     return this.getOrRescore(object, mem(object), time, metric);
  //   })).sum();
  // }

  /**
   * @param time - if undefined or < 0 always retrieve, otherwise return undefined (indicating update needed)
   *    when time strictly greater than stored value
   * @return {number} if the stored value is present for the given tick
   */
  public getScore(memory: any, metric: string|undefined, time: number|undefined): number|undefined {
    if (metric === undefined) {
      metric = SCORE_KEY;
    }
    if (time === undefined || time < 0) {
      return memory[metric];
    }
    const memTime = memory[TIME_KEY] as number;
    if (memTime === undefined || time > memTime) {
      return undefined;
    }
    return memory[metric];
  }

  public getMetricKeys(object: Named): string[] {
    return this._metricKeys[object.className()];
  }

  /**
   * @param object - metric source, sent to handlers
   * @param memory - where to store data
   * @param time - memory time updated to abs(time)
   *    if undefined results will not be not stored
   * @param metric - what to score and return, if undefined re-score all registered metrics, return their sum
   * @param value - if undefined set the given metric to this value
   * @return {number}
   */
  public rescore(object: Named, memory: any, metric: string|undefined, time: number|undefined, value?: number): number {

    let metrics: string[];

    if (metric === undefined) {
      metric = SCORE_KEY;
      metrics = this.getMetricKeys(object).concat(SCORE_KEY);
    } else {
      metrics = [ metric ];
    }

    if (value === null) {
      log.debug("null value", metric, object);
      throw new Error("null value");
    }

    if (value === undefined) {

      value = 0;

      for (const submetric of metrics) {
        const handler = this.getHandler(submetric, object.className());

        if (handler === undefined) {
          log.debug("no scoring handler", submetric, object);
        } else {
          const rval = handler(object, this, time);
          if (rval === null || rval === undefined) {
            log.error("no result", submetric, object);
            throw new Error("no result");
          }
          value = rval;
          if (time !== undefined) {
            memory[submetric] = rval;
          }
        }
      }

      if (time !== undefined) {
        memory[TIME_KEY] = Math.abs(time);
      }

      return value;
    }

    if (time !== undefined) {
      memory[metric] = value;
      memory[TIME_KEY] = Math.abs(time);
    }

    return value;
  }

  public byScore<T extends Named>(metric?: string, time?: number|undefined): (object: T) => number {
    return (mem: any) => { // captures THIS
      const score = this.getScore(mem, metric, time);
      // log.info("got", metric, "score", score);
      return F.elvis(score, -1);
    };
  }
}
