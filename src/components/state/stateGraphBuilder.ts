import {graphs} from "../singletons";
import State from "./abstractState";
import * as Debug from "../util/debug";
import {GraphBuilder} from "./abstractState";
import {CachedObjectPos} from "./abstractState";
import {expand} from "../functions";
import {log} from "../support/log";
import Dictionary = _.Dictionary;

const MERGE_PATH_RATIO = 0.9;
const MERGE_PATH_SCALAR = 3;
const MERGE_NETWORK_DEPTH = 2;

export type ObjectMap = Dictionary<CachedObjectPos>;

interface Node {
  obj: CachedObjectPos;
  pos: RoomPosition;
  graph: CachedObjectPos[];
  graphMask: ObjectMap;
  net: ObjectMap;
  netValues: CachedObjectPos[];
  outerValues: CachedObjectPos[];
}

/**
 * iterating per node
 * 1 -
 *  a - gather all connected nodes (depth 2-3?)
 *  b - pathfind (dijkstra)
 *  c - if shorter path added goto 1.a (must be shorter by over 10%?)
 * 2 -
 *  a - keeping same depth 2 set
 *  b - find closest excluding connected nodes (a*)
 *  c - if found in network, add to connected set and repeat 2.a
 */
export default class StateGraphBuilder implements GraphBuilder {
  private _mem: any;

  constructor(memory: any) {
    this._mem = memory;
  }

  public getNodesFor(obj: CachedObjectPos|undefined): CachedObjectPos[] {
    if (!obj) {
      return [];
    }
    const group = State.ENTITY_ADDRESS[obj.type];
    return expand([group, obj.id, "graph"], this._mem, []);
  }

  public buildGraph(root: State<any>) {
    log.debug(root.pos().roomName, "graph root", root.pos().x, root.pos().y);
    Debug.on("debugGraph");
    Debug.always("observe graph " + root.pos().x + " " + root.pos().y);
    const srcWalkablePos = graphs.findWalkable(root.pos());
    if (!srcWalkablePos) {
      // TODO later, warn isolated structure
      return [];
    }
    // prep the first room call
    graphs.initRoom(srcWalkablePos.roomName);

    const graph = expand(["graph"], root.memory, []) as CachedObjectPos[];
    // source network information
    const src = {
      type: root.getType(),
      obj: this.toCacheObj(root),
      pos: srcWalkablePos,
      graph: graph,
      graphMask: graph ? _.indexBy(graph, "id") : {},
      net: {},
      netValues: [],
      outerValues: [],
    } as Node;
    src.graphMask[src.obj.id] = src.obj;

    let dstGraph: CachedObjectPos[]|undefined = src.graph;
    let dstCost = 0;

    this.addIntoNet(src.obj, 0, src);
    this.flattenGraphInto(src, 1, src.graph, 0);

    this.innerPrune(src, src.obj);

    let merged = false;
    do {
      const closestOutNetwork = graphs.findNeighbor(srcWalkablePos, src.netValues);
      dstGraph = this.getNodesFor(closestOutNetwork);
      if (dstGraph.length > 0) {
        merged = this.innerPrune(src, closestOutNetwork as CachedObjectPos);
      } else if (closestOutNetwork) {
        dstCost = closestOutNetwork.range;
        log.debug("+out", closestOutNetwork.pos.x, closestOutNetwork.pos.y, "cost", closestOutNetwork.range);
        // prune is not needed because there are no node connections
        this.addIntoNet(closestOutNetwork, 0, src);
        this.addLink(src.obj, src.graph, closestOutNetwork, dstGraph);
        merged = false;
      }
    } while (merged);

    this.printGraph(src.obj, {});

    return src.graph;
  }

  protected innerPrune(src: Node, dst: CachedObjectPos): boolean {
    let dstGraph = this.getNodesFor(dst);
    let dstCost = dst.range;

    let merged = false;
    do {
      this.flattenGraphInto(src, MERGE_NETWORK_DEPTH, dstGraph, dstCost);
      dstGraph = [];
      const closestInNetwork = graphs.search(src.pos, src.outerValues, true);
      if (closestInNetwork) {
        dstGraph = this.getNodesFor(closestInNetwork);
        dstCost = closestInNetwork.range;
        if (this.graphMergeAndPrune(src, closestInNetwork, dstGraph)) {
          merged = true;
        } else {
          dstGraph = [];
        }
      }
    } while (dstGraph.length > 0);

    return merged;
  }

  protected addIntoNet(dst: CachedObjectPos, cost: number, src: Node) {
    cost = dst.range + cost;
    if (!src.net[dst.id]) {
      src.net[dst.id] = _.create(dst, {range: cost});
      const val = _.create(dst, {range: 1});
      src.netValues.push(val);
      if (!src.graphMask[dst.id]) {
        src.outerValues.push(val);
      }
    } else {
      const replacing = src.net[dst.id];
      if (replacing.range > cost) {
        replacing.range = cost;
      }
    }
    return true;
  }

  protected flattenGraphInto(src: Node, depth: number, dstGraph: CachedObjectPos[]|undefined, dstCost: number) {
    if (!dstGraph) {
      return false;
    }
    depth--;
    let changed = false;
    for (let i = dstGraph.length - 1; i >= 0; i--) {
      changed = this.addIntoNet(dstGraph[i], dstCost, src) || changed;
    }
    if (depth >= 1) {
      for (let i = dstGraph.length - 1; i >= 0; i--) {
        const o = dstGraph[i];
        if (!src.net[o.id]) {
          changed = this.flattenGraphInto(src, depth, this.getNodesFor(o), dstCost + o.range) || changed;
        }
      }
    }
    return changed;
  }

  protected isLinkRedundant(present: CachedObjectPos, adding: CachedObjectPos, cost: number) {
    return present && adding && (present.range < (adding.range + cost) * MERGE_PATH_RATIO
      || present.range < adding.range + cost - MERGE_PATH_SCALAR);
  }

  protected graphMergeAndPrune(src: Node, dst: CachedObjectPos|undefined, dstGraph: CachedObjectPos[]): boolean {
    if (!dst) {
      return false;
    }
    // dst.range - this is the cost
    // add neighbor or prune
    let dstLong = src.net[dst.id];
    if (this.isLinkRedundant(dstLong, dst, 0)) {
      // not enough path savings, avoid new node
      log.debug("avoid", dst.pos.x, dst.pos.y, dstLong.range, "<~", dst.range);
      return false; // TODO we should sticky this decision?
    }

    log.debug("+", dst.pos.x, dst.pos.y, "cost", dst.range);
    this.addIntoNet(dst, 0, src);

    let changed = this.flattenGraphInto(src, MERGE_NETWORK_DEPTH - 1, dstGraph, dst.range);

    // TODO later - add friend of friend if path is shorter?

    // for each added link check for redundancies
    for (let i = dstGraph.length - 1; i >= 0; i--) {
      const neighbor = dstGraph[i];
      const neighborLong = src.net[neighbor.id];
      if (src.obj.id !== neighbor.id && this.isLinkRedundant(neighborLong, neighbor, dst.range)) {
        // path to neighbor thru new dst is more expensive than network path, so remove it
        log.debug("prune", neighbor.pos.x, neighbor.pos.y, neighborLong.range, "<~", neighbor.range + dst.range);
        dstGraph.splice(i, 1);
        changed = true;
      }
    }

    return changed;
  }

  protected link(dst: CachedObjectPos) {
    const link: any = {
      id: dst.id,
      type: dst.type,
      range: dst.range,
      pos: dst.pos, // TODO later conserve roomname ref?
    };

    if (dst.dir) {
      link.dir = dst.dir;
    }

    return link as CachedObjectPos;
  }

  protected addLink(src: CachedObjectPos, srcGraph: CachedObjectPos[], dst: CachedObjectPos, dstGraph: CachedObjectPos[]) {
    srcGraph.push(this.link(dst));
    dstGraph.push(this.link(_.create(src, {range: dst.range}))); // add reciprocal
  }

  protected toCacheObj(state: State<any>): CachedObjectPos {
    return {id: state.getId(), type: state.getType(), pos: state.pos(), range: 0};
  }

  private printGraph(src: CachedObjectPos, net: any) {
    if (net[src.id]) {
      return;
    }
    net[src.id] = src;
    log.debug(src.pos.x, src.pos.y, "*");
    for (const node of this.getNodesFor(src)) {
      log.debug(src.pos.x, src.pos.y, "--", node.range, "->", node.pos.x, node.pos.y);
    }

    for (const node of this.getNodesFor(src)) {
      this.printGraph(node, net);
    }
  }
}
