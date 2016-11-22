import RoomState from "../state/roomState";
import Plan from "./plan";
import Goal from "./goal";
import * as Medium from "./medium";
import {CandidateFactory} from "../filters";
import {roomStateActors} from "./goals";

/**
 * calculate creep build inventory
 */
export default class DesignCreep extends Goal<Room, any, RoomState> {
  constructor(room: Room) {
    super();

    console.log("hello", this.getGoalKey(), room.name);
  }

  public state(actor: Room): RoomState {
    return RoomState.right(actor);
  }

  public plan(state: RoomState): Plan<any>[] {
    state = state;

    return [ new Plan<Room>(this, state.subject()) ];
  }

  public elect(state: RoomState, plan: Plan<any>[]): Plan<any> {
    state = state;
    plan = plan;

    return new Plan<Room>(this, state.subject());
  }

  public execute(actor: Room, plan: Plan<any>): Plan<any>[] {
    actor = actor;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<any>[]): Plan<any>[]|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return Medium.GOAL_DESIGN_CREEP;
  }

  public toString(): string {
    return "design creep";
  }

  protected _identifyResources(state: RoomState): any[] {
    state = state;

    return [ {} ]; // TODO what is design resource? memory?
  }

  protected _candidateActorFactory(): CandidateFactory<RoomState> {
    return roomStateActors; // TODO controller filter
  }
}
