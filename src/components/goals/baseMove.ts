// import State from "../state/abstractState";
// import Goal from "./oldGoal";
// import * as Keys from "../keys";
//
// const mTop = new Move(TOP);
// const mTopR = new Move(TOP_RIGHT);
// const mRight = new Move(RIGHT);
// const mBotR = new Move(BOTTOM_RIGHT);
// const mBot = new Move(BOTTOM);
// const mBotL = new Move(BOTTOM_LEFT);
// const mLeft = new Move(LEFT);
// const mTopL = new Move(TOP_LEFT);
//
// export default class Move implements Goal<Creep> {
//   public static top(): Goal<Creep> {
//     return mTop;
//   }
//
//   public static topRight(): Goal<Creep> {
//     return mTopR;
//   }
//
//   public static right(): Goal<Creep> {
//     return mRight;
//   }
//
//   public static bottomRight(): Goal<Creep> {
//     return mBotR;
//   }
//
//   public static bottom(): Goal<Creep> {
//     return mBot;
//   }
//
//   public static bottomLeft(): Goal<Creep> {
//     return mBotL;
//   }
//
//   public static left(): Goal<Creep> {
//     return mLeft;
//   }
//
//   public static topLeft(): Goal<Creep> {
//     return mTopL;
//   }
//
//   private dir: number;
//   constructor(plan: Plan<number>) {
//     this.dir = direction;
//   }
//
//   public getGoalKey(): string {
//     return Keys.GOAL_MOVE;
//   }
//
//   public execute(state: State<Creep>, actor: Creep): void {
//     let result: number = actor.move(this.dir);
//
//     if (result < 0) {
//       state.setFailure(this, actor, result);
//     }
//   }
//
//   public canFinish(state: State<Creep>, actor: Creep): Task|undefined {
//     state = state;
//     return () => {
//       actor.move(this.dir);
//     };
//   }
//
//   public canProgress(state: State<Creep>): boolean {
//     state = state;
//     return true;
//   }
//
//   public getGoalId(): string|undefined {
//     return this.getGoalKey() + this.dir;
//   }
//
//   public toString(): string {
//     return "move" + this.dir;
//   }
// }
