# Simulation & Backtest Framework

## 1. Backtest Methodology

### Data Requirements
| Data Series | Frequency | History Required | Source |
|-------------|-----------|------------------|--------|
| Demand per site/segment | Hourly | 4+ years | Operator transaction logs |
| Renewable generation (per asset) | 15-min | 4+ years | SCADA / generator data |
| IEX DAM prices (per price area) | Hourly | 4+ years | IEX market data |
| Weather (temp, rain, irradiance, wind) | Hourly | 4+ years | IMD / satellite |
| DISCOM schedule & actual draw | 15-min | 4+ years | SLDC / operator |
| Pack swap transactions | Per swap | 2+ years | Operator swap logs |
| Pack SoH measurements | Monthly | 2+ years | BMS data |

### Train/Test Split
- **Training**: Years 1-4 (35,040 hours)
- **Testing**: Year 5 (8,760 hours)
- **Rolling window**: Re-train forecast models monthly; re-calibrate optimizer quarterly

### Baseline Policy (Rule-Based - Current Operations)
```
IF π_IEX < π_DISCOM: Buy max on IEX
ELSE: Use DISCOM contract

Battery: Charge if π_IEX < ₹4/kWh, Discharge if π_IEX > ₹7/kWh
Pricing: Fixed at ₹16/kWh (no dynamic pricing)
Swap: FIFO inventory, no inter-site transport optimization
Renewable: Must-take, curtail surplus
```

---

## 2. Forecast Model Backtest

### Models to Validate
1. **Demand Forecast**: Gradient Boosting (XGBoost/LightGBM)
   - Targets: P10, P50, P90 per cluster/site/segment/hour
   - Features: Hour, day-of-week, holiday, temp, rain, lagged demand, price
   - Metric: MAPE, Pinball Loss (quantile), CRPS

2. **Renewable Forecast**: 
   - Solar: Irradiance + cloud cover → PVWatts/physical model + ML correction
   - Wind: Wind speed → power curve + ML correction
   - Nowcast: 0-6 hr horizon using satellite/radar
   - Metric: nRMSE, MAE, Ramp capture rate

3. **IEX Price Forecast**: Quantile Regression Forest
   - Targets: P10, P50, P90 per price area/hour
   - Features: Demand forecast, renewable forecast, hydro, coal, gas prices, congestion
   - Metric: Pinball Loss, Directional accuracy

### Forecast Performance Targets (from Critique 5)
| Metric | Current (Reported) | Target | Validation Method |
|--------|-------------------|--------|-------------------|
| Cluster-hour demand MAPE | 18% | 9% | Rolling 30-day on test year |
| Solar forecast nRMSE | ~15% | <10% | Day-ahead, clear-sky normalized |
| Wind forecast nRMSE | ~20% | <12% | Day-ahead |
| IEX price MAPE | ~25% | <15% | Day-ahead DAM |

---

## 3. Optimization Backtest

### Procedure
For each day in test year:
1. Generate forecasts (demand, renewable, IEX) using models trained on prior data
2. Create 10 scenarios via quantile sampling (P10-P90)
3. Solve day-ahead stochastic optimization
4. Record: IEX bids, battery schedule, price bands, swap transport plan
5. During day: Re-solve every 15 min with updated nowcasts (MPC)
6. Simulate execution with actual realizations
7. Compute: Energy costs, revenue, unmet demand, swap fulfillment, reliability

### Metrics to Report
| Category | Metric | Target |
|----------|--------|--------|
| **Economic** | Total energy cost (₹ Cr) | < Baseline |
| | Total revenue (₹ Cr) | > Baseline |
| | EBITDA (₹ Cr) | > Baseline |
| | EBITDA margin | > 12% all clusters |
| **Reliability** | Charging fulfillment % | > 88% |
| | Swap fulfillment % | > 92% |
| | Combined lost share | < 10.3 pp |
| **Losses** | Total system losses | < 8% |
| **Operational** | Solver runtime (sec) | < 60 |
| | Optimality gap | < 0.1% |
| | MPC re-solve frequency | 96/day (15-min) |
| | Fallback trigger rate | < 1% |

---

## 4. Monte Carlo Simulation Framework

### Scenario Generation (Block Resampling)
```
1. Divide historical data into blocks of 168 hours (1 week)
2. For each of 1,000 simulation paths:
   a. Sample 52 blocks with replacement (preserves weekly autocorrelation)
   b. Concatenate to form 8,760-hour synthetic year
   c. Apply climate trend adjustment (if needed)
3. For each path, run full optimization + execution simulation
```

### Block Resampling Advantages
- Preserves temporal correlation (ramp events, weather persistence)
- Captures joint distribution of demand, renewable, price
- Non-parametric (no distributional assumptions)
- Computationally efficient vs. full parametric simulation

### Correlation Structure Preserved
- Demand ↔ Temperature (negative in summer, positive in winter)
- Solar ↔ Price (negative correlation at noon)
- Wind ↔ Solar (negative correlation diurnally)
- Price ↔ Demand (positive correlation at peaks)

---

## 5. Monte Carlo Output Metrics (1,000 Paths)

### Primary Metrics
| Metric | Statistic | Reporting Format |
|--------|-----------|------------------|
| EBITDA Margin | Mean, Std, P5, P25, P50, P75, P95 | Table + CDF plot |
| Reliability (Lost Share) | Mean, P95 (worst 5%) | Table |
| Energy Cost | Mean, P95 | Table |
| Revenue | Mean, P5 | Table |
| Solver Runtime | Mean, Max, P99 | Table |

### Critical Thresholds (from Critique 5)
- **P5 EBITDA Margin ≥ 12%** (executive requirement)
- **P95 Reliability Lost Share ≤ 10.3 pp** (target)
- **Max Solver Runtime < 120 sec** (operational requirement)

### Placeholder Results Table (To Be Filled)
| Metric | Baseline (Rule-Based) | Framework (Optimized) | Improvement |
|--------|----------------------|----------------------|-------------|
| Mean EBITDA Margin | X.X% | Y.Y% | +Z.Z pp |
| P5 EBITDA Margin | X.X% | Y.Y% | +Z.Z pp |
| Mean Reliability Lost | XX.X pp | YY.Y pp | -Z.Z pp |
| P95 Reliability Lost | XX.X pp | YY.Y pp | -Z.Z pp |
| Mean Energy Cost (₹ Cr) | X,XXX | Y,YYY | -Z,ZZZ |
| Mean Revenue (₹ Cr) | X,XXX | Y,YYY | +Z,ZZZ |
| Mean Solver Time (sec) | N/A | XX.X | N/A |
| Max Solver Time (sec) | N/A | XXX.X | N/A |

---

## 6. Sensitivity Analysis Framework

### Parameters to Vary (One-at-a-Time + Joint)
| Parameter | Range | Steps | Impact Measured |
|-----------|-------|-------|-----------------|
| IEX Price Level | -30% to +50% | 9 | EBITDA, Reliability |
| Renewable Generation | -30% to +20% | 11 | EBITDA, Curtailment |
| Demand Growth | -15% to +20% | 8 | EBITDA, Utilization |
| Battery Wear Cost | ₹1.5 - ₹5/kWh | 8 | Cycling, EBITDA |
| Price Elasticity | ±50% of base | 5 | Revenue, Volume |
| Pack Transport Cost | ±50% | 5 | Swap Reliability, Cost |
| CVaR Confidence (α) | 90% - 99% | 5 | Risk, EBITDA |

### Two-Way Sensitivity (Critical Pairs)
1. IEX Price +30% AND Renewables -20% (worst-case)
2. Demand -10% AND IEX +30%
3. Elasticity High AND Price Band Tight (±10%)

---

## 7. Solver Performance Validation

### Problem Dimensions (Corrected from Critique 5)
| Component | Count |
|-----------|-------|
| Clusters | 5 |
| Hours (horizon) | 24 |
| Scenarios | 10 |
| **Scenario-Hour-Cluster tuples** | **1,200** |
| Decision variables per tuple | ~15 |
| **Total continuous variables** | **~18,000** |
| Binary variables (transport, charger on/off) | ~2,000 |
| Constraints per tuple | ~20 |
| **Total constraints** | **~24,000** |
| Non-anticipativity constraints | ~1,200 |

### Cluster Coupling (Addressing Critique 5)
| Coupling Type | Variables | Constraints |
|---------------|-----------|-------------|
| CVaR (portfolio risk) | η, z_ω (11 vars) | 10 (z_ω ≥ Cost_ω - η) |
| Shared ML Platform Cost | 1 (fixed allocation) | 1 |
| Corporate Overhead | 5 (per cluster allocation) | 5 |
| **Total Coupling** | **~27 vars** | **~16 constraints** |

**Conclusion**: Problem is **99.9% decomposable by cluster**. ADMM or Benders decomposition achieves near-linear scaling.

### Solver Settings (HiGHS)
```
Presolve: ON
Crossover: ON (for LP)
IPM Iteration Limit: 1000
Simplex Iteration Limit: 100000
Feasibility Tolerance: 1e-7
Optimality Tolerance: 1e-7
Parallel: ON (threads = 8)
Time Limit: 60 seconds
```

### Expected Performance
| Metric | Expected | Validation |
|--------|----------|------------|
| Day-ahead solve time | 20-40 sec | 100 runs on test instances |
| MPC re-solve time | 5-15 sec | 1000 runs (warm-started) |
| Optimality gap | < 0.01% | Verified via dual bound |
| Memory usage | < 2 GB | Peak monitoring |

---

## 8. Comparison Against Baseline: Statistical Test

### Hypothesis Testing
- **H₀**: Framework EBITDA ≤ Baseline EBITDA
- **H₁**: Framework EBITDA > Baseline EBITDA
- **Test**: Paired t-test on 1,000 Monte Carlo paths (same random seeds)
- **Significance**: α = 0.01 (99% confidence)
- **Power**: > 0.95 (detect 1% margin improvement)

### Non-Inferiority on Reliability
- **H₀**: Framework Reliability ≤ Baseline Reliability - 1 pp
- **H₁**: Framework Reliability > Baseline Reliability - 1 pp
- **Margin**: 1 percentage point non-inferiority margin

---

## 9. Implementation: Simulation Pipeline

```python
# Pseudocode for simulation runner
for path in 1..1000:
    # Generate synthetic year
    synthetic_data = block_resample(historical_data, blocks=52)
    
    # Initialize state
    soc = initial_soc
    pack_inv = initial_pack_inventory
    
    for day in 1..365:
        # Day-ahead
        forecasts = forecast_models.predict(synthetic_data[day])
        scenarios = generate_scenarios(forecasts, n=10)
        da_solution = solve_stochastic_opt(scenarios, soc, pack_inv)
        
        # Intra-day (MPC)
        for interval in 1..96:  # 15-min intervals
            nowcasts = update_forecasts(synthetic_data, day, interval)
            mpc_scenarios = generate_scenarios(nowcasts, n=5)
            mpc_solution = solve_mpc(mpc_scenarios, soc, pack_inv, da_solution)
            
            # Execute
            actuals = synthetic_data[day][interval]
            soc, pack_inv, costs, revenue = execute(mpc_solution, actuals)
            
            # Record metrics
            log_metrics(day, interval, mpc_solution, actuals, costs, revenue)
    
    # Path-level aggregates
    path_ebitda = compute_ebitda(path_logs)
    path_reliability = compute_reliability(path_logs)
    store_path_results(path, path_ebitda, path_reliability)

# Aggregate across paths
results = aggregate_results(all_path_results)
generate_report(results)
```

---

## 10. Validation Against Critique 5

| Critique Point | Addressed By |
|----------------|--------------|
| Variable count arithmetic | Corrected: 1,200 tuples × 15 vars = 18,000 (validated) |
| Linear scaling claim | Coupling analysis: 99.9% decomposable; ADMM/Benders for scaling |
| No actual backtest results | Framework defined with placeholder tables; methodology specified |
| No Monte Carlo results | 1,000-path block resampling framework defined; output metrics specified |
| No solver runtime | HiGHS settings + expected performance + validation protocol |
| No forecast performance | Quantile models with pinball loss; MAPE targets defined |
| No comparison vs baseline | Paired statistical test protocol defined |