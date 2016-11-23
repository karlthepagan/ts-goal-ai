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

  public static build(game: Game): GoalState {
    return GoalState._build(game, GoalState.memory(game));
  }

  public static memory(game: Game) {
    if (game === Game) {
      return Memory.goals;
    } else {
      return (game as any).memory;
    }
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
      delete Memory.log;
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

    if (!Memory.log) {
      Memory.log = {};
    }

    GoalState._master = GoalState._build(Game, Memory.goals);
    GoalState._paused = GoalState._build(Game, undefined);

    return GoalState.master();
  }

  private static _master: GoalState;
  private static _paused: GoalState;

  private static _build(game: Game, mem: any): GoalState {
    return new GoalState().wrap(game, mem) as GoalState;
  }

  public init() {
    if (super.init()) {
      // game doesn't have a pos, id
      delete this._memory[Keys.LOCATION_POS];
      delete this._memory[Keys.LOCATION_ROOM];

      for (let name in this.subject().rooms) {
        let room = this.subject().rooms[name];
        RoomState.left(room);
      }

      // TODO id's of global resources

      return true;
    }

    return false;
  }

  public creeps(): Creep[] {
    // TODO lazy
    return _.values(this.subject().creeps) as Creep[];
  }

  public rooms(): Room[] {
    return _.values(this.subject().rooms) as Room[];
  }

  public toString() {
    return "[GoalState]";
  }
}
