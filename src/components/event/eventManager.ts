import {log} from "../support/log";
import * as F from "../functions";
import Named from "../named";
import {EventRegistry} from "./index";
import ProxyChainBuilder from "../behavior/proxyChainBuilder";
import {registerBehavior} from "../behavior/behaviorContext";
import {AnyIS, default as InterceptorSpec} from "./interceptorSpec";
import Joinpoint from "./joinpoint";
import {eventSelectorGet} from "./eventSpecBuilder";
import {whenClosureGet} from "./interceptorSpecBuilders";
import {actionGet} from "./builders";
import ScheduleSpec from "./scheduledSpec";

export default class EventManager implements EventRegistry {
  private _events = new ProxyChainBuilder<AnyIS>(
    (value: AnyIS, methodName: string) => {
      if (value === undefined) {
        return eventSelectorGet(methodName);
      } else {
        throw new Error("unexpected state. value=" + value);
      }
    },
    (spec) => {
      // cleanup, erase constructor info
      const is = spec.clone();
      delete is.targetConstructor;
      registerBehavior("event", is);
    }
  );

  private _intercepts = new ProxyChainBuilder<AnyIS>(
    (initial: AnyIS, constructor: Constructor<any>) => { // intercept
      initial = initial;
      const is = new InterceptorSpec<any, any>();
      is.definition = new Joinpoint<any, any>(constructor.name, "?");
      is.targetConstructor = constructor;
      return [is, whenClosureGet];
    },
    (spec) => {
      // cleanup, erase constructor info
      const is = spec.clone();
      delete is.targetConstructor;
      registerBehavior("intercept", is);
    }
  );

  private _scheduler = new ProxyChainBuilder<ScheduleSpec<any, any>>(
    (initial: ScheduleSpec<any, any>, relativeTime: number, instance: Named) => {
      // TODO instance? YES it becomes the parameter in my joinpoint
      // waitApply(actionGet(undefined))(initial, relativeTime)
      if (isNaN(relativeTime)) {
        debugger; // illegal relativeTime
        throw new Error("illegal relativeTime");
      }
      if (relativeTime < 1) {
        throw new Error("illegal relativeTime=" + relativeTime);
      } else {
        relativeTime += F.elvis(this.dispatchTime(), Game.time); // TODO should we fastforward ever?
        // tick = F.expand([ "timeline", "" + relativeTime ], this.memory()) as Tick;
      }

      initial = initial;
      const is = new ScheduleSpec<any, any>();
      is.relativeTime = relativeTime; // schedule case is like a no-op followed by .wait(number)
      is.definition = new Joinpoint<any, any>(instance.constructor.name, "?");
      is.definition.target = instance;
      return [is, actionGet(undefined)];
    },
    (spec) => {
      // TODO clone? or NOT to clone?, continue to pass it down the chain and let it be built????
      // TODO delete spec.targetConstructor; // will be cleaned up in next action
      const relativeTime = spec.relativeTime;

      log.debug("TODO schedule event for ", relativeTime);
      // const tick = F.expand([ "timeline", "" + relativeTime ], this.memory()) as SpecMap;
    }
  );

  private _dispatchTime: number|undefined;

  public dispatchTime(): number|undefined {
    return this._dispatchTime;
  }

  public when() {
    return this._events.newProxyChain() as any;
  }

  public intercept(implType: any) {
    return this._intercepts.newProxyChain(implType) as any;
  }

  public schedule<T extends Named>(relativeTime: number, instance: T) { // : Action<OnScheduled, INST, void> {
    return this._scheduler.newProxyChain(relativeTime, instance) as any;
  }
}
