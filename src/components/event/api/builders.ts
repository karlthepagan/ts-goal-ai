import {AnyEvent} from "../impl/eventSpec";
import {interceptorService} from "../behaviorContext";
import {OnIntercept, OnBuildTarget, InterceptFilter} from "./index";
import ScheduleSpec from "../impl/scheduledSpec";
import AnonCache from "../impl/anonCache";

export const EMITTING_CALLS = {
  advice: 2,
  adviceAnd: 2,
  call: 4,
  callHandler: 4, // TODO 3?
  fireEvent: 2,
};

export function registerFunctionLibrary(cache: AnonCache) {
  cache.allocate(discardJointpoint);
}

function discardJointpoint( ... args: any[]) {
  return args.slice(1);
}

export function assignFilterThen(next?: Function) {
  return function(is: AnyEvent, filter: InterceptFilter<any, any>) {
    is = Object.create(is);
    is.actionFilter = filter;
    is.actionFilterRef = AnonCache.instance.allocate(filter);
    return [is, next];
  };
}

export function actionGet(select?: Function) {
  return function(is: AnyEvent, actionName: string) {
    switch (actionName) {
      case "filter":
        return [is, assignFilterThen(actionGet(select))];

      case "fireEvent":
        is = Object.create(is); // was .clone();
        is.setAction(interceptorService, function(i) { return i.triggerBehaviors; });
        return [is, assignArgsThen(actionGet(select))];

      case "advice": // TODO adviceAnd
        return [is, actionAdviceApply]; // advice returns void (TODO should return promise?)

      case "wait":
        return [is, waitApply(actionGet(select))];

      case "call":
        is = Object.create(is);
        is.targetBuilder = discardJointpoint; // suppress jp in args
        // call returns a proxy of the instance which captures method name and args
        return [is, skip(instanceGet)];

      case "callHandler":
        // callHandler returns a proxy of the instance which captures method name but skips args
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
  return function(is: AnyEvent, relativeTime: number, targetBuilder?: OnBuildTarget<any, any>) {
    const ss = is.clone(new ScheduleSpec<any, any>());
    if (isNaN(relativeTime)) {
      debugger; // illegal relativeTime
      throw new Error("illegal relativeTime=NaN");
    }
    if (relativeTime < 1 || relativeTime === undefined || relativeTime === null) {
      throw new Error("illegal relativeTime=" + relativeTime);
    }

    ss.relativeTime = relativeTime;
    ss.targetBuilder = targetBuilder;
    ss.targetBuilderRef = AnonCache.instance.allocate(targetBuilder);

    return [ss, next]; // ss needs to get send to the schedule handler
  };
}

export function actionAdviceApply(is: AnyEvent, action: OnIntercept<any, any>) {
  // anonymous function cache
  is = Object.create(is); // was .clone();
  is.setAction(AnonCache.instance, AnonCache.instance.wrap(action));
  return [is, undefined];
}

export function instanceGet(is: AnyEvent, methodName: string) {
  is = Object.create(is); // was .clone();
  // GET means that we're invoking a method on the call target, this is the default behavior for EventSpec.resolve
  is.actionMethod = methodName;
  return [is, assignArgsThen(undefined)];
}

export function assignArgsThen(next?: Function) {
  return function(is: AnyEvent, ... args: any[]) {
    is = Object.create(is); // was .clone();
    is.actionArgs = args; // TODO remove jp?
    return [is, next];
  };
}

export function skip(next: Function) { // TODO unexport
  return (is: AnyEvent) => [is, next];
}
