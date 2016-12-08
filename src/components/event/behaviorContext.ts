import InterceptorService from "./impl/interceptorService";
import State from "../state/abstractState";
import * as F from "../functions";
import {botMemory} from "../../config/config";
import {AnyIS} from "./impl/interceptorSpec";
import {log} from "../support/log";
import {AnyJP, default as Joinpoint} from "./api/joinpoint";

const _interceptors = new InterceptorService();

export function dispatchTick(time: number) {
  _interceptors.dispatchTick(time);
}

export function triggerBehaviors(jp: AnyJP, eventName: string) { // TODO should InterspectorSpec pollute this API?
  debugger; // triggerBehaviors
  jp = jp;
  log.debug("trigger behaviors event=", eventName);
  // construct event
  // TODO map
  const event = new Joinpoint<any, any>("__events__", eventName);
  // jp.target; // TODO this is the event source
  event.returnValue = jp.returnValue;
  event.args = jp.args;

  _interceptors.dispatch(event);
}

export function registerBehavior(name: string, spec: AnyIS) {
  _interceptors.register(name, spec);
}

export default function api<T>(subject: State<T>): T {
  const opts = F.elvis(botMemory().config, {}) as Options;

  if (opts.disableBehaviors) {
    return subject.subject();
  } else {
    return new Proxy(subject, _interceptors) as any;
  }
}

// http://support.screeps.com/hc/en-us/articles/203137792-Simultaneous-execution-of-creep-actions
// http://support.screeps.com/hc/en-us/articles/207023879-PathFinder
