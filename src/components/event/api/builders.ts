import {AnyIS} from "../impl/interceptorSpec";
import {interceptorService} from "../behaviorContext";
import {OnIntercept} from "./index";
import ScheduleSpec from "../impl/scheduledSpec";

export function actionGet(select?: Function) {
  return (is: AnyIS, actionName: string) => {
    switch (actionName) {
      case "fireEvent":
        is.setAction(interceptorService, i => i.triggerBehaviors);
        // TODO set instance as the named global interceptorService
        return [is, assignArgsThen(actionGet(select))];

      case "andThen":
        // TODO implement and
        return [is, select];

      case "apply":
        return [is, actionApplyApply]; // apply returns void (TODO should return promise?)

      case "wait":
        return [is, waitApply(actionGet(select))];

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
  // is.action = action;
  // TODO NOW, anonymous function cache
  return [is, undefined];
}

export function assignArgsThen(next?: Function) {
  return (is: AnyIS, ...args: any[]) => {
    is.actionArgs = args;
    return [is, next];
  };
}

export function skip(next: Function) { // TODO unexport
  return (is: AnyIS) => [is, next];
}
