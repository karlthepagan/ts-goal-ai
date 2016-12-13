import Named from "../../named";

export default class AnonCache extends Array implements Named {
  public static instance = new AnonCache();
  public static vright(id: string) {
    id = id;
    return AnonCache.instance; // TODO pass back cache?
  }

  public className(): string {
    return "AnonCache";
  }

  public getId(): string {
    return "global";
  }

  public wrap<T extends Function>(func: T): (i: any) => T {
    if (func === undefined) {
      throw new Error("illegal arg: func is undefined");
    }
    const i = this.allocate(func) as number;
    return ((n: any) => n[i]) as any; // telling the nameCapture proxy what our index is
  }

  public allocate(func: Function|undefined): number|undefined {
    if (func === undefined) {
      return undefined;
    }

    for (let i = this.length - 1; i >= 0; i--) {
      if (this[i] === func) {
        return i;
      }
    }
    return this.push(func) - 1;
  }
}
