import Joinpoint from "../event/joinpoint";
import {OnIntercept} from "../event/api/index";
import InterceptorService from "./interceptorService";

export type AnyIS = InterceptorSpec<any, any>;

class InterceptorSpec<I, T> {
  public static BEFORE_CALL = 0; // TODO enum?
  public static AFTER_CALL = 1;
  public static AFTER_FAIL = 2;

  public definition: Joinpoint<I, T>;
  public targetConstructor?: Constructor<I>;
  public callState: number;
  public action: OnIntercept<I, T>; // only valid for immediate execution, doesn't survive sharding
  public actionArgs: any[] = [];

  public isValid(): boolean {
    return !(this.definition === undefined || this.callState === undefined || this.action === undefined);
  }

  public test(jp: Joinpoint<any, any>): boolean {
    jp = jp;
    return true; // TODO return false on filter block
  }

  public invoke(jp: Joinpoint<any, any>, context: InterceptorService): boolean {
    jp = jp; // jp is the actual call invocation
    context = context; // context used to schedule dependent actions
    this.action(jp, ...this.actionArgs); // TODO break this out and call in switch?

    switch (this.callState) { // TODO abstraction
      case InterceptorSpec.BEFORE_CALL:
        // TODO call intercept and process it
        break;

      case InterceptorSpec.AFTER_CALL:
        break;

      case InterceptorSpec.AFTER_FAIL:
        break;

      default:
        throw new Error("illegal callState: " + this.callState);
    }

    return false; // TODO return true indicates filtering, stop all JP processing
  }

  public clone<R extends InterceptorSpec<I, T>>(into?: R): R {
    if (into === undefined) {
      into = new InterceptorSpec<I, T>() as R;
    }
    into.action = this.action;
    into.actionArgs = this.actionArgs;
    into.callState = this.callState;
    into.definition = this.definition;
    into.targetConstructor = this.targetConstructor;
    return into;
  }
}

export default InterceptorSpec;
