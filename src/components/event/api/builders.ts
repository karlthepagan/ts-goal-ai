import {AnyIS} from "../impl/interceptorSpec";
import {interceptorService} from "../behaviorContext";
import {OnIntercept} from "./index";
import ScheduleSpec from "../impl/scheduledSpec";
import AnonCache from "../impl/anonCache";

export function actionGet(select?: Function) {
  return (is: AnyIS, actionName: string) => {
    switch (actionName) {
      case "fireEvent":
        is = is.clone();
        is.setAction(interceptorService, i => i.triggerBehaviors);
        return [is, assignArgsThen(actionGet(select))];

      case "andThen":
        // TODO implement and
        return [is, select];

      case "apply":
        return [is, actionApplyApply]; // apply returns void (TODO should return promise?)

      case "wait":
        return [is, waitApply(actionGet(select))];

      case "call":
        // call returns a proxy of the instance which captures method name and args
        return [is, skip(instanceGet)];

      default:
        throw new Error("undefined action=" + actionName);
    }
    // terminal callback will copy, cleanup and register
  };
}

/**
 * wait implementation changes the behavior of action from immediately firing/doing the action into
 * scheduling that to occur later
 */
export function waitApply(next: Function) {
  return (is: AnyIS, relativeTime: number) => {
    // TODO compose two joinpoints together??? - one to be applied immediately, and one to be executed after a delay
    const ss = is.clone(new ScheduleSpec<any, any>());
    if (isNaN(relativeTime)) {
      debugger; // illegal relativeTime
      throw new Error("illegal relativeTime=NaN");
    }
    if (relativeTime < 1) {
      throw new Error("illegal relativeTime=" + relativeTime);
    }

    ss.relativeTime = relativeTime;

    return [ss, next]; // ss needs to get send to the schedule handler
  };
}

export function actionApplyApply(is: AnyIS, action: OnIntercept<any, any>) {
  // anonymous function cache
  is = is.clone();
  is.setAction(AnonCache.instance, AnonCache.instance.wrap(action));
  return [is, undefined];
}

export function instanceGet(is: AnyIS, methodName: string) {
  is = is.clone();
  is.actionMethod = methodName;
  return [is, assignArgsThen(undefined)];
}

export function assignArgsThen(next?: Function) {
  return (is: AnyIS, ...args: any[]) => {
    is = is.clone();
    is.actionArgs = args; // TODO remove jp?
    return [is, next];
  };
}

export function skip(next: Function) { // TODO unexport
  return (is: AnyIS) => [is, next];
}
