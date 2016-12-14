import InterceptorService from "./impl/interceptorService";
import State from "../state/abstractState";
import * as F from "../functions";
import {botMemory} from "../../config/config";
import {AnyEvent} from "./impl/eventSpec";
import ScheduleSpec from "./impl/scheduledSpec";
import {log} from "../support/log";

export const interceptorService = new InterceptorService();

export function globalLifecycle(state: State<any>, lifecycle: number) {
  switch (lifecycle) {
    case State.LIFECYCLE_NEW:
      debugger;
      log.error("something born", state);
      break;

    case State.LIFECYCLE_FREE:
      debugger;
      log.error("something died", state);
      break;

    case State.LIFECYCLE_HIDDEN:
      debugger;
      log.info("something is hidden", state);
      break;

    default:
      throw new Error("unknown lifecycle=" + lifecycle);
  }
}

export function dispatchTick(time: number) {
  interceptorService.dispatchTick(time);
}

export function registerBehavior(name: string, spec: AnyEvent) {
  interceptorService.register(name, spec);
}

export function scheduleExec(name: string, spec: ScheduleSpec<any, any>) {
  name = name; // TODO log or pass thru?
  interceptorService.scheduleExec(spec);
}

export default function api<T>(subject: State<T>): T {
  const opts = F.elvis(botMemory().config, {}) as Options;

  if (opts.disableBehaviors) {
    return subject.subject();
  } else {
    return new Proxy(subject, interceptorService) as any;
  }
}

// http://support.screeps.com/hc/en-us/articles/203137792-Simultaneous-execution-of-creep-actions
// http://support.screeps.com/hc/en-us/articles/207023879-PathFinder
