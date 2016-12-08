interface Named {
  className(): string; // TODO replace with (instance).constructor.name
  getId(): string;
}
export default Named;
