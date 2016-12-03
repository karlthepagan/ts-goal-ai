import State from "./abstractState";
import {botMemory, FLYWEIGHTS} from "../../config/config";
import CreepState from "./creepState";

export default class SpawnState extends State<Spawn> {
  public static left(subject: Spawn) {
    return (FLYWEIGHTS ? SpawnState._left : new SpawnState("SS") ).wrap(subject, botMemory()) as SpawnState;
  }

  public static right(subject: Spawn) {
    return (FLYWEIGHTS ? SpawnState._right : new SpawnState("SS") ).wrap(subject, botMemory()) as SpawnState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? SpawnState._vleft : new SpawnState("SS") ).wrapRemote(id, botMemory()) as SpawnState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? SpawnState._vright : new SpawnState("SS") ).wrapRemote(id, botMemory()) as SpawnState;
  }

  private static _left: SpawnState = new SpawnState("SpawnStateLeft");
  private static _right: SpawnState = new SpawnState("SpawnStateRight");
  private static _vleft: SpawnState = new SpawnState("SpawnStateVirtualLeft");
  private static _vright: SpawnState = new SpawnState("SpawnStateVirtualRight");

  public className() {
    return STRUCTURE_SPAWN;
  }

  // TODO hook?
  public createCreep(body: string[], name?: string, mem?: any): number {
    const result = this.subject().createCreep(body, name);
    const em = State.events;

    if (typeof result === "number") {
      em.failure(this).createCreep(result, body, name, mem);
      return result;
    }

    const creepName = result as string;
    // const creep = CreepState.right(Game.creeps[creepName]);
    // while we CAN get the creep before next tick... it DOESN'T have the id until next tick!

    em.schedule(1, this)
      .onSpawn(this.onSpawn, creepName, mem);

    return 0;
  }

  public onSpawn(creepName: string, mem: any) {
    const creep = Game.creeps[creepName];
    const time = creep.body.length * 3;

    // TODO reconcile with CreepState behavior seed
    // TODO fire behavior think?
    const state = CreepState.left(creep);
    State.events.schedule(time - 1, state)
      .onSpawn(state.setMemory, mem)
      .onSpawn(state.rescan)
      .onMove(state.touching);

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
