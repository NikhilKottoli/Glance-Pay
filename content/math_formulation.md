# Corrected Mathematical Formulation

## Notation

### Sets
| Symbol | Description |
|--------|-------------|
| `C` | Set of clusters (|C| = 5: Mumbai, Delhi, Bangalore, Chennai, Hyderabad) |
| `S_c` | Set of sites in cluster `c` |
| `K` | Customer segments: {retail, ride-hailing, logistics} |
| `T` | Time periods (hours), |T| = 24 (rolling horizon) |
| `Ω` | Set of scenarios, |Ω| = 10 |
| `B_c` | Set of stationary battery assets in cluster `c` |
| `P_c` | Set of swap pack pools in cluster `c` |
| `R_c` | Set of renewable generation assets in cluster `c` |

### Parameters
| Symbol | Unit | Description |
|--------|------|-------------|
| `D̂_{c,k,t,ω}` | MWh | Forecast demand for cluster `c`, segment `k`, hour `t`, scenario `ω` |
| `Ĝ_{r,t,ω}` | MWh | Forecast renewable generation for asset `r`, hour `t`, scenario `ω` |
| `π^{IEX}_{t,ω}` | ₹/MWh | IEX day-ahead price hour `t`, scenario `ω` |
| `π^{DISCOM}_c` | ₹/MWh | DISCOM contracted rate for cluster `c` |
| `π^{renew}_r` | ₹/MWh | Renewable PPA rate for asset `r` |
| `Cap^{station}_b` | MWh | Stationary battery energy capacity |
| `P^{max,ch}_b`, `P^{max,dis}_b` | MW | Battery charge/discharge power limits |
| `η^{ch}_b`, `η^{dis}_b` | - | Battery charge/discharge efficiency (√0.90 each way) |
| `SOC^{min}_b`, `SOC^{max}_b` | MWh | Battery min/max state of charge (10%, 90% of capacity) |
| `N^{pack}_{p}` | count | Number of swap packs in pool `p` |
| `Cap^{pack}` | kWh | Energy capacity per swap pack (fixed) |
| `η^{pack,ch}` | - | Pack charging efficiency (0.93) |
| `τ^{ch}` | hours | Pack fast-charge time to 80% (1.5 hrs) |
| `τ^{trans}_{s,s'}` | hours | Transport time between sites `s` and `s'` |
| `V^{trans}` | packs | Transport vehicle capacity |
| `λ^{loss,chg}` | - | Charger conversion loss (0.045) |
| `λ^{loss,bat}` | - | Battery round-trip loss (0.03) |
| `λ^{loss,idle}` | - | Idle pack self-discharge per hour (0.0005) |
| `λ^{loss,dist}_c` | - | Distribution loss cluster `c` (0.02) |
| `π^{sell}_{c,t}` | ₹/MWh | Selling price cluster `c`, hour `t` (decision variable, bounded) |
| `π^{ref}_c` | ₹/MWh | Reference price (previous day cluster average) |
| `ε_k` | - | Price elasticity: retail -0.5, ride-hailing -0.8, logistics -0.3 |
| `C^{wear}` | ₹/MWh | Battery wear cost (₹3,000/MWh = ₹3/kWh) |
| `C^{trans}` | ₹/pack-km | Pack transport cost |
| `C^{unmet}` | ₹/MWh | Unmet demand penalty (₹25,000/MWh = ₹25/kWh) |
| `α` | - | CVaR confidence level (0.95) |
| `D^{max}_c` | MW | Contracted grid demand limit cluster `c` |
| `Reserve` | - | Reserve margin (0.05) |

### Decision Variables
| Symbol | Unit | Description |
|--------|------|-------------|
| `E^{IEX}_{c,t,ω}` | MWh | IEX purchase (+) / sale (-) cluster `c`, hour `t`, scenario `ω` |
| `E^{DISCOM}_{c,t,ω}` | MWh | DISCOM draw cluster `c`, hour `t`, scenario `ω` |
| `E^{ch}_{b,t,ω}` | MWh | Stationary battery `b` charge energy hour `t`, scenario `ω` |
| `E^{dis}_{b,t,ω}` | MWh | Stationary battery `b` discharge energy hour `t`, scenario `ω` |
| `SOC_{b,t,ω}` | MWh | Stationary battery `b` state of charge end of hour `t`, scenario `ω` |
| `E^{ch,pack}_{p,t,ω}` | MWh | Swap pack pool `p` charging energy hour `t`, scenario `ω` |
| `N^{avail}_{p,t,ω}` | count | Charged packs available at pool `p` end of hour `t`, scenario `ω` |
| `N^{chg}_{p,t,ω}` | count | Packs charging at pool `p` during hour `t`, scenario `ω` |
| `N^{trans}_{p,p',t,ω}` | count | Packs in transit from pool `p` to `p'` during hour `t`, scenario `ω` |
| `E^{sold}_{c,k,t,ω}` | MWh | Energy sold to segment `k` cluster `c`, hour `t`, scenario `ω` |
| `E^{unmet}_{c,k,t,ω}` | MWh | Unmet demand cluster `c`, segment `k`, hour `t`, scenario `ω` |
| `π^{sell}_{c,t,ω}` | ₹/MWh | Selling price cluster `c`, hour `t`, scenario `ω` |
| `z_ω` | ₹ | Auxiliary variable for CVaR |
| `η` | ₹ | CVaR threshold variable |

---

## Objective Function

Maximize expected EBITDA minus CVaR risk term:

```
max  (1/|Ω|) ∑_{ω∈Ω} [ Revenue_ω - Cost_ω ] - λ^{CVaR} · CVaR_α(Cost)
```

Where:

**Revenue_ω = ∑_{c∈C} ∑_{k∈K} ∑_{t∈T} π^{sell}_{c,t,ω} · E^{sold}_{c,k,t,ω}**

**Cost_ω = Cost^{energy}_ω + Cost^{wear}_ω + Cost^{trans}_ω + Cost^{unmet}_ω + Cost^{fixed}**

### Energy Procurement Cost
```
Cost^{energy}_ω = ∑_{c∈C} ∑_{t∈T} [
    ∑_{r∈R_c} π^{renew}_r · Ĝ_{r,t,ω}                          (renewable - must take)
  + π^{DISCOM}_c · E^{DISCOM}_{c,t,ω}                          (DISCOM)
  + π^{IEX}_{t,ω} · E^{IEX}_{c,t,ω}                            (IEX net purchase)
] · (1 + λ^{loss,dist}_c)                                      (distribution losses on procurement)
```

### Battery Wear Cost
```
Cost^{wear}_ω = C^{wear} · ∑_{c∈C} ∑_{b∈B_c} ∑_{t∈T} (E^{ch}_{b,t,ω} + E^{dis}_{b,t,ω})
```

### Pack Transport Cost
```
Cost^{trans}_ω = C^{trans} · ∑_{c∈C} ∑_{p,p'∈P_c, p≠p'} ∑_{t∈T} dist_{p,p'} · N^{trans}_{p,p',t,ω}
```

### Unmet Demand Penalty
```
Cost^{unmet}_ω = C^{unmet} · ∑_{c∈C} ∑_{k∈K} ∑_{t∈T} E^{unmet}_{c,k,t,ω}
```

### Fixed Costs (annual, prorated to 24h horizon)
```
Cost^{fixed} = (1,250 Cr / 365) / 1000  [₹ Cr per day → ₹ Cr per 24h]
```

### CVaR Formulation (Rockafellar-Uryasev)
```
CVaR_α(Cost) = min_η [ η + (1/(1-α)) · (1/|Ω|) ∑_{ω∈Ω} max(0, Cost_ω - η) ]

Implemented via:
z_ω ≥ Cost_ω - η,  ∀ω ∈ Ω
z_ω ≥ 0,           ∀ω ∈ Ω
CVaR = η + (1/(1-α)) · (1/|Ω|) ∑_{ω∈Ω} z_ω
```

---

## Constraints

### 1. Energy Balance (per cluster, hour, scenario)
```
∑_{r∈R_c} Ĝ_{r,t,ω} · (1 - λ^{loss,chg})           (renewable after charger loss)
+ E^{DISCOM}_{c,t,ω}
+ E^{IEX}_{c,t,ω}
+ ∑_{b∈B_c} E^{dis}_{b,t,ω} · η^{dis}_b            (battery discharge after loss)
= ∑_{k∈K} E^{sold}_{c,k,t,ω} / (1 - λ^{loss,chg})  (energy sold + charger loss)
+ ∑_{b∈B_c} E^{ch}_{b,t,ω} / η^{ch}_b              (battery charge + loss)
+ ∑_{p∈P_c} E^{ch,pack}_{p,t,ω} / η^{pack,ch}      (pack charging + loss)
```

### 2. Stationary Battery State Transition
```
SOC_{b,t,ω} = SOC_{b,t-1,ω} + η^{ch}_b · E^{ch}_{b,t,ω} - E^{dis}_{b,t,ω} / η^{dis}_b,  ∀b,t,ω

SOC^{min}_b ≤ SOC_{b,t,ω} ≤ SOC^{max}_b,                ∀b,t,ω

0 ≤ E^{ch}_{b,t,ω} ≤ P^{max,ch}_b · Δt,                ∀b,t,ω
0 ≤ E^{dis}_{b,t,ω} ≤ P^{max,dis}_b · Δt,              ∀b,t,ω

∑_{t∈T} (E^{ch}_{b,t,ω} + E^{dis}_{b,t,ω}) / (2 · Cap^{station}_b) ≤ 1,  ∀b,ω  (≤1 cycle/day)
```

### 3. Swap Pack Inventory Balance (per pool, hour, scenario)
```
N^{avail}_{p,t,ω} = N^{avail}_{p,t-1,ω} 
  - Swaps_{p,t,ω}                                    (packs swapped out)
  + N^{chg,complete}_{p,t,ω}                         (packs finished charging)
  + ∑_{p'≠p} N^{trans,arrive}_{p',p,t,ω}             (packs arriving from other sites)
  - ∑_{p'≠p} N^{trans,depart}_{p,p',t,ω}             (packs departing to other sites)

N^{chg}_{p,t,ω} ≤ N^{charger}_{p}                    (charger limit at site)
E^{ch,pack}_{p,t,ω} = N^{chg}_{p,t,ω} · Cap^{pack} · (SOC^{target} - SOC^{depleted}) / η^{pack,ch}

N^{avail}_{p,t,ω} ≥ 0.95 · N^{pack}_{p}              (95% public availability)
```

### 4. Pack Charging Dynamics
```
N^{chg,complete}_{p,t,ω} = N^{chg}_{p,t-τ^{ch},ω}    (packs completing charge after τ^{ch} hours)
N^{trans,arrive}_{p',p,t,ω} = N^{trans,depart}_{p,p',t-τ^{trans}_{p,p'},ω}  (transport delay)
```

### 5. Demand Fulfillment
```
E^{sold}_{c,k,t,ω} + E^{unmet}_{c,k,t,ω} = D̂_{c,k,t,ω} · (π^{sell}_{c,t,ω} / π^{ref}_c)^{ε_k},  ∀c,k,t,ω

E^{sold}_{c,k,t,ω} ≥ 0,  E^{unmet}_{c,k,t,ω} ≥ 0
```

### 6. Price Band Constraint
```
0.8 · π^{ref}_c ≤ π^{sell}_{c,t,ω} ≤ 1.2 · π^{ref}_c,  ∀c,t,ω
```

### 7. Grid Import Limit
```
E^{DISCOM}_{c,t,ω} + max(0, E^{IEX}_{c,t,ω}) ≤ D^{max}_c · Δt,  ∀c,t,ω
```

### 8. Reserve Margin (5% of capacity)
```
∑_{b∈B_c} (SOC^{max}_b - SOC_{b,t,ω}) + ∑_{p∈P_c} (N^{pack}_{p} - N^{avail}_{p,t,ω}) · Cap^{pack}
≥ Reserve · [ ∑_{k∈K} D̂_{c,k,t,ω} + ∑_{b∈B_c} P^{max,dis}_b · Δt ],  ∀c,t,ω
```

### 9. IEX Bid Structure (hourly blocks)
```
E^{IEX}_{c,t,ω} free (positive = buy, negative = sell),  ∀c,t,ω
```

### 10. Non-Anticipativity (first-stage decisions)
```
E^{IEX}_{c,t,ω} = E^{IEX}_{c,t,ω'},  ∀c,t, ω,ω' ∈ Ω  (day-ahead bids same across scenarios)
π^{sell}_{c,t,ω} = π^{sell}_{c,t,ω'},  ∀c,t, ω,ω' ∈ Ω  (price bands set day-ahead)
```

---

## Loss Separation (Addressing Critique 2)

| Loss Component | Symbol | Value | Applied To |
|----------------|--------|-------|------------|
| Charger conversion | `λ^{loss,chg}` | 4.5% | Renewable input, energy sold, battery charge, pack charge |
| Battery round-trip | `λ^{loss,bat}` = 1 - η^{ch}η^{dis} | 10% (but modeled as √0.9 each way) | Battery SOC transition |
| Idle pack self-discharge | `λ^{loss,idle}` | 0.05%/hr | Pack inventory (implicit in availability) |
| Distribution | `λ^{loss,dist}_c` | 2.0% | All procurement, all sales |

**Total system loss** = 1 - (1-λ^{chg})(1-λ^{bat})(1-λ^{idle})(1-λ^{dist}) ≈ 10% (current) → 8% (target)

---

## Solver Specification

| Item | Specification |
|------|---------------|
| Solver | HiGHS (open-source LP/MIP) |
| Problem class | Stochastic LP (linear with CVaR linearization) |
| Variables | ~15 per (c,t,ω) → 5×24×10×15 ≈ 18,000 (validated) |
| Constraints | ~20 per (c,t,ω) → ~24,000 |
| Scenarios | 10 (generated from forecast quantiles) |
| Non-anticipativity | First-stage: IEX bids, price bands |
| Expected solve time | < 60 seconds |
| Optimality gap target | < 0.1% |

---

## Rolling MPC Implementation

At each 15-minute interval:
1. Update forecasts with latest actuals (nowcasts)
2. Re-solve 24-hour horizon with updated initial conditions (SOC, pack inventory)
3. Fix first 1-hour decisions (IEX bids already submitted, so only intra-hour adjustments)
4. Execute: dispatch packs, update prices within band, charge/discharge batteries
5. Fallback rules if solver fails: heuristic based on price spread > ₹3.5/kWh