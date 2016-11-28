import * as F from "../functions";
import ScoreHandler from "./scoreHandler";
import Named from "../named";
import {log} from "../support/log";

export default class ScoreManager<C> {
  private _metricKeys: { [key: string]: string[] } = {};
  private _metrics: { [key: string]: { [className: string]: ScoreHandler<Named, C> } } = {};
  private _context: C;

  public addMetric(type: Named, metric: string) {
    if (metric !== "score") {
      F.expand([ type.className() ], this._metricKeys, true).push(metric);
    }
    if (this._metrics[metric] === undefined) {
      this._metrics[metric] = {};
    }
  }

  public addHandler<T extends Named>(type: T, handlers: { [key: string]: ScoreHandler<T, C> }) {
    for (const key in handlers) {
      this.addMetric(type, key);

      this._metrics[key][type.className()] = handlers[key];
    }
  }

  public getHandler(metric: string, className: string): ScoreHandler<Named, C>|undefined {
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

  public getOrRescore(object: Named, memory: any, time: number|undefined, metric?: string) {
    const value = this.getScore(memory, time, metric);
    if (value === undefined || value === null) {
      return this.rescore(object, memory, time, metric);
    }
    return value;
  }

  /**
   * @param time - if undefined or < 0 always retrieve, otherwise return undefined (indicating update needed)
   *    when time strictly greater than stored value
   * @return {number} if the stored value is present for the given tick
   */
  public getScore(memory: any, time?: number|undefined, metric?: string): number|undefined {
    if (metric === undefined) {
      metric = "score";
    }
    if (time === undefined || time < 0) {
      return memory[metric];
    }
    const memTime = memory[metric + ".time"] as number;
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
  public rescore(object: Named, memory: any, time: number|undefined, metric?: string, value?: number): number {

    let metrics: string[];

    if (metric === undefined) {
      metric = "score";
      metrics = this.getMetricKeys(object).concat("score");
    } else {
      metrics = [ metric ];
    }

    if (value === undefined) {

      value = 0;

      for (const submetric of metrics) {
        const handler = this.getHandler(submetric, object.className());

        if (handler === undefined) {
          log.debug("no scoring handler", object);
        } else {
          const rval = handler(object, this, time);
          value = rval;
          if (time !== undefined) {
            memory[submetric] = rval;
            memory[submetric + ".time"] = Math.abs(time);
          }
        }
      }

      return value;
    }

    if (time !== undefined) {
      memory[metric] = value;
      memory[metric + ".time"] = Math.abs(time);
    }

    return value;
  }
}
