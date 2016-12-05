class Joinpoint<T> {
  public className: string;
  public objectId?: string;
  public target?: any;
  public method: string;
  public args: any[];
  public returnValue?: T;
  public thrownException?: string|Error;
  public proceedApply?: Function;

  constructor(className: string, objectId: string, method: string) {
    this.className = className;
    this.objectId = objectId;
    this.method = method;
  }

  public proceed(): T {
    if (this.proceedApply === undefined) {
      throw new Error("incomplete");
    }

    try {
      return this.returnValue = this.proceedApply(this.args);
    } catch (err) {
      this.thrownException = err;
      throw err;
    }
  }
}
