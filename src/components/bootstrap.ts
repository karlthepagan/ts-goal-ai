import {log} from "./support/log";
import {importManager} from "./import/importSingleton";
import registerStateScoreProvider from "./impl/stateScoreProvider";
import GlobalState from "./state/globalState";
import TooAngelMemory from "./import/tooAngelMemory";
import State from "./state/abstractState";
import {eventManager} from "./event/eventSingleton";
import ScreepsOsMemory from "./import/screepsOsMemory";
import CreepState from "./state/creepState";
import EnemyCreepState from "./state/enemyCreepState";
import MineralState from "./state/mineralState";
import RoomState from "./state/roomState";
import SourceState from "./state/sourceState";
import ConstructionState from "./state/constructionState";
import {registerType, registerTypeAs} from "./types";
import registerBehaviorProvider from "./impl/behaviorProvider";
import InterceptorService from "./event/impl/interceptorService";
import AnonCache from "./event/impl/anonCache";
import DropState from "./state/dropState";
import FlagState from "./state/flagState";
import StructureState from "./state/structureState";
import {defineEvents} from "./event/api/builtinEvents";
import {scoreManager} from "./score/scoreSingleton";
import * as Debug from "./util/debug";

export const bootstrap: (() => void)[] = [];

bootstrap.push(() => {
  log.debug("bootstrap starting");
  GlobalState.protectMemory("config");
});

bootstrap.push(() => {
  // log.debug("registering state types");
  registerType(ConstructionState);
  registerType(CreepState);
  registerType(DropState);
  registerType(EnemyCreepState);
  registerType(FlagState);
  registerType(GlobalState);
  registerType(MineralState);
  registerType(RoomState);
  registerType(SourceState);
  registerType(StructureState);
  // registerType(SpawnState);

  registerTypeAs(StructureState, STRUCTURE_SPAWN); // TODO all structures?
  registerTypeAs(StructureState, STRUCTURE_CONTAINER);
  registerTypeAs(StructureState, STRUCTURE_EXTENSION);
  registerTypeAs(StructureState, STRUCTURE_STORAGE);
  registerTypeAs(StructureState, STRUCTURE_TOWER);

  registerType(InterceptorService);
  registerType(AnonCache);
});

bootstrap.push(() => {
  // log.debug("registering score functions");
  registerStateScoreProvider();
  State.setScoreManager(scoreManager);
});

bootstrap.push(() => {
  State.setEventRegistry(eventManager);

  Debug.on("debugBuilders");

  defineEvents(eventManager);

  registerBehaviorProvider(eventManager);
});

bootstrap.push(() => {
  importManager.addMemoryDescription("tooAngel", new TooAngelMemory());
  importManager.addMemoryDescription("ScreepsOS", new ScreepsOsMemory());
});
