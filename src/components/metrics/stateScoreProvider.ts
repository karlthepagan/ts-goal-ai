import {scoreManager} from "./scoreSingleton";
import CreepState from "../state/creepState";
import GlobalState from "../state/globalState";
import MineralState from "../state/mineralState";
import RoomState from "../state/roomState";
import SourceState from "../state/sourceState";
import SpawnState from "../state/spawnState";
import ScoreManager from "./scoreManager";
import ScoreHandler from "./scoreHandler";
import {log} from "../support/log";
// import * as F from "../functions";

type StateScoreImpl<T> = { [key: string]: ScoreHandler<T, GlobalState> };

export default function registerStateScoreProvider() {
  scoreManager.addHandler(new CreepState("proto"), impl.creepState);
  scoreManager.addHandler(new GlobalState("proto"), impl.globalState);
  scoreManager.addHandler(new MineralState("proto"), impl.mineralState);
  scoreManager.addHandler(new RoomState("proto"), impl.roomState);
  scoreManager.addHandler(new SourceState("proto"), impl.sourceState);
  scoreManager.addHandler(new SpawnState("proto"), impl.spawnState);
}

const impl = {
  // CREEPS CREEPS CREEPS CREEPS CREEPS CREEPS CREEPS CREEPS CREEPS CREEPS CREEPS CREEPS CREEPS CREEPS CREEPS CREEPS
  creepState: {
    score: ((state: CreepState, score: ScoreManager<GlobalState>, time: number) => {
      const memory = state.memory("score");
      return _.sum(score.getMetricKeys(state), (key) => {
        return score.getOrRescore(state, memory, time, key);
      });
    }),
  } as StateScoreImpl<CreepState>,

  // GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL GLOBAL
  globalState: {
    // TODO intellij enhancement? ((state, score, time) => {
    control: ((state: GlobalState, score: ScoreManager<GlobalState>, time: number) => {
      // sum of control for all rooms
      return _.sum(state.subject().rooms, (room) => {
        const s = RoomState.right(room);
        return score.getOrRescore(s, s.memory("score"), time, "control");
      });
    }) as ScoreHandler<GlobalState, GlobalState>,
    energy: ((state: GlobalState, score: ScoreManager<GlobalState>, time: number) => {
      return _.sum(state.sources(), (source) => {
        let rval = 0;
        // TODO source access bonus
        // energy velocity for each source
        rval += score.getOrRescore(source, source.memory("score"), time, "venergy");
        // energy transport score for each source
        rval += score.getOrRescore(source, source.memory("score"), time, "tenergy");
        // military risk is folded into the SourceState's raw score
        // also the score delta between global.energy and sum of sources? TODO consider
        return rval;
      });
    }) as ScoreHandler<GlobalState, GlobalState>,
    military: ((state: GlobalState, score: ScoreManager<GlobalState>, time: number) => {
      score = score;
      time = time;

      log.debug("scoring military for", state);
      return 0;
    }) as ScoreHandler<GlobalState, GlobalState>,
    minerals: ((state: GlobalState, score: ScoreManager<GlobalState>, time: number) => {
      return _.sum(state.sources(), (source) => {
        let rval = 0;
        // TODO weights per mineral type
        // TODO mineral access bonus
        // mineral velocity for each mine
        rval += score.getOrRescore(source, source.memory("score"), time, "vminerals");
        // mineral transport score for each mine
        rval += score.getOrRescore(source, source.memory("score"), time, "tminerals");
        // military risk is folded into the MineralState's raw score
        // also the score delta between global.energy and sum of sources? TODO consider
        return rval;
      });
    }) as ScoreHandler<GlobalState, GlobalState>,
    score: ((state: GlobalState, score: ScoreManager<GlobalState>, time: number) => {
      // TODO how to make this default for all handlers?
      const memory = state.memory("score");
      return _.sum(score.getMetricKeys(state), (key) => {
        return score.getOrRescore(state, memory, time, key);
      });
    }),
  } as StateScoreImpl<GlobalState>,

  // MINERALS MINERALS MINERALS MINERALS MINERALS MINERALS MINERALS MINERALS MINERALS MINERALS MINERALS MINERALS
  mineralState: {
    score: ((state: MineralState, score: ScoreManager<GlobalState>, time: number) => {
      const memory = state.memory("score");
      return _.sum(score.getMetricKeys(state), (key) => {
        return score.getOrRescore(state, memory, time, key);
      });
    }) as ScoreHandler<MineralState, GlobalState>,
    tminerals: ((state: MineralState) => {
      state = state;
      // tenergy - distance to an energy transport building
    }) as ScoreHandler<MineralState, GlobalState>,
    vminerals: ((state: MineralState) => {
      state = state;
      // venergy - number of potential workers
      return state.nodeDirs().length;
      // TODO vminerals is limited to minerals regen rate
    }) as ScoreHandler<MineralState, GlobalState>,
  } as StateScoreImpl<MineralState>,

  // ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS ROOMS
  roomState: {
    score: ((state: RoomState, score: ScoreManager<GlobalState>, time: number) => {
      const memory = state.memory("score");
      return _.sum(score.getMetricKeys(state), (key) => {
        return score.getOrRescore(state, memory, time, key);
      });
    }) as ScoreHandler<RoomState, GlobalState>,
    vminerals: ((state: RoomState, score: ScoreManager<GlobalState>, time: number) => {
      state = state;
      score = score;
      time = time;
      // venergy - number of potential workers
      // TODO vminerals is limited to minerals regen rate
    }) as ScoreHandler<RoomState, GlobalState>,
  } as StateScoreImpl<RoomState>,

  // SOURCES SOURCES SOURCES SOURCES SOURCES SOURCES SOURCES SOURCES SOURCES SOURCES SOURCES SOURCES SOURCES SOURCES
  sourceState: {
    score: ((state: SourceState, score: ScoreManager<GlobalState>, time: number) => {
      const memory = state.memory("score");
      return _.sum(score.getMetricKeys(state), (key) => {
        return score.getOrRescore(state, memory, time, key);
      });
    }) as ScoreHandler<SourceState, GlobalState>,
    tenergy: ((state: SourceState) => {
      state = state;
      // tenergy - distance to an energy transport building
      // TODO 1 - score distance to adjacent rooms (& store paths)
      // TODO 2 - score distance on paths & from exits to all storage in that room
    }) as ScoreHandler<SourceState, GlobalState>,
    venergy: ((state: SourceState) => {
      // venergy - number of potential workers
      return state.nodeDirs().length;
      // TODO venergy is limited to source regen rate
    }) as ScoreHandler<SourceState, GlobalState>,
  } as StateScoreImpl<SourceState>,

  // SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS SPAWNS
  spawnState: {
    control: ((state: SpawnState) => {
      state = state; // TODO does control of a room influence spawn's capabilities
      return 0;
    }) as ScoreHandler<SpawnState, GlobalState>,
    energy: ((state: SpawnState) => {
      return state.subject().room.energyAvailable;
    }) as ScoreHandler<SpawnState, GlobalState>,
    score: ((state: SpawnState, score: ScoreManager<GlobalState>, time: number) => {
      const memory = state.memory("score");
      return _.sum(score.getMetricKeys(state), (key) => {
        return score.getOrRescore(state, memory, time, key);
      });
    }) as ScoreHandler<SpawnState, GlobalState>,
  } as StateScoreImpl<SpawnState>,

};
