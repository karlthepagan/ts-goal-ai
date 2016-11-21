import Goal from "./goal";
import GoalState from "../state/goalState";
import Plan from "./plan";
import * as High from "./high";
import Expand from "./highExpand";
import RoomControlLevel from "./highRcl";
import State from "../state/abstractState";
import Goal from "./goal";

type CandidateLambda = (state: GoalState) => State<any>;

const candidateBuilders: { [key: string]: CandidateLambda } = {};
candidateBuilders[High.GOAL_EXPAND] = State.prototype.subject; // instance reference?
candidateBuilders[High.GOAL_RCL] =

// TODO externalize MasterGoal priorities
const candidates: string[] = [ // TODO map name -> candidate builder
  High.GOAL_EXPAND,
  High.GOAL_RCL,
  High.GOAL_SCOUT,
];

/**
 * ai goal root
 */
export default class MasterGoal implements Goal<Game, Game|Room, GoalState> {
  constructor() {
    console.log("hello ", this.getGoalKey());
  }

  public plan(state: GoalState): Plan<Game|Room> {
    state = state;

    // for (const name in state.subject().rooms) {
    //   const room = state.subject().rooms[name];
    //   // build candidate goals for all visible rooms, this cascades into rooms in memory
    //   console.log("plan ", name); // TODO impl
    // }

    for (const goal of priority) {

    }

    return new Plan<Game|Room>(null, null);
  }

  public elect(state: GoalState, plan: Plan<Game|Room>): Plan<Game|Room> {
    state = state;
    plan = plan;

    return new Plan<Game|Room>(null, null);
  }

  public execute(actor: Game, state: GoalState, plan: Plan<Game|Room>): Plan<Game|Room>[] {
    actor = actor;
    state = state;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<Game|Room>[]): Plan<Game|Room>|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return High.GOAL_MASTER;
  }

  public toString(): string {
    return this.getGoalKey();
  }
}
