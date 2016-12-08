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
    const n = this.push(func) - 1;
    return ((i: any) => i[n]) as any; // telling the nameCapture proxy what our index is
  }
}
