import InterceptorService from "./impl/interceptorService";
import State from "../state/abstractState";
import * as F from "../functions";
import {botMemory} from "../../config/config";
import {AnyIS} from "./impl/interceptorSpec";
import ScheduleSpec from "./impl/scheduledSpec";

export const interceptorService = new InterceptorService();

export function dispatchTick(time: number) {
  interceptorService.dispatchTick(time);
}

export function registerBehavior(name: string, spec: AnyIS) {
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
