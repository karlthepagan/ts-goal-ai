import {graphs} from "../singletons";
import State from "./abstractState";
import * as Debug from "../util/debug";
import {GraphBuilder} from "./abstractState";
import {CachedObjectPos} from "./abstractState";

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

  public getNodesFor(obj: CachedObjectPos|undefined): CachedObjectPos[]|undefined {
    if (!obj) {
      return undefined;
    }
    const group = State.ENTITY_ADDRESS[obj.type];
    const nodes = this._mem[group];
    const node = nodes[obj.id];
    return node.graph;
  }

  public buildGraph(root: State<any>) {
    Debug.always("observe graph");
    const walkable = graphs.findWalkable(root.pos());
    if (!walkable) {
      // TODO later, warn isolated structure
      return [];
    }
    const graph: CachedObjectPos[] = root.memory.graph || [];
    // const inNetwork = this.flattenGraph(2, root.memory.graph as CachedObjectPos[]);
    const inNetwork: ObjectMap = {};
    inNetwork[root.getId()] = this.toCacheObj(root);
    let addedExclusions: CachedObjectPos[]|undefined = graph;
    do {
      this.flattenGraphInto(inNetwork, 2, addedExclusions);
      addedExclusions = undefined;
      const closestInNetwork = graphs.search(walkable, _.values(inNetwork) as any, true);
      if (closestInNetwork) {
        const pruned = this.graphMergeAndPrune(graph, closestInNetwork);
        if (pruned) {
          addedExclusions = this.getNodesFor(closestInNetwork);
        }
      }
    } while (addedExclusions);

    do {
      this.flattenGraphInto(inNetwork, 2, addedExclusions);
      const closestOutNetwork = graphs.findNeighbor(walkable, _.values(inNetwork) as any);
      addedExclusions = this.getNodesFor(closestOutNetwork);
      if (addedExclusions) {
        // TODO is merge and prune needed here?
        this.graphMergeAndPrune(graph, closestOutNetwork);
      } else if (closestOutNetwork) {
        // prune is not needed because there are no node connections
        graph.push(closestOutNetwork); // TODO add reciprocal?
      }
    } while (addedExclusions);

    return graph;
  }

  protected flattenGraphInto(map: ObjectMap, depth: number, objs: CachedObjectPos[]|undefined) {
    if (!objs) {
      return;
    }
    depth--;
    _.merge(map, _(objs).indexBy("id"));
    if (depth >= 1) {
      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        if (!map[o.id]) {
          this.flattenGraphInto(map, depth, this.getNodesFor(o));
        }
      }
    }
  }

  protected graphMergeAndPrune(graph: CachedObjectPos[], adding: CachedObjectPos|undefined): CachedObjectPos|undefined {
    if (!adding) {
      return undefined;
    }
    graph.push(adding); // TODO add reciprocal?

    return undefined; // TODO graph prune to dst = adding, stop when budget exceeds adding.range
  }

  protected toCacheObj(state: State<any>): CachedObjectPos {
    return {id: state.getId(), type: state.getType(), pos: state.pos(), range: 0};
  }
}
