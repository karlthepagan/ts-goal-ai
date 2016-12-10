import {AnyIS} from "../impl/interceptorSpec";
import * as Builders from "./builders";
import NAME_CAPTURE from "../impl/nameCapture";

const callStateList = ["before", "after", "failure"];

export function whenClosureGet(is: AnyIS, callState: string) {
  is = Object.create(is); // was .clone();
  is.callState = callStateList.indexOf(callState);
  return [is, whenClosureApply];
}

function whenClosureApply(is: AnyIS, method: (i: any) => Function) {
  // TODO open paren case
  is = Object.create(is); // was .clone();
  is.definition.method = NAME_CAPTURE.capture(method) as string;
  // alternative: send prototype into extractor method
  // is.definition.method = method((is.targetConstructor as any).apiType().prototype).name;
  return [is, Builders.actionGet(whenClosureGet)];
}
