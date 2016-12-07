import BehaviorInterceptor from "./behaviorInterceptor";
import State from "../state/abstractState";
import * as F from "../functions";
import {botMemory} from "../../config/config";
import {AnyIS} from "../event/interceptorSpec";
import {log} from "../support/log";
import {AnyJP, newJP} from "../event/joinpoint";

const _behaviors = new BehaviorInterceptor();

export function triggerBehaviors(jp: AnyJP, eventName: string) { // TODO should InterspectorSpec pollute this API?
  debugger; // triggerBehaviors
  jp = jp;
  log.debug("trigger behaviors event=", eventName);
  // construct event
  // TODO map
  const event = newJP("__events__", eventName);
  // jp.target; // TODO this is the event source
  event.returnValue = jp.returnValue;
  event.args = jp.args;

  _behaviors.dispatch(event);
}

export function registerBehavior(name: string, spec: AnyIS) {
  _behaviors.register(name, spec);
}

export default function api<T>(subject: State<T>): T {
  const opts = F.elvis(botMemory().config, {}) as Options;

  if (opts.disableBehaviors) {
    return subject.subject();
  } else {
    return new Proxy(subject, _behaviors) as any;
  }
}

// http://support.screeps.com/hc/en-us/articles/203137792-Simultaneous-execution-of-creep-actions
// http://support.screeps.com/hc/en-us/articles/207023879-PathFinder
