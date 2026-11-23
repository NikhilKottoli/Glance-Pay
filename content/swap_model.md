# Battery Swap Operations Model

## Overview
This section develops a complete operational model for battery swapping that integrates with the energy optimization framework. The model operates at **site-level granularity** with **hourly time resolution** and **scenario-based stochasticity**.

---

## 1. Site-Level Pack Inventory State

### State Variables (per site `s ∈ S_c`, hour `t`, scenario `ω`)

| Variable | Unit | Description |
|----------|------|-------------|
| `N^{full}_{s,t,ω}` | packs | Fully charged packs (≥90% SoC) ready for swap |
| `N^{chg}_{s,t,ω}` | packs | Packs currently charging |
| `N^{depleted}_{s,t,ω}` | packs | Depleted packs (≤20% SoC) awaiting charge |
| `N^{trans,in}_{s,t,ω}` | packs | Packs inbound to site `s` (in transit) |
| `N^{trans,out}_{s,t,ω}` | packs | Packs outbound from site `s` (in transit) |
| `SoH_{s,t,ω}` | % | Average state-of-health of packs at site `s` |

### Inventory Conservation
```
N^{total}_s = N^{full}_{s,t,ω} + N^{chg}_{s,t,ω} + N^{depleted}_{s,t,ω} + N^{trans,in}_{s,t,ω} + N^{trans,out}_{s,t,ω}
```
where `N^{total}_s` is fixed (total packs assigned to site `s`).

### Public Availability Constraint (Critique 1)
```
N^{full}_{s,t,ω} ≥ 0.95 · N^{total}_s,  ∀s,t,ω
```
**This is a hard constraint at SITE LEVEL**, not cluster aggregate.

---

## 2. Swap Demand Forecast

### Per-Site, Per-Segment Demand
```
SwapDemand_{s,k,t,ω} = BaseSwap_{s,k,hour,day} 
  × (1 + 0.02 · max(0, Temp_t - 32))
  × (1 - 0.05 · Rain_t)
  × (π^{sell}_{c,t,ω} / π^{ref}_c)^{ε_k}
  × ScenarioFactor_{ω}
```
where `BaseSwap` is calibrated from historical swap transactions per site.

### Total Swaps Executed
```
Swaps_{s,t,ω} = min( SwapDemand_{s,t,ω}, N^{full}_{s,t-1,ω} )
```
**Unmet swap demand** = `SwapDemand_{s,t,ω} - Swaps_{s,t,ω}` → feeds into unmet demand penalty.

---

## 3. Pack Charging Dynamics

### Charging Process
- Depleted pack → Charging (fast charge 0-80% in `τ^{ch}` = 1.5 hrs) → Full
- Charging power per pack: `P^{pack,ch}` = 50 kW (typical DC fast charger)
- Site charger limit: `N^{charger}_s` simultaneous charging ports

### Charging State Transitions
```
N^{chg}_{s,t,ω} = N^{chg}_{s,t-1,ω} 
  + N^{start,chg}_{s,t,ω}                    (newly started charging)
  - N^{complete,chg}_{s,t-τ^{ch},ω}          (completed charging, now full)

N^{depleted}_{s,t,ω} = N^{depleted}_{s,t-1,ω}
  + Swaps_{s,t,ω}                            (swapped-out depleted packs)
  - N^{start,chg}_{s,t,ω}                    (moved to charging)

N^{full}_{s,t,ω} = N^{full}_{s,t-1,ω}
  - Swaps_{s,t,ω}                            (swapped-out full packs)
  + N^{complete,chg}_{s,t,ω}                 (newly charged packs arrive)
  + N^{trans,arrive}_{s,t,ω}                 (inbound transfers)
  - N^{trans,depart}_{s,t,ω}                 (outbound transfers)
```

### Charging Rate Limit
```
N^{start,chg}_{s,t,ω} ≤ min( N^{charger}_s - N^{chg}_{s,t-1,ω}, N^{depleted}_{s,t-1,ω} )
```

### Energy Consumption for Pack Charging
```
E^{ch,pack}_{s,t,ω} = N^{start,chg}_{s,t,ω} · Cap^{pack} · (0.8 - 0.2) / η^{pack,ch}
```
(Charges from 20% to 80% SoC; full charge to 100% done opportunistically)

---

## 4. Pack State-of-Health (SoH) Degradation

### Degradation Model
```
SoH_{s,t,ω} = SoH_{s,t-1,ω} - ΔSoH^{cycle} · Cycles_{s,t,ω} - ΔSoH^{cal} · Δt
```
where:
- `ΔSoH^{cycle}` = 0.02% per equivalent full cycle (EFC)
- `ΔSoH^{cal}` = 0.0001% per hour (calendar aging)
- `Cycles_{s,t,ω}` = `E^{ch,pack}_{s,t,ω} / (N^{total}_s · Cap^{pack})` (EFCs this hour)

### Effective Capacity Reduction
```
Cap^{eff}_{s,t,ω} = Cap^{pack} · SoH_{s,t,ω}
N^{full,eff}_{s,t,ω} = N^{full}_{s,t,ω} · SoH_{s,t,ω}  (energy-equivalent full packs)
```

**Availability constraint with SoH:**
```
N^{full,eff}_{s,t,ω} ≥ 0.95 · N^{total}_s · SoH^{min}
```
where `SoH^{min}` = 80% (packs below 80% SoH retired from swap pool).

---

## 5. Inter-Site Pack Transport

### Transport Network
- Directed graph `G = (S_c, A_c)` where `A_c` = feasible transport routes within metro `c`
- Transport time `τ^{trans}_{s,s'}` ∈ [0.5, 2.0] hours (metro traffic dependent)
- Vehicle capacity `V^{trans}` = 20 packs per trip
- Cost `C^{trans}` = ₹50/pack-km (vehicle + labor)

### Transport Decision Variables
```
N^{trans,depart}_{s,s',t,ω} = packs dispatched from s to s' at hour t
N^{trans,arrive}_{s,s',t,ω} = N^{trans,depart}_{s,s',t-τ^{trans}_{s,s'},ω}
```

### Transport Constraints
```
∑_{s'≠s} N^{trans,depart}_{s,s',t,ω} ≤ N^{depleted}_{s,t,ω}  (only send depleted)
N^{trans,depart}_{s,s',t,ω} ≤ V^{trans} · Trips_{s,s',t}      (vehicle capacity)
∑_{s'≠s} N^{trans,arrive}_{s,s',t,ω} ≤ N^{charger}_s - N^{chg}_{s,t-1,ω}  (charger space for arrivals)
```

### Transport Optimization (within MPC)
Transport decisions are part of the rolling optimization:
- Minimize transport cost + unmet demand penalty
- Rebalance inventory toward sites with forecast deficits
- Respect vehicle availability and traffic conditions

---

## 6. Swap Reliability Metrics (Separate from Charging)

### Site-Level Swap Fulfillment Rate
```
SwapFill_{s,t,ω} = Swaps_{s,t,ω} / SwapDemand_{s,t,ω}  (capped at 1.0)
```

### Cluster-Level Swap Reliability
```
SwapReliability_{c,t,ω} = (∑_{s∈S_c} Swaps_{s,t,ω}) / (∑_{s∈S_c} SwapDemand_{s,t,ω})
```

### Charging Reliability (Energy Delivery)
```
ChargeFill_{c,t,ω} = (∑_{k} E^{sold}_{c,k,t,ω}) / (∑_{k} D̂_{c,k,t,ω})
```

### Combined Reliability KPI (Executive Metric)
```
OverallReliability = w_swap · Avg(SwapReliability) + w_charge · Avg(ChargeFill)
```
where weights reflect revenue share: `w_swap` = 0.4, `w_charge` = 0.6 (40% capacity in swap).

**Target:** Overall ≥ 89.7% (i.e., lost share ≤ 10.3 pp)
- Swap component target: ≥ 92% fulfillment (lost ≤ 8%)
- Charge component target: ≥ 88% fulfillment (lost ≤ 12%)

---

## 7. Integration with Energy Optimizer

### Coupling Points
1. **Energy balance**: Pack charging energy `E^{ch,pack}_{c,t,ω}` appears in cluster energy balance
2. **Price signal**: `π^{sell}_{c,t,ω}` affects both charging demand elasticity and swap demand elasticity
3. **Battery wear**: Pack cycling contributes to `Cost^{wear}` (same ₹3/kWh rate)
4. **Transport cost**: `Cost^{trans}` in objective
5. **Reserve constraint**: Swap pack availability contributes to 5% reserve margin

### Decision Variable Summary (Swap Model Adds)
| Variable | Count (5 clusters × 50 sites × 24h × 10 scen) |
|----------|-----------------------------------------------|
| `N^{full}_{s,t,ω}` | 60,000 |
| `N^{chg}_{s,t,ω}` | 60,000 |
| `N^{depleted}_{s,t,ω}` | 60,000 |
| `N^{trans}_{s,s',t,ω}` | ~120,000 (sparse) |
| `Swaps_{s,t,ω}` | 60,000 |
| `SoH_{s,t,ω}` | 60,000 |
| **Total additional** | **~420,000 variables** |

**Note:** This increases problem size significantly. **Decomposition strategy:**
- Swap model solved as subproblem per cluster (fixed prices, energy allocation from master)
- Master problem (energy optimizer) provides: energy available for pack charging, price bands
- Subproblem returns: pack charging load profile, transport plan, swap reliability
- Iterate via Benders cuts or ADMM (2-3 iterations typical)

---

## 8. Fallback Rules (Execution Layer)

If optimizer fails or data drops:
1. **Pack charging**: Charge whenever `π^{IEX} < π^{sell} - ₹3.5/kWh` (wear threshold)
2. **Transport**: Move packs from sites with >110% target inventory to sites with <90%
3. **Pricing**: Hold at previous day cluster average `π^{ref}_c`
4. **Swap fulfillment**: Prioritize ride-hailing (highest elasticity, highest revenue/km)

---

## 9. Validation Against Critique 1

| Critique Point | Addressed By |
|----------------|--------------|
| Charged packs per site per hour | `N^{full}_{s,t,ω}` state variable |
| Swap demand forecast per site | `SwapDemand_{s,k,t,ω}` with site-level base |
| Pack recharge turnaround | `τ^{ch}` = 1.5 hrs, charger limits `N^{charger}_s` |
| SoC and SoH effects | `SoH_{s,t,ω}` degradation, `Cap^{eff}` reduction |
| Transport capacity & time | `V^{trans}`, `τ^{trans}_{s,s'}`, vehicle constraints |
| Separate reliability metrics | `SwapFill` vs `ChargeFill` reported separately |
| 95% availability at site level | Hard constraint `N^{full}_{s,t,ω} ≥ 0.95·N^{total}_s` |