const types: any = {};

export function registerType(typeName: string, type: any) {
  if (types[typeName] !== undefined) {
    throw new Error("already registered " + typeName);
  }
  types[typeName] = type;
}

export default function getType(name: string) {
  return types[name];
}

// protected static _classes: { [name: string]: (id: string) => Named } = {};
