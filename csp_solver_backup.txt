# =============================================================================
# csp_solver.py
# Module 2: The Core AI Brain — CSP + Local Search Optimizer
# Project: Bijli-Dost — AI Slab Scheduler
# FINAL VERSION: Handles mathematically impossible scenarios gracefully
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
# SECTION 1: CSP PROBLEM FORMULATION
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
        self.impossible       = False   # flag for mathematically impossible cases

    # ------------------------------------------------------------------
    # SECTION 2: DOMAIN BUILDER
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
    # SECTION 3: FEASIBILITY CHECK
    # ------------------------------------------------------------------

    def _minimum_possible_units(self) -> float:
        """
        Calculate the absolute minimum units if every appliance
        runs at its minimum allowed hours. If this exceeds the budget,
        the problem is mathematically impossible.
        """
        min_units = sum(
            calculate_monthly_units(name, self.domains[name][0], self.days_remaining)
            for name in self.appliances
        )
        return round(self.consumed + min_units, 4)

    def _floor_assignment(self) -> dict:
        """Set every appliance to its minimum allowed hours."""
        return {name: self.domains[name][0] for name in self.appliances}

    # ------------------------------------------------------------------
    # SECTION 4: CONSTRAINT CHECKERS
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

        hard_penalty = (
            100000 * (total - PROTECTED_SLAB_LIMIT)
            if total > PROTECTED_SLAB_LIMIT else 0
        )
        comfort_penalty = sum(
            abs(assignment[n] - self.appliances[n]) for n in assignment
        )
        slack              = max(0, PROTECTED_SLAB_LIMIT - total)
        efficiency_penalty = slack * 0.1

        return hard_penalty + comfort_penalty + efficiency_penalty

    # ------------------------------------------------------------------
    # SECTION 5: INITIAL ASSIGNMENT
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
    # SECTION 6: HILL CLIMBING
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
    # SECTION 7: MIN-CONFLICTS REPAIR
    # ------------------------------------------------------------------

    def _min_conflicts_repair(self, assignment: dict,
                               max_steps: int = 5000) -> dict:
        current = dict(assignment)

        for _ in range(max_steps):
            if self._total_monthly_units(current) <= PROTECTED_SLAB_LIMIT:
                break

            # Find reducible appliances sorted by monthly contribution
            candidates = []
            for name in current:
                domain = self.domains[name]
                idx    = domain.index(current[name])
                if idx > 0:
                    contrib = calculate_monthly_units(
                        name, current[name], self.days_remaining
                    )
                    candidates.append((contrib, name, idx))

            if not candidates:
                break

            candidates.sort(reverse=True)
            _, worst, widx  = candidates[0]
            domain          = self.domains[worst]
            current[worst]  = domain[widx - 1]

        return current

    # ------------------------------------------------------------------
    # SECTION 8: MAIN SOLVER
    # ------------------------------------------------------------------

    def solve(self, restarts: int = 8) -> dict:

        # ── Feasibility check FIRST ─────────────────────────────────────
        min_possible = self._minimum_possible_units()
        if min_possible > PROTECTED_SLAB_LIMIT:
            # Mathematically impossible — even running everything at
            # minimum hours exceeds the budget. Flag it and return floor.
            self.impossible  = True
            best_assignment  = self._floor_assignment()
            total_units      = self._total_monthly_units(best_assignment)
            daily_units      = sum(
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

        # Run from user preferences
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

        # Min-Conflicts repair if still violated
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
    print("   BIJLI-DOST — csp_solver.py Self-Test (Final)")
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
    # This case is impossible — we just verify it's flagged correctly
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
    print(f"  Total units : {res_c['total_units']} kWh")
    print(f"  Is safe     : {res_c['is_safe']}")
    print(f"  Impossible  : {res_c['impossible']}")
    assert res_c["is_safe"], "❌ Test C Failed!"
    print("  ✅ Test C Passed!")

    print("\n[✓] All tests passed. Final version ready!")
    print("=" * 60)