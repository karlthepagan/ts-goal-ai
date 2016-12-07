import {newJP} from "./joinpoint";
import {newIS, AnyIS} from "./interceptorSpec";
import * as Builders from "./builders";

const matchMethodName = /\.([^\(\s]+)/;

const callStateList = ["before", "after", "failure"];

function whenClosureGet(is: AnyIS, callState: string) {
  is.callState = callStateList.indexOf(callState);
  return [is, whenClosureApply];
}

function whenClosureApply(is: AnyIS, method: (i: any) => Function) {
  // TODO open paren case
  // LATER HACK HACK HACK method.toString() is dirty
  const match = matchMethodName.exec(method.toString());
  if (match === null) {
    throw new Error("unparsable method reference: " + method.toString());
  }
  is.definition.method = match[1];
  // alternative: send prototype into extractor method
  // is.definition.method = method((is.targetConstructor as any).apiType().prototype).name;
  return [is, Builders.actionGet(whenClosureGet)];
}

export default class InterceptorSpecBuilders {
  public static handler(initial: undefined, constructor: Constructor<any>) { // intercept
    initial = initial;
    const is = newIS();
    is.definition = newJP(constructor.name, "?");
    is.targetConstructor = constructor;
    return [is, whenClosureGet];
  }
}
