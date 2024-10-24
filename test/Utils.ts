export function compute_gas(gas_cost : bigint[]) : bigint {
    return gas_cost.reduce((partialSum : bigint, a : bigint) => partialSum + a, 0n);    
}