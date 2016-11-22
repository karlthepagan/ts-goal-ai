import Plan from "./plan";
import Goal from "./goal";
import * as Medium from "./medium";
import GoalState from "../state/goalState";
import {CandidateFactory} from "../filters";
import {goalStateActors} from "./goals";

/**
 * from the origin room, determine the next
 */
export default class ScoutRoom extends Goal<Game, Creep, GoalState> {
  public static fromGoalState(state: GoalState): Creep[] {
    return _.values(state.subject().creeps) as Creep[];
  }

  private _creep: string;

  constructor(resource: Creep) {
    super();

    this._creep = resource.id;
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor, Memory.goals);
  }

  public elect(state: GoalState, plan: Plan<Creep>[]): Plan<Creep> {
    state = state;
    plan = plan;

    // TODO examine border rooms which are not present in memory, add them and assign creeps based on proximity

    return plan[0];
  }

  public execute(actor: Game, plan: Plan<Creep>): Plan<Creep>[] {
    actor = actor;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<Creep>[]): Plan<Creep>[]|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return Medium.GOAL_SCOUT;
  }

  public toString(): string {
    return "scout room";
  }

  protected _identifyResources(state: GoalState): Creep[] {
    return ScoutRoom.fromGoalState(state);
  }

  protected _candidateActorFactory(): CandidateFactory<GoalState> {
    return goalStateActors;
  }
}
