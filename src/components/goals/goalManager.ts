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

export function run(room: Room): void {

}
