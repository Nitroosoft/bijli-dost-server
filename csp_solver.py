# =============================================================================
# csp_solver.py
# Module 2: The Core AI Brain
# Project: Bijli-Dost — AI Slab Scheduler
# ENHANCED VERSION:
#   - K-means Clustering (Week 7)
#   - CSP Problem Formulation (Week 13-14)
#   - Hill Climbing (Week 8)
#   - Simulated Annealing (Week 8)
#   - Local Beam Search (Week 8)
#   - Min-Conflicts Repair
# =============================================================================

import random
import math
from nepra_rules import (
    APPLIANCES,
    APPLIANCE_CONSTRAINTS,
    PROTECTED_SLAB_LIMIT,
    calculate_daily_units,
    calculate_monthly_units,
    get_warning_level,
    is_within_safe_limit,
)


# =============================================================================
# SECTION 1: K-MEANS CLUSTERING (Week 7)
# Groups appliances into HIGH / MEDIUM / LOW power clusters
# Used to make smarter reduction decisions
# =============================================================================

def kmeans_cluster_appliances(appliance_names: list, days_remaining: int,
                               k: int = 3, max_iter: int = 100) -> dict:
    """
    Cluster appliances by their monthly power contribution using K-means.
    Returns a dict mapping each appliance name to its cluster label:
    'HIGH', 'MEDIUM', or 'LOW'
    """
    if not appliance_names:
        return {}

    # Feature: monthly kWh at max hours
    def power_feature(name):
        con = APPLIANCE_CONSTRAINTS.get(name, {"min_hours": 0, "max_hours": 24})
        return calculate_monthly_units(name, con["max_hours"], days_remaining)

    features = {name: power_feature(name) for name in appliance_names}

    if len(appliance_names) < k:
        # Not enough appliances to cluster properly
        sorted_apps = sorted(features.items(), key=lambda x: x[1], reverse=True)
        labels = {}
        cluster_names = ['HIGH', 'MEDIUM', 'LOW']
        for i, (name, _) in enumerate(sorted_apps):
            labels[name] = cluster_names[min(i, k - 1)]
        return labels

    # Initialize centroids using K-means++ style
    values = list(features.values())
    centroids = [max(values), (max(values) + min(values)) / 2, min(values)]

    labels = {}
    for _ in range(max_iter):
        # Assignment step
        new_labels = {}
        for name, val in features.items():
            distances = [abs(val - c) for c in centroids]
            new_labels[name] = distances.index(min(distances))
        
        # Update step
        new_centroids = []
        for ki in range(k):
            cluster_vals = [features[n] for n, l in new_labels.items() if l == ki]
            if cluster_vals:
                new_centroids.append(sum(cluster_vals) / len(cluster_vals))
            else:
                new_centroids.append(centroids[ki])

        if new_centroids == centroids:
            break
        centroids = new_centroids
        labels = new_labels

    # Map cluster indices to meaningful labels
    # Sort centroids to assign HIGH/MEDIUM/LOW correctly
    centroid_order = sorted(range(k), key=lambda i: centroids[i], reverse=True)
    cluster_label_map = {}
    label_names = ['HIGH', 'MEDIUM', 'LOW']
    for rank, ci in enumerate(centroid_order):
        cluster_label_map[ci] = label_names[min(rank, 2)]

    return {name: cluster_label_map[idx] for name, idx in labels.items()}


# =============================================================================
# SECTION 2: CSP PROBLEM FORMULATION (Week 13-14)
# =============================================================================

class BijliDostCSP:

    def __init__(self, selected_appliances: dict, units_already_consumed: float,
                 days_remaining: int):
        self.appliances       = selected_appliances
        self.consumed         = units_already_consumed
        self.days_remaining   = max(1, days_remaining)
        self.budget_remaining = PROTECTED_SLAB_LIMIT - units_already_consumed
        self.daily_budget     = self.budget_remaining / self.days_remaining
        self.domains          = self._build_domains()
        self.impossible       = False

        # ── K-means clustering of appliances (Week 7) ──────────────────
        self.clusters = kmeans_cluster_appliances(
            list(selected_appliances.keys()), self.days_remaining
        )

        # Cluster weights for cost function:
        # HIGH power appliances penalized more for reduction
        # Based on Pakistan household research data:
        # AC = 41% consumption (reduce first)
        # Fans = 22% consumption (protect - every home has 6)
        # Fridge = 14% (protect - essential)
        # Lighting = 15% (protect - necessity)
        self.cluster_weights = {'HIGH': 0.4, 'MEDIUM': 1.5, 'LOW': 4.0}

    # ------------------------------------------------------------------
    # SECTION 3: DOMAIN BUILDER
    # ------------------------------------------------------------------

    def _build_domains(self) -> dict:
        domains = {}
        for name in self.appliances:
            constraints = APPLIANCE_CONSTRAINTS.get(
                name, {"min_hours": 0, "max_hours": 24}
            )
            lo     = constraints["min_hours"]
            hi     = constraints["max_hours"]
            domain = [round(lo + 0.5 * i, 1)
                      for i in range(int((hi - lo) / 0.5) + 1)]
            domains[name] = domain
        return domains

    # ------------------------------------------------------------------
    # SECTION 4: FEASIBILITY CHECK
    # ------------------------------------------------------------------

    def _minimum_possible_units(self) -> float:
        min_units = sum(
            calculate_monthly_units(name, self.domains[name][0], self.days_remaining)
            for name in self.appliances
        )
        return round(self.consumed + min_units, 4)

    def _floor_assignment(self) -> dict:
        return {name: self.domains[name][0] for name in self.appliances}

    # ------------------------------------------------------------------
    # SECTION 5: CONSTRAINT CHECKERS
    # ------------------------------------------------------------------

    def _total_monthly_units(self, assignment: dict) -> float:
        future = sum(
            calculate_monthly_units(name, hours, self.days_remaining)
            for name, hours in assignment.items()
        )
        return round(self.consumed + future, 4)

    def _is_satisfied(self, assignment: dict) -> bool:
        return self._total_monthly_units(assignment) <= PROTECTED_SLAB_LIMIT

    def _cost(self, assignment: dict) -> float:
        total = self._total_monthly_units(assignment)

        # Hard constraint penalty — must not exceed 199
        hard_penalty = (
            100000 * (total - PROTECTED_SLAB_LIMIT)
            if total > PROTECTED_SLAB_LIMIT else 0
        )

        # Comfort penalty — weighted by cluster
        # HIGH power appliances cost more to reduce (user comfort)
        comfort_penalty = 0
        for name in assignment:
            diff    = abs(assignment[name] - self.appliances[name])
            weight  = self.cluster_weights.get(
                self.clusters.get(name, 'MEDIUM'), 1.5
            )
            comfort_penalty += diff * weight

        # Efficiency penalty — reward using more of budget
        slack              = max(0, PROTECTED_SLAB_LIMIT - total)
        efficiency_penalty = slack * 0.1

        return hard_penalty + comfort_penalty + efficiency_penalty

    # ------------------------------------------------------------------
    # SECTION 6: INITIAL ASSIGNMENT
    # ------------------------------------------------------------------

    def _initial_assignment(self, randomize: bool = False) -> dict:
        assignment = {}
        for name in self.appliances:
            domain = self.domains[name]
            if randomize:
                assignment[name] = random.choice(domain)
            else:
                pref             = self.appliances[name]
                assignment[name] = min(domain, key=lambda x: abs(x - pref))
        return assignment

    # ------------------------------------------------------------------
    # SECTION 7: HILL CLIMBING (Week 8)
    # ------------------------------------------------------------------

    def _hill_climbing(self, initial: dict, max_iter: int = 1000) -> dict:
        current      = dict(initial)
        current_cost = self._cost(current)

        for _ in range(max_iter):
            best_n    = None
            best_cost = current_cost

            for name in current:
                domain = self.domains[name]
                idx    = domain.index(current[name])

                for delta in [-1, +1]:
                    ni = idx + delta
                    if 0 <= ni < len(domain):
                        neighbor       = dict(current)
                        neighbor[name] = domain[ni]
                        nc             = self._cost(neighbor)
                        if nc < best_cost:
                            best_n    = neighbor
                            best_cost = nc

            if best_n is None:
                break
            current      = best_n
            current_cost = best_cost

        return current

    # ------------------------------------------------------------------
    # SECTION 8: SIMULATED ANNEALING (Week 8)
    # Accepts worse solutions with decreasing probability
    # Escapes local optima that Hill Climbing gets stuck in
    # ------------------------------------------------------------------

    def _simulated_annealing(self, initial: dict,
                              initial_temp: float = 100.0,
                              cooling_rate: float = 0.995,
                              min_temp: float = 0.01,
                              max_iter: int = 5000) -> dict:
        current      = dict(initial)
        current_cost = self._cost(current)
        best         = dict(current)
        best_cost    = current_cost
        temperature  = initial_temp

        for _ in range(max_iter):
            if temperature < min_temp:
                break

            # Pick random appliance and random neighboring value
            name   = random.choice(list(current.keys()))
            domain = self.domains[name]
            idx    = domain.index(current[name])

            # Random step: -1 or +1
            delta = random.choice([-1, +1])
            ni    = idx + delta
            if not (0 <= ni < len(domain)):
                temperature *= cooling_rate
                continue

            neighbor       = dict(current)
            neighbor[name] = domain[ni]
            neighbor_cost  = self._cost(neighbor)

            # Accept better solutions always
            # Accept worse solutions with probability e^(-delta_cost/T)
            delta_cost = neighbor_cost - current_cost
            if delta_cost < 0 or random.random() < math.exp(-delta_cost / temperature):
                current      = neighbor
                current_cost = neighbor_cost

            # Track global best
            if current_cost < best_cost:
                best      = dict(current)
                best_cost = current_cost

            temperature *= cooling_rate

        return best

    # ------------------------------------------------------------------
    # SECTION 9: LOCAL BEAM SEARCH (Week 8)
    # Runs k parallel searches simultaneously
    # Keeps the best k solutions at each step
    # ------------------------------------------------------------------

    def _local_beam_search(self, k: int = 5, max_iter: int = 200) -> dict:
        # Initialize k random beams
        beams = []
        for _ in range(k):
            assignment = self._initial_assignment(randomize=True)
            cost       = self._cost(assignment)
            beams.append((cost, assignment))

        # Also add one beam from user preferences
        pref_assignment = self._initial_assignment(randomize=False)
        pref_cost       = self._cost(pref_assignment)
        beams.append((pref_cost, pref_assignment))
        beams.sort(key=lambda x: x[0])
        beams = beams[:k]

        best_overall      = dict(beams[0][1])
        best_overall_cost = beams[0][0]

        for _ in range(max_iter):
            # Generate all neighbors from all beams
            all_neighbors = []

            for _, assignment in beams:
                for name in assignment:
                    domain = self.domains[name]
                    idx    = domain.index(assignment[name])

                    for delta in [-1, +1]:
                        ni = idx + delta
                        if 0 <= ni < len(domain):
                            neighbor       = dict(assignment)
                            neighbor[name] = domain[ni]
                            nc             = self._cost(neighbor)
                            all_neighbors.append((nc, neighbor))

            if not all_neighbors:
                break

            # Keep best k neighbors as new beams
            all_neighbors.sort(key=lambda x: x[0])
            beams = all_neighbors[:k]

            # Track global best
            if beams[0][0] < best_overall_cost:
                best_overall_cost = beams[0][0]
                best_overall      = dict(beams[0][1])

            # Early exit if perfect solution found
            if best_overall_cost < 0.01:
                break

        return best_overall

    # ------------------------------------------------------------------
    # SECTION 10: MIN-CONFLICTS REPAIR
    # ------------------------------------------------------------------

    def _min_conflicts_repair(self, assignment: dict,
                               max_steps: int = 5000) -> dict:
        current = dict(assignment)

        for _ in range(max_steps):
            if self._total_monthly_units(current) <= PROTECTED_SLAB_LIMIT:
                break

            # Find reducible appliances
            # Priority: reduce HIGH power cluster first
            candidates = []
            for name in current:
                domain = self.domains[name]
                idx    = domain.index(current[name])
                if idx > 0:
                    contrib  = calculate_monthly_units(
                        name, current[name], self.days_remaining
                    )
                    # HIGH cluster gets reduced first (higher priority)
                    cluster  = self.clusters.get(name, 'MEDIUM')
                    priority = {'HIGH': 5, 'MEDIUM': 2, 'LOW': 0.5}[cluster]
                    candidates.append((contrib * priority, name, idx))

            if not candidates:
                break

            candidates.sort(reverse=True)
            _, worst, widx = candidates[0]
            domain         = self.domains[worst]
            current[worst] = domain[widx - 1]

        return current

    # ------------------------------------------------------------------
    # SECTION 11: MAIN SOLVER
    # ------------------------------------------------------------------

    def solve(self, restarts: int = 8) -> dict:

        # ── Feasibility check FIRST ─────────────────────────────────────
        min_possible = self._minimum_possible_units()
        if min_possible > PROTECTED_SLAB_LIMIT:
            self.impossible = True
            best_assignment = self._floor_assignment()
            total_units     = self._total_monthly_units(best_assignment)
            daily_units     = sum(
                calculate_daily_units(n, h)
                for n, h in best_assignment.items()
            )
            return {
                "schedule"     : best_assignment,
                "total_units"  : round(total_units, 2),
                "daily_units"  : round(daily_units, 2),
                "daily_budget" : round(self.daily_budget, 2),
                "units_saved"  : round(PROTECTED_SLAB_LIMIT - total_units, 2),
                "warning_level": get_warning_level(total_units),
                "is_safe"      : False,
                "impossible"   : True,
                "restarts_used": 0,
            }

        # ── Normal solving path ─────────────────────────────────────────
        best_assignment = None
        best_cost       = math.inf

        # ── Step 1: Local Beam Search (Week 8) ──────────────────────────
        # Run k=5 parallel searches simultaneously
        beam_result = self._local_beam_search(k=5, max_iter=200)
        beam_cost   = self._cost(beam_result)
        if beam_cost < best_cost:
            best_cost       = beam_cost
            best_assignment = beam_result

        # ── Step 2: Simulated Annealing (Week 8) ────────────────────────
        # Start from user preferences
        sa_initial = self._initial_assignment(randomize=False)
        sa_result  = self._simulated_annealing(
            sa_initial,
            initial_temp=100.0,
            cooling_rate=0.995,
            min_temp=0.01,
            max_iter=5000
        )
        sa_cost = self._cost(sa_result)
        if sa_cost < best_cost:
            best_cost       = sa_cost
            best_assignment = sa_result

        # ── Step 3: Hill Climbing with random restarts (Week 8) ─────────
        # Run from user preferences first
        initial = self._initial_assignment(randomize=False)
        result  = self._hill_climbing(initial)
        cost    = self._cost(result)
        if cost < best_cost:
            best_cost       = cost
            best_assignment = result

        # Random restarts
        for _ in range(restarts):
            initial = self._initial_assignment(randomize=True)
            result  = self._hill_climbing(initial)
            cost    = self._cost(result)
            if cost < best_cost:
                best_cost       = cost
                best_assignment = result

        # ── Step 4: SA refinement on best found solution ─────────────────
        # Polish the best solution found so far with SA
        refined = self._simulated_annealing(
            best_assignment,
            initial_temp=50.0,
            cooling_rate=0.99,
            min_temp=0.001,
            max_iter=3000
        )
        refined_cost = self._cost(refined)
        if refined_cost < best_cost:
            best_cost       = refined_cost
            best_assignment = refined

        # ── Step 5: Min-Conflicts repair if still violated ───────────────
        if not self._is_satisfied(best_assignment):
            best_assignment = self._min_conflicts_repair(best_assignment)

        # Final floor fallback
        if not self._is_satisfied(best_assignment):
            best_assignment = self._min_conflicts_repair(self._floor_assignment())

        total_units = self._total_monthly_units(best_assignment)
        daily_units = sum(
            calculate_daily_units(n, h)
            for n, h in best_assignment.items()
        )

        return {
            "schedule"     : best_assignment,
            "total_units"  : round(total_units, 2),
            "daily_units"  : round(daily_units, 2),
            "daily_budget" : round(self.daily_budget, 2),
            "units_saved"  : round(PROTECTED_SLAB_LIMIT - total_units, 2),
            "warning_level": get_warning_level(total_units),
            "is_safe"      : is_within_safe_limit(total_units),
            "impossible"   : False,
            "restarts_used": restarts,
        }


# =============================================================================
# SELF-TEST
# =============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("   BIJLI-DOST — Enhanced AI Solver Self-Test")
    print("   K-means + CSP + Hill Climbing + SA + Local Beam Search")
    print("=" * 60)

    # ── Test A: Normal solvable case ────────────────────────────────────
    print("\n[Test A — Normal Household]")
    csp_a = BijliDostCSP(
        {"AC_1.5_ton": 8, "ceiling_fan": 18,
         "refrigerator": 24, "led_bulb": 8, "tv_led_32": 5},
        units_already_consumed=120,
        days_remaining=15
    )
    res_a = csp_a.solve()
    print(f"  Clusters    : {csp_a.clusters}")
    print(f"  Total units : {res_a['total_units']} kWh")
    print(f"  Is safe     : {res_a['is_safe']}")
    print(f"  Impossible  : {res_a['impossible']}")
    assert res_a["is_safe"], "❌ Test A Failed!"
    print("  ✅ Test A Passed!")

    # ── Test B: Mathematically impossible case ──────────────────────────
    print("\n[Test B — Impossible Heavy Household]")
    csp_b = BijliDostCSP(
        {"AC_2_ton": 10, "AC_1.5_ton": 8, "deep_freezer": 24,
         "refrigerator": 24, "water_pump": 3,
         "geyser_electric": 2, "washing_machine": 3, "desktop_pc": 6},
        units_already_consumed=140,
        days_remaining=12
    )
    res_b = csp_b.solve()
    print(f"  Total units : {res_b['total_units']} kWh")
    print(f"  Is safe     : {res_b['is_safe']}")
    print(f"  Impossible  : {res_b['impossible']}")
    assert res_b["impossible"], "❌ Test B should be flagged impossible!"
    print("  ✅ Test B Passed — impossible case correctly detected!")

    # ── Test C: Danger zone ─────────────────────────────────────────────
    print("\n[Test C — Danger Zone]")
    csp_c = BijliDostCSP(
        {"AC_1.5_ton": 8, "ceiling_fan": 16, "refrigerator": 24,
         "led_bulb": 10, "tv_led_32": 5, "washing_machine": 2},
        units_already_consumed=165,
        days_remaining=18
    )
    res_c = csp_c.solve()
    print(f"  Clusters    : {csp_c.clusters}")
    print(f"  Total units : {res_c['total_units']} kWh")
    print(f"  Is safe     : {res_c['is_safe']}")
    print(f"  Impossible  : {res_c['impossible']}")
    assert res_c["is_safe"], "❌ Test C Failed!"
    print("  ✅ Test C Passed!")

    print("\n[✓] All tests passed. Enhanced version ready!")
    print("=" * 60)