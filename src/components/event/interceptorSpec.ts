import Joinpoint from "./joinpoint";
import {OnIntercept} from "./index";

export const BEFORE_CALL = 0;
export const AFTER_CALL = 1;
export const AFTER_FAIL = 2;

export type AnyIS = InterceptorSpec<any, any>;
export function newIS(is?: AnyIS): AnyIS {
  if (is === undefined) {
    return new InterceptorSpec<any, any>();
  } else {
    const result = newIS();
    result.action = is.action;
    result.actionArgs = is.actionArgs;
    result.callState = is.callState;
    result.definition = is.definition;
    result.targetConstructor = is.targetConstructor;
    result.parameter = is.parameter;
    return result;
  }
}

class InterceptorSpec<I, T> {
  public definition: Joinpoint<I, T>;
  public targetConstructor?: Constructor<I>;
  public parameter?: any; // parameter for schedule is relativeTime
  public callState: number;
  public action: OnIntercept<I, T>;
  public actionArgs: any[] = [];

  public isValid(): boolean {
    return !(this.definition === undefined || this.callState === undefined || this.action === undefined);
  }

  public test(jp: Joinpoint<any, any>): boolean {
    jp = jp;
    return true; // TODO return false on filter block
  }

  public invoke(jp: Joinpoint<any, any>): boolean {
    jp = jp; // jp is the actual call invocation
    this.action(jp, ...this.actionArgs); // TODO break this out and call in switch?

    switch (this.callState) { // TODO abstraction
      case BEFORE_CALL:
        // TODO call intercept and process it
        break;

      case AFTER_CALL:
        break;

      case AFTER_FAIL:
        break;

      default:
        throw new Error("illegal callState: " + this.callState);
    }

    return false; // TODO return true indicates filtering, stop all JP processing
  }
}

export default InterceptorSpec;
