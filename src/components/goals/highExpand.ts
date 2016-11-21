import Goal from "./goal";
import GoalState from "../state/goalState";
import Plan from "./plan";
import * as High from "./high";
import RoomState from "../state/roomState";

/**
 * expand territory
 */
export default class Expand implements Goal<Game, Room, GoalState> {
  constructor() {
    console.log("hello ", this.getGoalKey());
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor, Memory.goals);
  }

  public plan(state: GoalState): Plan<Room>[] {
    state = state;

    let room: Room = {} as Room; // TODO empty case
    for (const name in state.subject().rooms) {
      room = state.subject().rooms[name];
      // build candidate goals for all visible rooms, this cascades into rooms in memory
      console.log("plan ", name); // TODO impl

      RoomState.right(room);
    }

    return [ new Plan<Room>(this, room) ];
  }

  public elect(state: GoalState, plan: Plan<Room>[]): Plan<Room> {
    state = state;
    plan = plan;

    return new Plan<Room>(this, {} as Room);
  }

  public execute(actor: Game, state: GoalState, plan: Plan<Room>): Plan<Room>[] {
    actor = actor;
    state = state;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<Room>[]): Plan<Room>[]|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return High.GOAL_EXPAND;
  }

  public toString(): string {
    return this.getGoalKey();
  }
}
