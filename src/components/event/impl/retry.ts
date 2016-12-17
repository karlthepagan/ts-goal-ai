export default class Retry extends Error {
  constructor(message?: string) {
    super(message);
  }
}
