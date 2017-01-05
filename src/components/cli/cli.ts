import NAME_CAPTURE from "../event/impl/nameCapture";
// import * as Debug from "../util/debug";

type CommandTree = { [name: string]: CommandTree|Function };
type CommandRoot = {};
type Command = CommandTree|Function|CommandRoot;
type Resolver = (a: any) => any;

const ROOT = {} as CommandRoot;

/**
 * Symbol.toPrimitive is the key! everything triggers when that evaluates
 */
export class CLI implements ProxyHandler<Command> {
  public handlers: CommandTree = {};

  public register(command: string, func: Function, ...resolvers: Resolver[]) { // TODO arity? wraps function and protects empty execution
    resolvers = resolvers; // TODO resolvers / arity?
    // TODO proxy chain builder?
    const parts = command.split(".");
    let node = this.handlers;
    for (let i = 0; i < parts.length; i++) {
      const addr = parts[i];
      if (typeof node[addr] === "function" || (i === parts.length - 1 && node[addr])) {
        throw new Error("already registered: " + parts.slice(0, i).join("."));
      }

      if (node[addr]) {
        node = node[addr] as CommandTree;
      } else if (i === parts.length - 1) {
        node[addr] = func;
      } else {
        node = node[addr] = {};
      }
    }
  }

  public get(target: Command, p: PropertyKey): any {
    if (p === Symbol.toPrimitive) {
      // resolve builder stack
    }

    const node = target !== ROOT ? (target as CommandTree)[p] : this.handlers[p];
    if (typeof node === "function") {
      node();
      // returning proxy allows args (better with arity option)
    }
    return new Proxy<CommandTree|Function>(node, this);
  }

  public apply(target: Command, thisArg: any, argArray?: any): any {
    const func = target as Function; // assert: is a function
    return func.apply(thisArg, argArray);
  }
}

const cli = new CLI();
const ai = new Proxy<any>(ROOT, cli);
const arg = new Proxy<any>(ROOT, NAME_CAPTURE);

global.ai = ai;
global.$ = arg;

export default cli;
