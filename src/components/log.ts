import Goal from "./goals/goal";

export default function log(g: Goal<any, any, any>, message?: any, ...optionalParams: any[]) {
  if (Memory.log[g.getGoalKey()]) {
    console.log(message, ...optionalParams);
  }
}
