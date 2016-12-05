import BehaviorInterceptor from "./behaviorInterceptor";
import State from "../state/abstractState";
import * as F from "../functions";
import {botMemory} from "../../config/config";

const _behaviors = new BehaviorInterceptor();

export function registerBehavior() {
  _behaviors.register("derps");
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
