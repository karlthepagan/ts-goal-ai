import Joinpoint from "../api/joinpoint";
import {OnIntercept} from "../api/index";
import InterceptorService from "./interceptorService";
import Named from "../../named";
import {log} from "../../support/log";
import {getType} from "../../functions";
import NameCapture from "./nameCapture";
import getConstructor from "../../types";

export type AnyIS = InterceptorSpec<any, any>;

const NAME_CAPTURE = new NameCapture();

class InterceptorSpec<I, T> {
  public static BEFORE_CALL = 0; // TODO enum?
  public static AFTER_CALL = 1;
  public static AFTER_FAIL = 2;

  public definition: Joinpoint<I, T>;
  public targetConstructor?: Constructor<I>;
  public callState: number;
  public actionArgs: any[] = [];
  private action?: OnIntercept<I, T>; // only valid for immediate execution, doesn't survive sharding
  private instanceType: string;
  private instanceId: string;
  private  actionMethod: string;

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
    const inst = this.resolve() as any;
    this.action = inst[this.actionMethod] as OnIntercept<I, T>; // this should be bound
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

  public doAction<T extends Named>(instance: T): T {
    // TODO name capture with countdown
    log.debug("TODO name capture");
    return instance;
  }

  public setAction<T extends Named>(instance: T, method: (i: T) => OnIntercept<I, T> ): void {
    debugger;
    this.instanceType = getType(instance);
    this.instanceId = instance.getId();
    const capture = new Proxy({}, NAME_CAPTURE) as any;
    method.call(capture);
    this.actionMethod = capture.captured[0];
  }

  protected resolve(): I {
    const ctor = getConstructor(this.instanceType) as any;
    return ctor.vright(this.instanceId) as any; // TODO silly convention
  }
}

export default InterceptorSpec;
