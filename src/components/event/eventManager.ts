import Named from "../named";
import {EventRegistry} from "./api/index";
import ProxyChainBuilder from "./impl/proxyChainBuilder";
import {registerBehavior, scheduleExec} from "./behaviorContext";
import {AnyEvent} from "./impl/eventSpec";
import {eventSelectorGet} from "./api/eventSpecBuilder";
import {whenClosureGet} from "./api/interceptorSpecBuilders";
import {actionGet, EMITTING_CALLS} from "./api/builders";
import ScheduleSpec from "./impl/scheduledSpec";
import InterceptorSpec from "./impl/interceptorSpec";
import State from "../state/abstractState";

export default class EventManager implements EventRegistry {
  private _events = new ProxyChainBuilder<AnyEvent>(EMITTING_CALLS,
    (value: AnyEvent, methodName: string) => {
      if (value === undefined) {
        return eventSelectorGet(methodName);
      } else {
        throw new Error("unexpected state. value=" + value);
      }
    },
    (spec) => {
      // cleanup, erase constructor info
      const is = Object.create(spec); // was .clone();
      is.unresolve();
      delete is.targetConstructor;
      registerBehavior("event", is);
    }
  );

  private _intercepts = new ProxyChainBuilder<AnyEvent>(EMITTING_CALLS,
    (initial: AnyEvent, constructor: Constructor<State<any>>) => { // intercept
      initial = initial;
      const is = InterceptorSpec.fromConstructor(constructor);
      return [is, whenClosureGet];
    },
    (spec) => {
      // cleanup, erase constructor info
      const is = Object.create(spec); // was .clone();
      is.unresolve();
      registerBehavior("intercept", is);
    }
  );

  private _scheduler = new ProxyChainBuilder<ScheduleSpec<any, any>>(EMITTING_CALLS,
    (initial: ScheduleSpec<any, any>, relativeTime: number, instance: Named) => {
      initial = initial;
      const is = ScheduleSpec.fromTimeAndInstance(relativeTime, instance);
      return [is, actionGet(undefined)];
    },
    (spec) => {
      spec = Object.create(spec); // was .clone();
      spec.unresolve();
      spec.actionArgs = spec.actionArgs.slice(1); // TODO cleanup
      scheduleExec("scheduled", spec);
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
