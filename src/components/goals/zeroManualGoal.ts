import GoalState from "../state/goalState";
import * as High from "./high";
import Goal from "./goal";
import Plan from "./plan";
import CreepState from "../state/creepState";
import * as Tasks from "../tasks";
// import {tasks} from "../tasks";

/**
 * ai goal root
 */
export default class ManualGoal extends Goal<Game, Creep, GoalState> {
  constructor() {
    super(undefined);
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor);
  }

  public getGoalKey(): string {
    return High.GOAL_MANUAL;
  }

  public plan(parent: Plan<Game>, state: GoalState): Plan<Creep>[] {
    parent = parent;

    for (const room of state.rooms()) {
      const spawns = room.find<Spawn>(FIND_MY_SPAWNS, {filter: (s: Spawn) => {
        return s.energy >= 300;
      }});

      for (const spawn of spawns) {
        spawn.createCreep([WORK, WORK, CARRY, MOVE]);
      }
    }

    let creeps = this._identifyResources(state);

    // let carriers = creeps.filter( (c) => { return Tasks.isEnergyFull(c, 0.8); });
    // && !CreepState.right(c).isAllocated();
    for (const worker of creeps) {
      if (!Tasks.isEnergyFull(worker, 0.8)) {
        continue;
      }
      const workState = CreepState.left(worker);
      const spawn = worker.pos.findClosestByRange<Spawn>(FIND_MY_SPAWNS, {filter: (s: Spawn) => {
        return !Tasks.isSpawnFull(s, 1);
      }});

      if (spawn != null) {
        const job = worker.transfer(spawn, "energy", worker.carry.energy);
        if (job !== 0) {
          worker.say(job + "d" + worker.moveTo(spawn.pos));
        } else {
          delete creeps[creeps.indexOf(worker)];
        }
      } else {
        console.log(workState, "can't find spawn");
      }
    }

    state.forEachSource( (sourceState) => {
      let sites = sourceState.locations();
      // nextSite:
      for (const site of sites) {
        const worker = site.findClosestByRange<Creep>(FIND_MY_CREEPS, {filter: (c: Creep) => {
          return !Tasks.isEnergyFull(c, 0.8); // && !CreepState.right(c).isAllocated();
        }});

        if (worker !== null) {
          delete creeps[creeps.indexOf(worker)];
          if (worker.pos.isEqualTo(site)) {
            // mine source
            sourceState.allocate(CreepState.left(worker), site);
            const job = sourceState.harvestFrom(worker);
            if (job !== 0) {
              worker.say("e" + job);
            }
          } else {
            const move = worker.moveTo(site);
            if (move !== 0) {
              worker.say("m" + move);
            }
          }
        } else {
          console.log("no worker for", site);
        }
      }
    });

    creeps = creeps.filter((c) => { return c !== undefined; });

    for (const creep of creeps) {
      if (creep !== undefined) {
        creep.say("?");
      }
    }

    return [];
  }

  public elect(state: GoalState, plan: Plan<Creep>[]): Plan<Creep>[] {
    state = state;
    plan = plan;

    return [];
  }

  public execute(actor: Game, plan: Plan<Creep>[]): Plan<Creep>[] {
    actor = actor;
    plan = plan;

    return [];
  }

  protected _goalPriority(): string[] {
    return [];
  }

  protected _identifyResources(state: GoalState): Creep[] {
    return state.creeps(Tasks.isReady);
  }
}
