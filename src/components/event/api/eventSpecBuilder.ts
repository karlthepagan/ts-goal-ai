import * as Builders from "./builders";
import {AnyIS, default as InterceptorSpec} from "../../behavior/interceptorSpec";
import Joinpoint from "../joinpoint";

/**
 * @see "./index.d.ts":EventSelector
 */
/*
const start = {
createCreep(): WhenEvent<CreepState, OnLifecycle<CreepState, void>>;
death(): WhenEvent<CreepState, OnLifecycle<CreepState, void>>;
rested(): WhenEvent<CreepState, OnLifecycle<CreepState, void>>;
decay<T extends OwnedStructure>(): WhenEvent<T, OnLifecycle<T, void>>;
full<T extends CreepState|OwnedStructure>(): WhenEvent<T, OnEnergy<T, void>>;
empty<T extends CreepState|OwnedStructure>(): WhenEvent<T, OnEnergy<T, void>>;
move(): WhenEvent<CreepState, OnMove<void>>;
};
*/
export function eventSelectorGet(name: string): [AnyIS, Function] {
  const is = new InterceptorSpec<any, any>();
  is.definition = new Joinpoint<any, any>("__events__", name);
  is.callState = InterceptorSpec.AFTER_CALL;
  // is.targetConstructor = constructor; // TODO event typing
  return [is, eventSelectorApply];
}

function eventSelectorApply(is: AnyIS) { // ignored args
  return [is, whenEventGet];
}
/*
 of<T extends INST>(instance: T): Action<CALLBACK, T, EventSelector>;
 ofAny<T extends INST>(type: () => T): Action<CALLBACK, T, EventSelector>;
 ofAll(): Action<CALLBACK, INST, EventSelector>;
 occursAt(relativeTime: number, instance: INST): Action<CALLBACK, INST, EventSelector>;
 */
function whenEventGet(is: AnyIS, when: string) {
  when = when; // TODO start filter
  switch (when) {
    case "of":
      // TODO specific event destination
      throw new Error("unsupported: of");
    case "ofAny":
      // TODO event destination type restriction
      throw new Error("unsupported: ofAny");
    case "ofAll":
      break;
    case "occursAt":
      // TODO additional scheduling option? bad idea?
      throw new Error("occursAt trigger unsupported, use dispatch or fireEvent");
    default:
      throw new Error("illegal when=" + when);
  }
  return [is, whenApply];
}

function whenApply(is: AnyIS, args: any[]) {
  args = args; // TODO implement whenApply
  return [is, Builders.actionGet(eventSelectorGet)];
}

export function testHandler(value: any, ... append: any[]) {
  // if (!Array.isArray(append)) {
  //   append = [append];
  // }
  if (value === undefined) {
    return [[append], testHandler];
  } else {
    return [value.concat([append]), testHandler];
  }
}
