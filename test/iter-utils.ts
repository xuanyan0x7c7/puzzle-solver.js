export function count<T>(iterator: Iterable<T>) {
  let result = 0;
  for (const _ of iterator) {
    ++result;
  }
  return result;
}
