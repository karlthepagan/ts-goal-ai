import Goal from "./goal";
import Move from "./baseMove";
import MoveTo from "./baseMoveTo";
import * as Keys from "../keys";
import StoreEnergy from "./lowStoreEnergy";

type GoalLambda = (str: string|undefined) => Goal<any>;

const goalFactory: { [key: string]: GoalLambda } = {};
const priority: string[] = [
  Keys.GOAL_STORE_ENERGY,
  Keys.GOAL_CREATE_CREEP,
  Keys.GOAL_UPGRADE_CONTROLLER,
];
const goals: Goal[] = [];

function defineGoal(goal: GoalLambda): void {
  let proto = goal(undefined);
  goalFactory[proto.getGoalKey()] = goal;
}

defineGoal(StoreEnergy.constructor as GoalLambda);
defineGoal(Move.top as GoalLambda);
defineGoal(Move.topLeft as GoalLambda);
defineGoal(Move.topRight as GoalLambda);
defineGoal(Move.bottom as GoalLambda);
defineGoal(Move.bottomLeft as GoalLambda);
defineGoal(Move.bottomRight as GoalLambda);
defineGoal(Move.left as GoalLambda);
defineGoal(Move.right as GoalLambda);
defineGoal(MoveTo.constructor as GoalLambda);

/**
 * build global goals, examine rooms
 */
export function plan() {
  for (let room of Game.rooms) {
    // build candidate goals for all visible rooms, this cascades into rooms in memory
    plan(room);
  }
}

/**
 * build candidate goals
 */
export function plan(room: Room) {
  for (let goalName of priority) {

  }
}

/**
 * elect a winning plan
 */
export function election() {

}

/**
 * execute plans
 */
export function execute(): void {

}

/**
 * cleanup dead goals, plan for next cycle
 */
export function conflictResolution(): void {

}
