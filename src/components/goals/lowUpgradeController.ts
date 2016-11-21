import Goal from "./goal";
import * as Keys from "../keys";
import RoomState from "../state/roomState";
import Plan from "./plan";

export default class UpgradeController implements Goal<Room, Spawn, RoomState> {
  constructor(room: Room) {
    console.log("hello ", this.getGoalKey(), room.name);
  }

  public getGoalKey(): string {
    return Keys.GOAL_UPGRADE_CONTROLLER;
  }

  public plan(state: RoomState): Plan<Spawn> {
    state = state;

    return new Plan<Spawn>();
  }

  public elect(state: RoomState, plan: Plan<Spawn>): Plan<Spawn> {
    state = state;
    plan = plan;

    return new Plan<Spawn>();
  }

  public execute(actor: Room, state: RoomState, plan: Plan<Spawn>): Plan<Spawn>[] {
    actor = actor;
    state = state;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<Spawn>[]): Plan<Spawn>|any {
    failures = failures;

    return null;
  }
}
