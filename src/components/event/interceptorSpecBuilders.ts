import {AnyIS} from "./interceptorSpec";
import * as Builders from "./builders";

const matchMethodName = /\.([^\(\s]+)/;

const callStateList = ["before", "after", "failure"];

export function whenClosureGet(is: AnyIS, callState: string) {
  is.callState = callStateList.indexOf(callState);
  return [is, whenClosureApply];
}

function whenClosureApply(is: AnyIS, method: (i: any) => Function) {
  // TODO open paren case
  // LATER HACK HACK HACK method.toString() is dirty
  // TODO use a Proxy and call method to extract the implementer's method name (insead of toString)
  const match = matchMethodName.exec(method.toString());
  if (match === null) {
    throw new Error("unparsable method reference: " + method.toString());
  }
  is.definition.method = match[1];
  // alternative: send prototype into extractor method
  // is.definition.method = method((is.targetConstructor as any).apiType().prototype).name;
  return [is, Builders.actionGet(whenClosureGet)];
}
