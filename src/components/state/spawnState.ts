import State from "./abstractState";
import {log} from "../support/log";
import {botMemory, FLYWEIGHTS} from "../../config/config";
import GlobalState from "./globalState";
import CreepState from "./creepState";
// import * as F from "../functions";

export default class SpawnState extends State<Spawn> {
  public static left(subject: Spawn) {
    return (FLYWEIGHTS ? SpawnState._left : new SpawnState("SS") ).wrap(subject, botMemory()) as SpawnState;
  }

  public static right(subject: Spawn) {
    return (FLYWEIGHTS ? SpawnState._right : new SpawnState("SS") ).wrap(subject, botMemory()) as SpawnState;
  }

  private static _left: SpawnState = new SpawnState("SpawnStateLeft");
  private static _right: SpawnState = new SpawnState("SpawnStateRight");

  public className() {
    return "SpawnState";
  }

  public createCreep(body: string[], name?: string, mem?: any): number {
    const result = this.subject().createCreep(body, name);
    const time = body.length * 3;

    if (typeof result === "number") {
      return result as number;
    }

    // TODO register per class?
    State.events.schedule(time)
      .onSpawn(this.getId(), i => i.setMemory, mem)
      .onSpawn(result as string, CreepState.vright)
      .onSpawn(undefined);
  }

  protected _accessAddress() {
    return ["spawns"];
  }

  protected _indexAddress() {
    return ["index", "spawns"];
  }

  protected _visionSource() {
    return true;
  }

  protected _getId(subject: Spawn) {
    return subject.name;
  }

  protected init(rootMemory: any): boolean {
    if (super.init(rootMemory)) {
      // if (!this.isRemote()) {
      //   const subject = this.subject();
      // }

      // TODO distance to all sources? value calculations?

      return true;
    }

    return false;
  }
}
