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
import {botMemory} from "../config/config";
import DropState from "./state/dropState";
import FlagState from "./state/flagState";
import StructureState from "./state/structureState";

export const bootstrap: (() => void)[] = [];

bootstrap.push(() => {
  log.info("bootstrap starting");
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

  registerType(InterceptorService);
  registerType(AnonCache);
});

bootstrap.push(() => {
  // log.debug("registering score functions");
  registerStateScoreProvider();
});

bootstrap.push(() => {
  State.setEventRegistry(eventManager);

  const commands = botMemory() as Commands;

  if (commands.debugBuilders) {
    debugger; // Commands.debugBuilders = true
  }

  registerBehaviorProvider(eventManager);
});

bootstrap.push(() => {
  importManager.addMemoryDescription("tooAngel", new TooAngelMemory());
  importManager.addMemoryDescription("ScreepsOS", new ScreepsOsMemory());
});
