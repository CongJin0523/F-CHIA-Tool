import ShortUniqueId from 'short-uuid';
const translator = ShortUniqueId();

const getId = () => translator.new();

export { getId };
