import Goal from "./goals/goal";
import Move from "./goals/baseMove";

export let goals: any = {};

function pushGoal(goal: Goal<any>): void {
  if (goal.getGoalId()) {
    goals[goal.getGoalId() as string] = goal;
  }
}

pushGoal(new Move(TOP));
pushGoal(new Move(TOP_RIGHT));
pushGoal(new Move(RIGHT));
pushGoal(new Move(BOTTOM_RIGHT));
pushGoal(new Move(BOTTOM));
pushGoal(new Move(BOTTOM_LEFT));
pushGoal(new Move(LEFT));
pushGoal(new Move(TOP_LEFT));
