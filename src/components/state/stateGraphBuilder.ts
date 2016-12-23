import {graphs} from "../singletons";
import State from "./abstractState";
import {CachedObjectPos} from "../map/graphManager";

type ObjectMap = { [id: string]: CachedObjectPos };

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

  public static buildGraph(root: State<any>) {
    const inNetwork = StateGraphBuilder.toArray(2, root.memory.graph as CachedObjectPos[]);
    graphs.findNeighbor(root.pos());
  }

  public static toArray(depth: number, objs: CachedObjectPos[]): CachedObjectPos[] {
    _.chain(objs).map()
    _.chain(objs).indexBy("id").merge
  }
}
