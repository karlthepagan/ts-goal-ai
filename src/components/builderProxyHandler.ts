import {log} from "./support/log";

const terminal: any = {
  callAnd: true,
  call: true,
  apply: true,
};

export default class BuilderProxyHandler implements ProxyHandler<any> {
  public get(target: any[], eventMethod: string, receiver: any): any {
    debugger;
    target.push([eventMethod]);
    if (terminal[eventMethod] === true) {
      // TODO emit event from chain
      log.debug("next function call is the end!");
    }
    return receiver; // TODO tree structure to support multiple call chains
    // consider incrementing on each call so that target is forked per call
  }

  public apply(target: any[], thisArg: any, argArray?: any): any {
    debugger;
    target.push(argArray);
    return thisArg; // TODO is this same as receiver?
  }
}
