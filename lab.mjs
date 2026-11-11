// Deterministic resilience model. Text lives in content/locales; this file holds only behaviour.
export const scenarios = Object.freeze({
  healthy: Object.freeze({ latency: 40, route: 'primary' }),
  failed: Object.freeze({ latency: 85, route: 'standby' }),
  recovered: Object.freeze({ latency: 45, route: 'primary' })
});
export function scenarioFor(id) {
  if (!Object.hasOwn(scenarios, id)) throw new RangeError('Unknown scenario');
  return scenarios[id];
}
// Repeatable pseudo-random jitter so the latency trace looks alive without pretending to be measured.
export function jitter(step) {
  const x = Math.sin(step * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}
export function sampleLatency(id, step) {
  return Math.round(scenarioFor(id).latency + jitter(step) * 4);
}
