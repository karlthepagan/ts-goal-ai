import {graphs} from "../singletons";
import State from "./abstractState";
import * as Debug from "../util/debug";
import {GraphBuilder} from "./abstractState";
import {CachedObjectPos} from "./abstractState";
import {expand} from "../functions";
import {log} from "../support/log";
import Dictionary = _.Dictionary;

const MERGE_PATH_SCALAR = 3;
const MERGE_NETWORK_DEPTH = 2;

export type ObjectMap = Dictionary<CachedObjectPos>;

interface Node {
  obj: CachedObjectPos; // target
  pos: RoomPosition; // walkable position
  graph: CachedObjectPos[]; // neighbors (TODO sort)
  graphMask: ObjectMap; // index of neighbors -- coreNet
  net: ObjectMap; // total network
  netValues: CachedObjectPos[]; // total net values -- allNoes// (TODO sort)
  outerValues: CachedObjectPos[]; // total network minus graph -- shellNodes (TODO sort)
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
 *  c - if found in network, add to connected set by repeating 1.a onward
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

    src.net[src.obj.id] = src.obj;
    src.netValues.push(src.obj);

    this.addIntoNet(src.obj, 0, src);
    this.flattenGraphInto(src, MERGE_NETWORK_DEPTH, src.graph, 0);

    let joined = false;

    do {
      const closestOuter = graphs.findNeighbor(src.pos, src.netValues);

      if (closestOuter) {
        joined = this.addOutsideLink(src, closestOuter); // TODO detect redundant link (close flybys)
        // TODO prune something?
      } else {
        joined = false;
      }
    } while (joined);

    do {
      const closestShell = graphs.search(src.pos, src.outerValues, true);

      if (closestShell) {
        joined = this.addShellLink(src, closestShell);
      } else {
        joined = false;
      }
    } while (joined);

    this.printGraph(src.obj, {});

    return _.sortBy(src.graph, "id");
  }

  protected addOutsideLink(src: Node, dst: CachedObjectPos) {
    src.net[dst.id] = dst;
    src.graphMask[dst.id] = dst;
    const val = _.create(dst, {range: 1});
    src.netValues.push(val);
    const dstGraph = this.getNodesFor(dst);
    // const joined = dstGraph.length > 0;
    // TODO if dstCost < MERGE_PATH_SCALAR, add to src.graph?
    const joined = this.flattenGraphInto(src, MERGE_NETWORK_DEPTH, dstGraph, dst.range - MERGE_PATH_SCALAR);
    this.addLink(src.obj, src.graph, dst, dstGraph);
    return joined;
  }

  protected addShellLink(src: Node, dst: CachedObjectPos) {
    src.graphMask[dst.id] = dst;
    const di = _.sortedIndex(src.outerValues, dst, "id");
    if (src.outerValues[di].id === dst.id) {
      // if (src.outerValues.length > 64) {
      //   src.outerValues[di] = null; // TODO pick another value and copy to this index
      // } else {
      src.outerValues.splice(di, 1);
      // }
    }
    const dstGraph = this.getNodesFor(dst);
    // TODO check for cost delta
    const joined = this.flattenGraphInto(src, MERGE_NETWORK_DEPTH, dstGraph, dst.range - MERGE_PATH_SCALAR);
    const dstLong = src.net[dst.id];
    if (!dstLong || dstLong.range > dst.range) {
      Debug.always("avoid " + src.obj.pos.x + " " + src.obj.pos.y + "--" + dst.range + "->" + dst.pos.x + " " + dst.pos.y);
      this.addLink(src.obj, src.graph, dst, dstGraph);
    }
    return joined;
  }

  protected addIntoNet(dst: CachedObjectPos, cost: number, src: Node) {
    cost = dst.range + cost;
    if (!src.net[dst.id]) {
      src.net[dst.id] = _.create(dst, {range: cost});
      const val = _.create(dst, {range: 1});
      src.netValues.push(val); // TODO sort
      if (!src.graphMask[dst.id]) {
        src.outerValues.push(val); // TODO sort
      }
      return true;
    } else {
      const replacing = src.net[dst.id];
      if (replacing.range > cost) {
        replacing.range = cost;
      }
      return false;
    }
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
          changed = this.flattenGraphInto(src, depth, this.getNodesFor(o), dstCost + o.range - MERGE_PATH_SCALAR) || changed;
        }
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
