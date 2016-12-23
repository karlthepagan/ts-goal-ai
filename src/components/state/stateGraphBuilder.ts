import {graphs} from "../singletons";
import State from "./abstractState";
import {CachedObjectPos, default as GraphManager} from "../map/graphManager";

export type ObjectMap = { [id: string]: CachedObjectPos };

/**
 * iterating per node
 * 1 -
 *  a - gather all connected nodes (depth 2-3?)
 *  b - pathfind (dijkstra)
 *  c - if shorter path added goto 1.a (must be shorter by over 10%?)
 * 2 -
 *  a - keping same depth 2 set
 *  b - find closest excluding connected nodes (a*)
 *  c - if found in network, add to connected set and repeat 2.a
 */
export default class StateGraphBuilder {
  private _mem: any;

  constructor(memory: any) {
    this._mem = memory;
  }

  public getNodesFor(obj: CachedObjectPos): CachedObjectPos[]|undefined {
    const group = GraphManager.ENTITY_ADDRESS[obj.type];
    const nodes = this._mem[group];
    const node = nodes[obj.id];
    return node.graph;
  }

  public buildGraph(root: State<any>) {
    // const inNetwork = this.toArray(2, root.memory.graph as CachedObjectPos[]);
    graphs.findNeighbor(root.pos());
  }

  public toArray(depth: number, objs: CachedObjectPos[]): CachedObjectPos[] {
    depth = depth;
    objs = objs;
    // _.chain(objs).map()
    // _.chain(objs).indexBy("id").merge
    return [];
  }
}
