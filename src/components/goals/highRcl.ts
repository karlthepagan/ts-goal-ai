import Goal from "./goal";
import Plan from "./plan";
import * as High from "./high";
import RoomState from "../state/roomState";
import GoalState from "../state/goalState";
import {CandidateFactory} from "../filters";
import {roomStateActors} from "./goals";

/**
 * expand territory and max out each controlled territory
 */
export default class RoomControlLevel extends Goal<Room, Room, RoomState> {
  public static fromGoalState(state: GoalState): Room[] {
    return _.values(state.subject().rooms) as Room[];
  }

  private _address: string;

  constructor(actor: Room) {
    super();

    console.log("hello", this.getGoalKey(), "actor", actor);

    this._address = actor.name;
  }

  public state(actor: Room): RoomState {
    return RoomState.right(actor);
  }

  public plan(state: RoomState): Plan<Room>[] {
    state = state;

    return [ new Plan<Room>(this, state.subject()) ];
  }

  public elect(state: RoomState, plan: Plan<Room>[]): Plan<Room> {
    state = state;
    plan = plan;

    return new Plan<Room>(this, state.subject());
  }

  public execute(actor: Room, plan: Plan<Room>): Plan<Room>[] {
    actor = actor;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<Room>[]): Plan<Room>[]|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return High.GOAL_RCL;
  }

  public toString(): string {
    return this.getGoalKey();
  }

  protected _identifyResources(state: RoomState): Room[] {
    return [ state.subject() ];
  }

  protected _candidateActorFactory(): CandidateFactory<RoomState> {
    return roomStateActors;
  }
}
