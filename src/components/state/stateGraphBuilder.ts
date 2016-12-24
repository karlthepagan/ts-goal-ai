import {graphs} from "../singletons";
import State from "./abstractState";
import * as Debug from "../util/debug";
import {GraphBuilder} from "./abstractState";
import {CachedObjectPos} from "./abstractState";
import {expand} from "../functions";
import {log} from "../support/log";

export type ObjectMap = { [id: string]: CachedObjectPos };

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
    Debug.always("observe graph");
    const walkable = graphs.findWalkable(root.pos());
    if (!walkable) {
      // TODO later, warn isolated structure
      return [];
    }
    // prep the first room call
    graphs.initRoom(walkable.roomName);
    const graphRoot = this.toCacheObj(root);
    const graph: CachedObjectPos[] = root.memory.graph || [];
    // const inNetwork = this.flattenGraph(2, root.memory.graph as CachedObjectPos[]);
    const inNetwork: ObjectMap = {};
    let addedExclusions: CachedObjectPos[]|undefined = graph;
    do {
      this.flattenGraphInto(inNetwork, 2, addedExclusions);
      addedExclusions = [];
      const closestInNetwork = graphs.search(walkable, _.values(inNetwork) as any, true);
      if (closestInNetwork) {
        log.debug("pruning", closestInNetwork.pos.x, closestInNetwork.pos.y);
        addedExclusions = this.getNodesFor(closestInNetwork);
        const pruned = this.graphMergeAndPrune(graphRoot, graph, closestInNetwork, addedExclusions);
        if (!pruned) {
          addedExclusions = [];
        }
      }
    } while (addedExclusions.length > 0);

    inNetwork[graphRoot.id] = graphRoot;
    do {
      this.flattenGraphInto(inNetwork, 2, addedExclusions);
      const closestOutNetwork = graphs.findNeighbor(walkable, _.values(inNetwork) as any);
      addedExclusions = this.getNodesFor(closestOutNetwork);
      if (addedExclusions.length > 0) {
        const adding = closestOutNetwork as CachedObjectPos; // assert not null!
        log.debug("joined", adding.pos.x, adding.pos.y);
        inNetwork[adding.id] = adding;
        // TODO is merge and prune return needed here?
        this.graphMergeAndPrune(graphRoot, graph, closestOutNetwork, addedExclusions);
      } else if (closestOutNetwork) {
        log.debug("+out", closestOutNetwork.pos.x, closestOutNetwork.pos.y);
        // prune is not needed because there are no node connections
        inNetwork[closestOutNetwork.id] = closestOutNetwork;
        this.addLink(graphRoot, graph, closestOutNetwork, addedExclusions);
        addedExclusions = []; // hacky, don't loop!
      }
    } while (addedExclusions.length > 0);

    return graph;
  }

  protected flattenGraphInto(map: ObjectMap, depth: number, objs: CachedObjectPos[]|undefined) {
    if (!objs) {
      return;
    }
    depth--;
    map = _.chain(map).merge(_.indexBy(objs, "id")).value();
    if (depth >= 1) {
      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        if (!map[o.id]) {
          this.flattenGraphInto(map, depth, this.getNodesFor(o));
        }
      }
    }
  }

  protected graphMergeAndPrune(source: CachedObjectPos, graph: CachedObjectPos[], adding: CachedObjectPos|undefined,
                               addingGraph: CachedObjectPos[]): CachedObjectPos|undefined {
    if (!adding) {
      return undefined;
    }
    // add neighbor
    this.addLink(source, graph, adding, addingGraph);

    // TODO NOW - add friend of friend if path is shorter

    // TODO SOON - for each added link check for redundancies

    // TODO log prune

    return undefined; // TODO graph prune to dst = adding, stop when budget exceeds adding.range
  }

  protected addLink(src: CachedObjectPos, srcGraph: CachedObjectPos[], dst: CachedObjectPos, dstGraph: CachedObjectPos[]) {
    srcGraph.push(dst);
    dstGraph.push(_.create(src, {range: dst.range})); // add reciprocal
  }

  protected toCacheObj(state: State<any>): CachedObjectPos {
    return {id: state.getId(), type: state.getType(), pos: state.pos(), range: 0};
  }
}
