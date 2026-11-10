export const scenarios = Object.freeze({
healthy: Object.freeze({title:'Primary route active',description:'The router sends requests to the primary service. The standby remains available for a failover.',latency:40,route:'Primary',tradeoff:'Redundancy creates recovery options, with the cost of maintaining an additional service.'}),
failed: Object.freeze({title:'Standby route active',description:'The primary is unavailable in this model. The router redirects new requests to the standby; the extra hop increases the illustrative latency.',latency:85,route:'Standby',tradeoff:'Availability is preserved in this simplified model, at the cost of an extra hop. Real systems must also validate standby capacity and data consistency.'}),
recovered: Object.freeze({title:'Primary restored after health checks',description:'The model assumes the recovery checks have passed. New requests return to the primary while the standby stays ready.',latency:45,route:'Primary',tradeoff:'Returning traffic only after recovery checks reduces flapping. Real systems need a stabilization window and explicit failback criteria.'})
});
export function scenarioFor(id) {
  if (!Object.hasOwn(scenarios,id)) throw new RangeError('Unknown scenario');
  return scenarios[id];
}
