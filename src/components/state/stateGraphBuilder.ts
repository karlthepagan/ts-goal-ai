import {graphs} from "../singletons";
import State from "./abstractState";
import * as Debug from "../util/debug";
import {GraphBuilder} from "./abstractState";
import {CachedObjectPos} from "./abstractState";
import {expand} from "../functions";
import {log} from "../support/log";

const MERGE_PATH_RATIO = 0.9;
const MERGE_PATH_SCALAR = 3;
const MERGE_NETWORK_DEPTH = 2;

export type ObjectMap = { [id: string]: CachedObjectPos };

interface Node {
  obj: CachedObjectPos;
  graph: CachedObjectPos[];
  net: ObjectMap;
  netValues: CachedObjectPos[];
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
    Debug.always("observe graph");
    // Debug.always("observe graph " + root.pos().x + " " + root.pos().y);
    const srcWalkablePos = graphs.findWalkable(root.pos());
    if (!srcWalkablePos) {
      // TODO later, warn isolated structure
      return [];
    }
    // prep the first room call
    graphs.initRoom(srcWalkablePos.roomName);

    // source network information
    const src = {
      type: root.getType(),
      obj: this.toCacheObj(root),
      graph: root.memory.graph || [],
      net: {},
      netValues: [],
    } as Node;

    let dstGraph: CachedObjectPos[]|undefined = src.graph; // initial flatten composes the
    let dstCost = 0;
    do {
      this.flattenGraphInto(src, MERGE_NETWORK_DEPTH, dstGraph, dstCost);
      dstGraph = [];
      const closestInNetwork = graphs.search(srcWalkablePos, src.netValues, true);
      if (closestInNetwork) {
        dstGraph = this.getNodesFor(closestInNetwork);
        dstCost = closestInNetwork.range;
        const pruned = this.graphMergeAndPrune(src, closestInNetwork, dstGraph);
        if (!pruned) {
          dstGraph = [];
        }
      }
    } while (dstGraph.length > 0);

    this.addIntoNet(src.obj, 0, src.net, src.netValues);
    // dstGraph should be size zero at this point
    do {
      this.flattenGraphInto(src, MERGE_NETWORK_DEPTH, dstGraph, dstCost); // TODO redundant?
      const closestOutNetwork = graphs.findNeighbor(srcWalkablePos, src.netValues);
      dstGraph = this.getNodesFor(closestOutNetwork);
      if (dstGraph.length > 0) {
        const dst = closestOutNetwork as CachedObjectPos; // assert not null!
        dstCost = dst.range;
        this.graphMergeAndPrune(src, closestOutNetwork, dstGraph);
        log.debug("joined", dst.pos.x, dst.pos.y, "cost", dst.range);
        this.addIntoNet(dst, 0, src.net, src.netValues);
        // TODO is merge and prune return needed here?
      } else if (closestOutNetwork) {
        dstCost = closestOutNetwork.range;
        log.debug("+out", closestOutNetwork.pos.x, closestOutNetwork.pos.y, "cost", closestOutNetwork.range);
        // prune is not needed because there are no node connections
        this.addIntoNet(closestOutNetwork, 0, src.net, src.netValues);
        this.addLink(src.obj, src.graph, closestOutNetwork, dstGraph);
        dstGraph = []; // hacky, don't loop!
      }
    } while (dstGraph.length > 0);

    this.printGraph(src.obj, {});

    return src.graph;
  }

  protected addIntoNet(dst: CachedObjectPos, cost: number, srcNetwork: ObjectMap, srcNetworkValues: CachedObjectPos[]) {
    cost = dst.range + cost;
    if (!srcNetwork[dst.id]) {
      srcNetwork[dst.id] = _.create(dst, {range: cost});
      srcNetworkValues.push(_.create(dst, {range: 1}));
    } else {
      const replacing = srcNetwork[dst.id];
      if (replacing.range > cost) {
        replacing.range = cost;
      }
    }
  }

  protected flattenGraphInto(src: Node, depth: number, dstGraph: CachedObjectPos[]|undefined, dstCost: number) {
    if (!dstGraph) {
      return;
    }
    depth--;
    for (let i = dstGraph.length - 1; i >= 0; i--) {
      this.addIntoNet(dstGraph[i], dstCost, src.net, src.netValues);
    }
    if (depth >= 1) {
      for (let i = dstGraph.length - 1; i >= 0; i--) {
        const o = dstGraph[i];
        if (!src.net[o.id]) {
          this.flattenGraphInto(src, depth, this.getNodesFor(o), dstCost + o.range);
        }
      }
    }
  }

  protected graphMergeAndPrune(src: Node, dst: CachedObjectPos|undefined,
                               dstGraph: CachedObjectPos[]): CachedObjectPos|undefined {
    if (!dst) {
      return undefined;
    }
    // dst.range - this is the cost
    // add neighbor or prune
    let dstLong = src.net[dst.id];
    if (dstLong && (dstLong.range * MERGE_PATH_RATIO < dst.range
        || dstLong.range - MERGE_PATH_SCALAR < dst.range)) {
      // not enough path savings, prune new node
      log.debug("pruned", dst.pos.x, dst.pos.y, dstLong.range, "<~", dst.range);
      return dst; // TODO we should sticky this decision?
    }

    log.debug("+", dst.pos.x, dst.pos.y, "cost", dst.range);
    this.addLink(src.obj, src.graph, dst, dstGraph);

    this.flattenGraphInto(src, MERGE_NETWORK_DEPTH - 1, dstGraph, dst.range);

    // TODO later - add friend of friend if path is shorter?

    // TODO later - for each added link check for redundancies?

    // TODO log prune

    return undefined; // TODO srcGraph prune to dst, stop when budget exceeds dst.range
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
