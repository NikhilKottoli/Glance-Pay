# Cross-Metro Energy Balancing: Constrained Arbitrage Model

## 1. Physical Grid Topology

### Indian Grid Regions (Price Areas)
| Metro Cluster | Grid Region | IEX Price Area | Key Transmission Corridors |
|---------------|-------------|----------------|---------------------------|
| Mumbai | Western (WR) | W3 | WR-NR (via 765kV Raipur-Wardha), WR-SR |
| Delhi | Northern (NR) | N2 | NR-WR, NR-ER |
| Bangalore | Southern (SR) | S3 | SR-WR, SR-ER |
| Chennai | Southern (SR) | S1 | SR-WR, SR-ER |
| Hyderabad | Southern (SR) | S2 | SR-WR, SR-ER |

### Inter-Regional Transfer Capability (ATC - 2024 data)
| Corridor | ATC (MW) | Typical Utilization | Congestion Frequency |
|----------|----------|---------------------|---------------------|
| WR → NR | 12,000 | 65% | High (summer) |
| WR → SR | 8,500 | 72% | Medium |
| NR → WR | 10,500 | 58% | Low |
| SR → WR | 7,800 | 70% | Medium |
| ER → NR | 6,200 | 80% | High |

**Key constraint**: Surplus in Mumbai (WR) → Delhi (NR) limited by WR-NR corridor ATC and congestion charges.

---

## 2. Renewable PPA Structure & Surplus Treatment

### Typical Open Access Solar/Wind PPA Terms (India)
| Parameter | Typical Value | Constraint on Surplus Sale |
|-----------|---------------|---------------------------|
| Contract capacity | 50-300 MW per PPA | Fixed |
| Must-run status | Yes (renewables) | Cannot curtail without penalty |
| Energy charge | ₹2.5-3.5/kWh | Fixed for contract tenure |
| Capacity charge | ₹0.5-1.0/kWh | Fixed |
| **Banking allowed** | **Varies by state** | **Critical for surplus** |
| Banking period | Monthly/Quarterly/Annual | Time-limited |
| Banking charge | 2-5% of energy | Loss on banked energy |
| **Surplus sale on IEX** | **Requires specific clause** | **Not automatic** |
| Open access charges | ₹0.5-1.5/kWh | Wheeling + transmission + SLDC |
| DSM (Deviation Settlement) | ₹0-8/kWh | Penalty for schedule deviation |

### State-Level Open Access Charges (2024)
| State | Wheeling (₹/kWh) | Transmission (₹/kWh) | SLDC (₹/kWh) | Total OA Charges |
|-------|------------------|----------------------|--------------|------------------|
| Maharashtra (Mumbai) | 0.45 | 0.38 | 0.02 | **0.85** |
| Delhi | 0.52 | 0.31 | 0.01 | **0.84** |
| Karnataka (Bangalore) | 0.61 | 0.42 | 0.03 | **1.06** |
| Tamil Nadu (Chennai) | 0.58 | 0.35 | 0.02 | **0.95** |
| Telangana (Hyderabad) | 0.50 | 0.33 | 0.02 | **0.85** |

---

## 3. Cross-Metro Arbitrage: Full Cost Stack

### Selling Surplus from Cluster A (e.g., Mumbai) to IEX
```
Revenue_A = π^{IEX}_{WR,t} · E^{surplus}_A
Cost_A = π^{renew}_A · E^{surplus}_A + OA_charges_A · E^{surplus}_A + DSM_penalty_A
Net_A = (π^{IEX}_{WR,t} - π^{renew}_A - OA_charges_A) · E^{surplus}_A - DSM_penalty_A
```

### Buying in Cluster B (e.g., Delhi) from IEX
```
Cost_B = (π^{IEX}_{NR,t} + OA_charges_B + π^{trans}_{WR→NR} + losses_{WR→NR}) · E^{deficit}_B
```

### Net Arbitrage Benefit (Mumbai surplus → Delhi deficit)
```
Benefit = Net_A - Cost_B
        = [π^{IEX}_{WR,t} - π^{renew}_A - OA_A] · E
          - [π^{IEX}_{NR,t} + OA_B + π^{trans} + losses] · E
        = (π^{IEX}_{WR,t} - π^{IEX}_{NR,t}) · E
          - (π^{renew}_A + OA_A + OA_B + π^{trans} + losses) · E
```

### Typical Cost Components (₹/kWh)
| Component | Value | Notes |
|-----------|-------|-------|
| π^{renew} (landed) | 5.00 | PPA energy + capacity charge |
| OA charges (source) | 0.85 | Maharashtra |
| OA charges (sink) | 0.84 | Delhi |
| Inter-regional transmission | 0.30 | PoC charges WR→NR |
| Transmission losses | 0.15 | 3.5% of energy at ₹4.5/kWh |
| DSM risk buffer | 0.20 | Schedule deviation risk |
| **Total friction** | **7.34** | **Per kWh arbitraged** |

### Price Spread Required for Positive Arbitrage
```
Required: π^{IEX}_{WR,t} - π^{IEX}_{NR,t} > 7.34 ₹/kWh
```

**Reality check**: Typical WR-NR price spread is ₹0.5-2.0/kWh (rarely exceeds ₹3/kWh).
**Conclusion**: Cross-metro arbitrage via IEX is **not economically viable** for renewable surplus under current market structure.

---

## 4. Revised Cross-Metro Model

### What IS Possible
1. **Independent IEX participation per cluster**: Each cluster buys/sells on its regional IEX price area
2. **Portfolio-level renewable contracts**: Multi-state PPAs with aggregate balancing (requires trader license)
3. **Inter-state transmission via STOA**: Short-term open access for specific corridors (advance booking)
4. **Renewable Energy Certificate (REC) trading**: Separate market for green attributes

### What is NOT Feasible (Original Assumption)
- ❌ "Sell surplus in Mumbai, buy in Delhi" as frictionless arbitrage
- ❌ Treat renewable surplus as freely tradable inventory
- ❌ Ignore OA charges, transmission losses, DSM, congestion

---

## 5. Corrected Optimization: Cross-Metro Constraints

### Per-Cluster IEX Balance (No Cross-Subsidy)
```
E^{IEX}_{c,t,ω} = E^{IEX,buy}_{c,t,ω} - E^{IEX,sell}_{c,t,ω}
E^{IEX,buy}_{c,t,ω} ≥ 0,  E^{IEX,sell}_{c,t,ω} ≥ 0
```

### Renewable Surplus Handling (Per Cluster)
```
G_{r,t,ω} = G^{used}_{r,t,ω} + G^{banked}_{r,t,ω} + G^{curtailed}_{r,t,ω} + G^{sold}_{r,t,ω}

G^{sold}_{r,t,ω} ≤ G^{surplus,eligible}_{r,t,ω}  (only if PPA permits IEX sale)
Revenue^{REC}_r = REC_price · G_{r,t,ω}  (separate revenue stream)
```

### Transmission Constraints (If STOA Used)
```
∑_{c∈WR} E^{IEX,sell}_{c,t,ω} - ∑_{c∈NR} E^{IEX,buy}_{c,t,ω} ≤ ATC_{WR→NR,t} · Δt
```
(Only if operator holds STOA rights on corridor)

### Revised Objective: No Cross-Metro Arbitrage Term
Remove the implicit "sell surplus in one cluster, buy in another" benefit.
Each cluster optimizes independently with:
- Local renewable generation (use or curtail/bank)
- Local DISCOM contract
- Local IEX price area
- Local swap/charging demand

**Coupling only through**:
- Shared risk budget (CVaR at portfolio level)
- Shared ML platform costs (₹25 Cr/year)
- Corporate overhead allocation

---

## 6. Impact on Original Economics

### Original Claim (Invalid)
> "5% cheaper grid energy and no wasted renewable contracts" via cross-metro balancing

### Corrected Analysis
| Item | Original Assumption | Corrected Reality |
|------|---------------------|-------------------|
| Renewable surplus utilization | Sell on IEX at ₹4.5/kWh | Curtail/bank at ₹0/kWh or REC at ₹1.5/kWh |
| Cross-metro arbitrage | ₹2/kWh savings | **Not viable** (friction > spread) |
| Grid energy cost (after) | ₹6.2/kWh | ₹6.35/kWh (no arbitrage benefit) |
| Wasted renewable contracts | Eliminated | **Partially remain** (banking limits, curtailment) |

### Revised EBITDA Impact
- Energy cost increase: ~₹0.15/kWh × 2,357 GWh = **~₹35 Cr/year higher cost**
- EBITDA margin reduction: ~0.6 percentage points
- **Revised consolidated EBITDA margin: ~15.2%** (still above 12% target)

---

## 7. Regulatory & Commercial Requirements for Cross-Metro

If operator wants genuine cross-metro optimization:
1. **Trader License** (CERC): Required for inter-state trading
2. **STOA/MTOA**: Transmission corridor rights (advance booking, 11-month max for STOA)
3. **PPA Renegotiation**: Surplus sale clauses with renewable developers
4. **Forecasting & Scheduling**: Day-ahead + real-time scheduling per IEGC
5. **DSM Compliance**: Deviation settlement mechanism adherence
6. **REC Registration**: For green attribute monetization

**Timeline**: 12-18 months for full setup. Not achievable in 12-month rollout.

---

## 8. Revised Rollout: Cross-Metro Phasing

| Phase | Months | Scope |
|-------|--------|-------|
| 1 | 0-3 | Independent cluster optimization (no cross-metro) |
| 2 | 3-6 | Shadow mode: per-cluster IEX + renewable optimization |
| 3 | 6-9 | Live: all 5 clusters independent |
| 4 | 9-12 | Portfolio risk optimization (CVaR coupling only) |
| 5 | 12-18 | Explore STOA + trader license for true cross-metro (future) |

---

## 9. Validation Against Critique 3

| Critique Point | Addressed By |
|----------------|--------------|
| Physical feasibility (transmission constraints) | ATC limits, corridor-specific modeling |
| Commercial feasibility (PPA, OA charges) | Full cost stack with OA, transmission, DSM |
| IEX market structure | Regional price areas, separate optimization |
| Surplus treatment | PPA clauses, banking, REC alternative |
| Economic viability | Quantified friction (₹7.34/kWh) vs spread (₹0.5-2.0) |
| Revised economics | Removed invalid arbitrage benefit, recalculated EBITDA |