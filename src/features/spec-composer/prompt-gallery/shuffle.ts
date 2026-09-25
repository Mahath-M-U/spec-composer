/**
 * Returns a shuffled copy of `items` (Fisher-Yates). The input array is not
 * mutated. Pass a custom `random` (returning a value in [0, 1)) for tests.
 */
export function shuffled<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
