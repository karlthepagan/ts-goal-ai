import Joinpoint from "../api/joinpoint";
import {OnIntercept, OnBuildTarget, InterceptFilter} from "../api/index";
import InterceptorService from "./interceptorService";
import Named from "../../named";
import * as F from "../../functions";
import getConstructor from "../../types";
import NAME_CAPTURE from "./nameCapture";
import AnonCache from "./anonCache";
import * as Debug from "../../util/debug";

export type AnyEvent = EventSpec<any, any>;

class EventSpec<I, T> {
  public static BEFORE_CALL = 0; // TODO enum?
  public static AFTER_CALL = 1;
  public static AFTER_FAIL = 2;

  /**
   * reconcile memory transformations
   */
  public static hydrate<A, B>(task: EventSpec<A, B>): EventSpec<A, B> {
    Object.setPrototypeOf(task, EventSpec.prototype); // TODO benchmark task.__proto__ = EventSpec.prototype;
    if (task.targetBuilder === undefined) {
      task.targetBuilder = AnonCache.instance[task.targetBuilderRef as number];
    }
    if (task.actionFilter === undefined) {
      task.actionFilter = AnonCache.instance[task.actionFilterRef as number];
    }
    Object.setPrototypeOf(task.definition, Joinpoint.prototype);
    if (task.definition.source !== undefined) {
      Object.setPrototypeOf(task.definition.source, Joinpoint.prototype);
    }
    return task;
  }

  public static fromEventName(name: string) {
    const is = new EventSpec<any, any>();
    is.definition = Joinpoint.newEvent(name);
    is.callState = EventSpec.AFTER_CALL;
    // is.targetConstructor = constructor; // TODO event typing
    return is;
  }

  public definition: Joinpoint<I, T>; // TODO this is basically the "source" of the event/call/intercept
  public targetConstructor?: Constructor<I>;
  public callState: number;
  public actionArgs: any[];
  // TODO these be private? see eventManager.ts:_scheduler first arg (instanceType = instance.className() / category?)
  public instanceType: string; // TODO this is basically the "destination" of the event/call/intercept
  public instanceId: string;
  public actionMethod: string;
  public targetBuilder?: OnBuildTarget<any, any>;
  public actionFilter?: InterceptFilter<any, any>;
  /**
   * because our scheduled events are stored in memory, targetbuilder functions are erased
   *
   * instead we cache them using AnonCache
   */
  public targetBuilderRef?: number;
  public actionFilterRef?: number;

  public clone<R extends EventSpec<I, T>>(into?: R): R {
    if (into === undefined) {
      into = new EventSpec<I, T>() as R;
    }
    if (this.definition === undefined) {
      Debug.always("spec definition is undef"); // spec definition is undef
    }
    into.definition = this.definition.clone(); // TODO deep prototype
    into.targetConstructor = this.targetConstructor;
    into.callState = this.callState;
    if (this.actionArgs !== undefined) {
      into.actionArgs = this.actionArgs.concat();
    }
    into.instanceType = this.instanceType;
    into.instanceId = this.instanceId;
    into.actionMethod = this.actionMethod;
    if (this.targetBuilder !== undefined) {
      into.targetBuilder = this.targetBuilder;
    }
    if (this.targetBuilderRef !== undefined) {
      into.targetBuilderRef = this.targetBuilderRef;
    }
    if (this.actionFilter !== undefined) {
      into.actionFilter = this.actionFilter;
    }
    if (this.actionFilterRef !== undefined) {
      into.actionFilterRef = this.actionFilterRef;
    }
    return into;
  }

  public isRegisterable(): boolean {
    return !(this.definition === undefined
      || !this.definition.isRegisterable()
      || this.callState === undefined
    );
  }

  public isInvokable(): boolean {
    return !(this.instanceType === undefined
      || this.instanceId === undefined
      || this.actionMethod === undefined
    );
  }

  public test(jp: Joinpoint<any, any>): boolean {
    if (this.actionFilter === undefined) {
      return true;
    }
    return this.actionFilter(jp);
  }

  public invoke(jp: Joinpoint<any, any>, context: InterceptorService): boolean {
    context = context; // context used to schedule dependent actions
    const inst = this.resolve(jp) as any;
    // if (this.targetBuilder === undefined) {
    //   this.targetBuilder = AnonCache.instance[this.targetBuilderRef as number];
    //   if (this.targetBuilder !== undefined) {
    //     Debug.always(); // TODO WUT? reload clears this function?
    //   }
    // }
    if (this.targetBuilder !== undefined) {
      inst[this.actionMethod](...this.targetBuilder(jp, ...this.resolveArgs(jp))); // TODO NOW spread bad es6 perf
    } else {
      inst[this.actionMethod](jp, ...this.resolveArgs(jp)); // TODO NOW spread bad es6 perf
    }

    return false; // never interrupt execution for normal events TODO preventDefault?
  }

  public setAction<T extends Named>(instance: T, method: (i: T) => OnIntercept<I, T> ): void {
    this.instanceType = F.getType(instance);
    this.instanceId = instance.getId();
    this.actionMethod = NAME_CAPTURE.capture(method);
  }

  public unresolve() {
    this.definition.unresolve();
    delete this.targetConstructor;
  }

  protected resolve(jp: Joinpoint<any, any>): I {
    // fall back to definition / joinpoint to determine our target
    const id = F.elvis(this.instanceId, this.definition.objectId, jp.objectId);
    const type = F.elvis(this.instanceType, this.definition.className, jp.className);
    const ctor = getConstructor(type) as any;
    return ctor.vright(id) as any; // TODO silly convention
  }

  protected resolveArgs(jp: Joinpoint<any, any>): any[] {
    if (this.actionArgs === undefined) {
      if (jp.args === undefined) {
        throw Debug.throwing(new Error("jp.args is undefined"));
      }
      return jp.args;
    }
    return this.actionArgs;
  }
}

export default EventSpec;
