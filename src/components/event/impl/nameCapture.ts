export default class NameCapture implements ProxyHandler<any> {
  public get (target: any, p: PropertyKey, receiver: any): any {
    if (receiver.captured === undefined) {
      receiver.captured = target;
    }

    // TODO what about callback (with return) when this reaches a countdown?
    return receiver[p] = {};
  }
}
