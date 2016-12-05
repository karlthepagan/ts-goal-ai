const types: any = {};

export function registerType(type: Function) {
  const typeName = type.name;
  if (types[typeName] !== undefined) {
    throw new Error("already registered " + typeName);
  }
  types[typeName] = type;
}

export function registerTypeAs(type: Function, alias: string) {
  const typeName = type.name;
  if (types[typeName] === undefined) {
    throw new Error("not registered " + typeName + ", cannot alias");
  }
  if (types[alias] !== undefined) {
    throw new Error("already registered " + alias + ", cannot reassign");
  }
  types[alias] = type;
}

export default function getType(name: string) {
  return types[name];
}

// protected static _classes: { [name: string]: (id: string) => Named } = {};
