import State from "./abstractState";
import RoomState from "./roomState";
import * as Keys from "../keys";

export default class GoalState extends State<Game> {
  public static master(): GoalState {
    if (Memory.pause === true) {
      return GoalState._paused;
    }
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

    if (Memory.reset) {
      console.log("resetting non-creep memory");

      Memory.reset = false;
      delete Memory.objects;
      delete Memory.goals;
      delete Memory.rooms;
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

    GoalState._master = GoalState.build(Game, Memory.goals);
    GoalState._paused = GoalState.build(Game, undefined);

    return GoalState.master();
  }

  private static _master: GoalState;
  private static _paused: GoalState;

  public init() {
    if (super.init()) {
      // game doesn't have a pos, id
      delete this._memory[Keys.LOCATION_POS];
      delete this._memory[Keys.LOCATION_ROOM];

      for (let name in this._subject.rooms) {
        let room = this._subject.rooms[name];
        RoomState.left(room);
      }

      // TODO id's of global resources

      return true;
    }

    return false;
  }
}
