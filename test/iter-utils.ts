export function count(iterator: Generator) {
  let result = 0;
  for (const _ of iterator) {
    ++result;
  }
  return result;
}
