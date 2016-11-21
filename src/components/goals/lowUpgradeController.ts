import Goal from "./goal";
import * as Keys from "../keys";
import Plan from "./plan";
import RoomObjectState from "../state/roomObjectState";

export default class UpgradeController
    implements Goal<StructureController, Creep, RoomObjectState<StructureController>> {

  constructor(room: Room) {
    console.log("hello ", this.getGoalKey(), room.name);
  }

  public getGoalKey(): string {
    return Keys.GOAL_UPGRADE_CONTROLLER;
  }

  public state(actor: StructureController): RoomObjectState<StructureController> {
    return RoomObjectState.right(actor);
  }

  public plan(state: RoomObjectState<StructureController>): Plan<Creep> {
    state = state;

    return new Plan<Creep>(this, {} as Creep); // TODO look up creep
  }

  public elect(state: RoomObjectState<StructureController>, plan: Plan<Creep>): Plan<Creep> {
    state = state;

    // TODO validate state
    return plan;
  }

  public execute(actor: StructureController,
                 state: RoomObjectState<StructureController>,
                 plan: Plan<Creep>): Plan<Creep>[] {
    actor = actor;
    state = state;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<Creep>[]): Plan<Creep>|any {
    failures = failures;

    return undefined;
  }
}
