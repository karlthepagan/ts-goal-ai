import Named from "../../named";

const anonCache = new AnonCache();

export class AnonCache implements Named {
  public className(): string {
    return "AnonCache";
  }

  public getId(): string {
    return "global";
  }
}

export default anonCache;
