import State from "./abstractState";
import {botMemory, FLYWEIGHTS} from "../../config/config";
import * as F from "../functions";
import {SourceScore} from "../score/api/sourceScore";
import {graphs} from "../singletons";

const REL = {
  SOURCE: {
    CREEPS_MINING: "workers",
    CREEPS_HAULING: "haulers",
  },
};

export default class SourceState extends State<Source> {
  public static apiType() {
    return Source;
  }

  public static left(subject: Source) {
    return (FLYWEIGHTS ? SourceState._left : new SourceState("SS") ).wrap(subject, botMemory()) as SourceState;
  }

  public static right(subject: Source) {
    return (FLYWEIGHTS ? SourceState._right : new SourceState("SS") ).wrap(subject, botMemory()) as SourceState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? SourceState._vleft : new SourceState("SS") ).wrapRemote(id, botMemory()) as SourceState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? SourceState._vright : new SourceState("SS") ).wrapRemote(id, botMemory()) as SourceState;
  }

  private static _left: SourceState = new SourceState("SourceStateLeft");
  private static _right: SourceState = new SourceState("SourceStateRight");
  private static _vleft: SourceState = new SourceState("SourceStateVirtualLeft");
  private static _vright: SourceState = new SourceState("SourceStateVirtualRight");

  public score: SourceScore;

  constructor(name: string) {
    super(name);
  }

  public className() {
    return "SourceState";
  }

  public isFull(): boolean {
    return this.subject().energy === this.subject().energyCapacity;
  }

  public nodeDirs(): number[] {
    return this.memory.nodes as number[];
  }

  public getWorkers(): string[] {
    return this.memory[REL.SOURCE.CREEPS_MINING];
  }

  public clearWorkers() {
    this.memory[REL.SOURCE.CREEPS_MINING] = [];
  }

  public getHaulers(): any { // TODO Map<string>
    return this.memory[REL.SOURCE.CREEPS_HAULING]; // map worker -> destination struct
  }

  public nodesAsPos(): RoomPosition[] {
    return (this.memory.nodes as number[]).map(F.dirToPositionCall(this.subject().pos));
  }

  protected _accessAddress() {
    return ["sources"];
  }

  protected _indexAddress() {
    return ["index", "sources"];
  }

  protected init(rootMemory: any, callback?: LifecycleCallback<SourceState>): boolean {
    if (super.init(rootMemory, callback)) {
      this.memory = _.defaultsDeep(this.memory, _.cloneDeep({
        nodes: [],
        workers: [],
        haulers: [],
      }));

      if (!this.isRemote()) {
        const subject = this.subject();
        this.memory.nodes = F.findOpenPositions(subject.room, subject.pos, 1)
          .map(F.posToDirection(subject.pos));
      }

      if (callback !== undefined) {
        callback(this, State.LIFECYCLE_NEW);
      }

      graphs.findNeighbor(this.pos());

      return true;
    }

    return false;
  }
}

/*
behaviors: TODO

 */
