import {log} from "./support/log";
import {importManager} from "./import/importSingleton";
import BotMemoryDescription from "./import/botMemoryDescription";
import registerStateScoreProvider from "./metrics/stateScoreProvider";

export const bootstrap: (() => void)[] = [];

bootstrap.push(() => {
  log.debug("bootstrap");
});

bootstrap.push(() => {
  registerStateScoreProvider();
});

bootstrap.push(() => {
  importManager.addMemoryDescription("tooAngel", new BotMemoryDescription());
});
