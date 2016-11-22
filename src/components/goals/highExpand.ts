import Goal from "./goal";
import GoalState from "../state/goalState";
import Plan from "./plan";
import * as High from "./high";
import {CandidateFactory} from "../filters";
import {goalStateActors} from "./goals";

/**
 * expand territory
 */
export default class Expand extends Goal<Game, Room, GoalState> {
  public static fromGoalState(state: GoalState): Game[] {
    return [ state.subject() ];
  }

  constructor() {
    super();

    console.log("hello", this.getGoalKey());
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor, Memory.goals);
  }

  // public plan(state: GoalState): Plan<Room>[] {
  //   state = state;
  //
  //   let room: Room = {} as Room; // TODO empty case
  //   for (const name in state.subject().rooms) {
  //     room = state.subject().rooms[name];
  //     // build candidate goals for all visible rooms, this cascades into rooms in memory
  //     console.log("plan ", name); // TODO impl
  //
  //     RoomState.right(room);
  //   }
  //
  //   return [ new Plan<Room>(this, room) ];
  // }
  //
  public elect(state: GoalState, plan: Plan<Room>[]): Plan<Room> {
    state = state;
    plan = plan;

    return new Plan<Room>(this, {} as Room);
  }

  public getGoalKey(): string {
    return High.GOAL_EXPAND;
  }

  public toString(): string {
    return this.getGoalKey();
  }

  protected _identifyResources(state: GoalState): Room[] {
    return _.values(state.subject().rooms) as Room[];
  }

  protected _candidateActorFactory(): CandidateFactory<GoalState> {
    return goalStateActors;
  }
}
