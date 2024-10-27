/*

  Some utils

*/

export function randomTo(ms: number) {
  return Math.floor(Math.random() * ms);
}

export async function triggerRandomly(
  clb: VoidFunction,
  maxFires: number,
  diff: number = 50
) {
  if (maxFires <= 0) return;
  await awaitTimeout(randomTo(diff));
  clb();
  triggerRandomly(clb, maxFires - 1, diff);
}

export async function awaitTimeout(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
