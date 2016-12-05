import BehaviorInterceptor from "./behaviorInterceptor";
import State from "../state/abstractState";

const _behaviors = new BehaviorInterceptor();

export function registerBehavior() {
  _behaviors.register("derps");
}

export default function api<T>(subject: State<T>): T {
  // TODO how to expand (or detect) the real value like lodash does? that way we can use it for args
  return subject.subject(); // new Proxy(subject, _behaviors) as any; // TODO restore proxy
}
