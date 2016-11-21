import State from "./abstractState";
import RoomState from "./roomState";

export default class GoalState extends State<Game> {
  public static master(): GoalState {
    return GoalState._master;
  }

  public static build(game: Game, mem: any) {
    return new GoalState().wrap(game, mem) as GoalState;
  }

  public static boot(): GoalState {
    if (Memory.delete) {
      console.log("deleting memory");
      for (let key in Memory) {
        delete Memory[key];
      }
    }

    // Check memory for null or out of bounds custom objects
    if (!Memory.uuid || Memory.uuid > 100) {
      Memory.uuid = 0;
    }

    if (!Memory.objects) {
      Memory.objects = {};
    }

    if (!Memory.goals) {
      Memory.goals = {};
    }

    return GoalState._master = GoalState.build(Game, Memory.goals);
  }

  private static _master: GoalState;

  public init() {
    if (super.init()) {
      console.log("master goals");

      for (let name in this._subject.rooms) {
        let room = this._subject.rooms[name];
        RoomState.left(room);
      }

      return true;
    }

    return false;
  }
}
