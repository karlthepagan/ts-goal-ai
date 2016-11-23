import State from "./abstractState";
import RoomState from "./roomState";
import * as Keys from "../keys";
import SourceState from "./sourceState";

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
      return Memory;
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
      delete Memory.index;
      delete Memory.seen;
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

    if (!Memory.index) {
      Memory.index = {};
    }

    GoalState._master = GoalState._build(Game, Memory);
    GoalState._paused = GoalState._build(Game, undefined);

    return GoalState.master();
  }

  private static _master: GoalState;
  private static _paused: GoalState;

  private static _build(game: Game, mem: any): GoalState {
    return new GoalState().wrap("Game", game, mem) as GoalState;
  }

  public init() {
    if (super.init()) {
      // game doesn't have a pos, id
      delete this._memory[Keys.LOCATION_POS];
      delete this._memory[Keys.LOCATION_ROOM];

      for (let room of this.rooms()) {
        RoomState.left(room);
      }

      // TODO id's of global resources

      return true;
    }

    return false;
  }

  public creeps(f?: (c: Creep) => boolean): Creep[] {
    // TODO lazy
    if (f) {
      return (_.values(this.subject().creeps) as Creep[]).filter(f);
    }
    return _.values(this.subject().creeps) as Creep[];
  }

  public rooms(): Room[] {
    return _.values(this.subject().rooms) as Room[];
  }

  public sourceIds(): string[] {
    const found = Memory.index.sources;
    if (found === undefined) {
      return Memory.index.sources = [];
    }
    return found;
  }

  public forEachSource(f: (s: SourceState) => void) {
    for (const id of this.sourceIds()) {
      f(SourceState.vRight(id));
    }
  }

  public goals(): any {
    return this.memory().goals;
  }

  public toString() {
    return "[GoalState]";
  }
}
