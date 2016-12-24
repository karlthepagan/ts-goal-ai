import LoDashExplicitArrayWrapper = _.LoDashExplicitArrayWrapper;
import State from "./abstractState";
import {log} from "../support/log";
import {FLYWEIGHTS} from "../../config/config";
import * as F from "../functions";
import {Score, Scored} from "../score/api/score";
import {CachedObjectPos} from "./abstractState";

export default class MineralState extends State<Mineral> {
  public static apiType() {
    return undefined; // TODO Mineral; not a constructor
  }

  public static left(subject: Mineral) {
    return (FLYWEIGHTS ? MineralState._left : new MineralState("MS") ).wrap(subject, State.rootMemory) as MineralState;
  }

  public static right(subject: Mineral) {
    return (FLYWEIGHTS ? MineralState._right : new MineralState("MS") ).wrap(subject, State.rootMemory) as MineralState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? MineralState._vleft : new MineralState("MS") ).wrapRemote(id, State.rootMemory) as MineralState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? MineralState._vright : new MineralState("MS") ).wrapRemote(id, State.rootMemory) as MineralState;
  }

  private static _left: MineralState = new MineralState("MineralStateLeft");
  private static _right: MineralState = new MineralState("MineralStateRight");
  private static _vleft: MineralState = new MineralState("MineralStateVirtualLeft");
  private static _vright: MineralState = new MineralState("MineralStateVirtualRight");

  public score: Score;

  public className() {
    return "MineralState";
  }

  public getType() {
    return LOOK_MINERALS;
  }

  public delete() {
    super.delete();

    delete this.memory.nodes;

    log.debug("delete", this);
  }

  public graph(): LoDashExplicitArrayWrapper<Scored<State<any>>> {
    return _.chain(this.memory.graph as CachedObjectPos[]).map(function(s) {
      const value = State.vright(s.type, s.id);
      const score = F.elvis(s.range, 0);
      if (!value) {
        return undefined;
      }
      return {value, score} as Scored<State<any>>;
    }).compact() as any;
  }

  public nodeDirs(): number[] {
    return this.memory.nodes as number[];
  }

  public nodesAsPos(): RoomPosition[] {
    return (this.memory.nodes as number[]).map(F.dirToPositionCall(this.subject().pos));
  }

  protected _accessAddress() {
    return [LOOK_MINERALS];
  }

  protected _indexAddress() {
    return ["index", LOOK_MINERALS];
  }

  protected init(rootMemory: any, callback?: LifecycleCallback<MineralState>): boolean {
    if (super.init(rootMemory, callback)) {
      this.memory = _.defaultsDeep(this.memory, _.cloneDeep({
        nodes: [],
      }));

      if (!this.isRemote()) {
        const subject = this.subject();
        this.memory.nodes = F.findOpenPositions(subject.room, subject.pos, 1)
          .map(F.posToDirectionCall(subject.pos));
      }

      if (callback !== undefined) {
        callback(this, State.LIFECYCLE_NEW);
      }

      this.memory.graph = State.graphs.buildGraph(this);

      return true;
    }

    return false;
  }
}
