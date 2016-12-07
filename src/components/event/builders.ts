import {AnyIS, newIS} from "./interceptorSpec";
import {triggerBehaviors} from "../behavior/behaviorContext";
import {OnIntercept} from "./index";
import Named from "../named";
import {newJP} from "./joinpoint";

export function actionGet(select?: Function) {
  return (is: AnyIS, actionName: string) => {
    switch (actionName) {
      case "fireEvent":
        is.action = triggerBehaviors;
        return [is, assignArgsThen(actionGet(select))]; // TODO skip is a bit of a hack but easy

      case "andThen":
        // TODO implement and
        return [is, select];

      case "apply":
        return [is, actionApplyApply]; // TODO apply returns void (should return promise)

      default:
        throw new Error("undefined action=" + actionName);
    }
    // terminal callback will copy, cleanup and register
  };
}

export function actionApplyApply(is: AnyIS, action: OnIntercept<any, any>) {
  is.action = action;
  return [is, undefined]; // TODO Action.apply(f) returns void
}

export function assignArgsThen(next?: Function) {
  return (is: AnyIS, ...args: any[]) => {
    debugger;
    is.actionArgs = args;
    return [is, next];
  };
}

export function skip(next: Function) { // TODO unexport
  return (is: AnyIS) => [is, next];
}

export function scheduleHandler(initial: undefined, relativeTime: number, instance: Named) {
  initial = initial;
  const is = newIS();
  is.parameter = relativeTime;
  is.definition = newJP(instance.constructor.name, "?");
  is.definition.target = instance;
  return [is, actionGet(undefined)];
}
