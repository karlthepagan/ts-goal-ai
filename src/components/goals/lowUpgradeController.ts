import Goal from "./goal";
import Plan from "./plan";
import * as Low from "./low.ts";
import {CandidateFactory} from "../filters";
import RoomState from "../state/roomState";
import {roomStateActors} from "./goals";

export default class UpgradeController
    extends Goal<Room, Creep, RoomState> {

  constructor(room: Room) {
    super();

    console.log("hello", this.getGoalKey(), room.name);
  }

  public getGoalKey(): string {
    return Low.GOAL_UPGRADE_CONTROLLER;
  }

  public state(actor: Room): RoomState {
    return RoomState.right(actor);
  }

  public elect(state: RoomState, plan: Plan<Creep>[]): Plan<Creep> {
    state = state;

    // TODO validate state
    return plan[0];
  }

  public execute(actor: Room,
                 plan: Plan<Creep>): Plan<Creep>[] {
    actor = actor;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<Creep>[]): Plan<Creep>[]|any {
    failures = failures;

    return undefined;
  }

  protected _identifyResources(state: RoomState): Creep[] {
    state = state;

    // TODO creeps
    return [];
  }

  protected _candidateActorFactory(): CandidateFactory<RoomState> {
    return roomStateActors; // TODO controller filter
  }
}
