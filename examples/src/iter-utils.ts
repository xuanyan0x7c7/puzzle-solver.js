export function* enumerate<T>(iterator: Iterable<T>): Iterable<[number, T]> {
  let index = -1;
  for (const x of iterator) {
    yield [++index, x];
  }
}
