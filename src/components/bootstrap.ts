import {log} from "./support/log";

export const bootstrap: (() => void)[] = [];

bootstrap.push(() => {
  log.debug("bootstrap");
});
