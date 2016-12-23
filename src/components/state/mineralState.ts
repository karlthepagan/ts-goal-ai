import LoDashExplicitArrayWrapper = _.LoDashExplicitArrayWrapper;
import State from "./abstractState";
import {log} from "../support/log";
import {botMemory, FLYWEIGHTS} from "../../config/config";
import * as F from "../functions";
import {Score} from "../score/api/score";
import {graphs} from "../singletons";
import {CachedObject} from "../map/graphManager";
import {getType} from "../functions";

export default class MineralState extends State<Mineral> {
  public static apiType() {
    return undefined; // TODO Mineral; not a constructor
  }

  public static left(subject: Mineral) {
    return (FLYWEIGHTS ? MineralState._left : new MineralState("MS") ).wrap(subject, botMemory()) as MineralState;
  }

  public static right(subject: Mineral) {
    return (FLYWEIGHTS ? MineralState._right : new MineralState("MS") ).wrap(subject, botMemory()) as MineralState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? MineralState._vleft : new MineralState("MS") ).wrapRemote(id, botMemory()) as MineralState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? MineralState._vright : new MineralState("MS") ).wrapRemote(id, botMemory()) as MineralState;
  }

  private static _left: MineralState = new MineralState("MineralStateLeft");
  private static _right: MineralState = new MineralState("MineralStateRight");
  private static _vleft: MineralState = new MineralState("MineralStateVirtualLeft");
  private static _vright: MineralState = new MineralState("MineralStateVirtualRight");

  public score: Score;

  public className() {
    return "MineralState";
  }

  public delete() {
    super.delete();

    delete this.memory.nodes;

    log.debug("delete", this);
  }

  public graph(): LoDashExplicitArrayWrapper<State<any>> {
    return _.chain(this.memory.graph as CachedObject[]).map(function(s) {
      return State.vright(s.type, s.id);
    });
  }

  public nodeDirs(): number[] {
    return this.memory.nodes as number[];
  }

  public nodesAsPos(): RoomPosition[] {
    return (this.memory.nodes as number[]).map(F.dirToPositionCall(this.subject().pos));
  }

  protected _accessAddress() {
    return ["minerals"];
  }

  protected _indexAddress() {
    return ["index", "minerals"];
  }

  protected init(rootMemory: any, callback?: LifecycleCallback<MineralState>): boolean {
    if (super.init(rootMemory, callback)) {
      this.memory = _.defaultsDeep(this.memory, _.cloneDeep({
        nodes: [],
      }));

      if (!this.isRemote()) {
        const subject = this.subject();
        this.memory.nodes = F.findOpenPositions(subject.room, subject.pos, 1)
          .map(F.posToDirection(subject.pos));
      }

      if (callback !== undefined) {
        callback(this, State.LIFECYCLE_NEW);
      }

      this.memory.graph = graphs.findNeighbors(this.pos());

      return true;
    }

    return false;
  }
}
