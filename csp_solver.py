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


# SECTION 1: K-MEANS CLUSTERING

def kmeans_cluster_appliances(appliance_names: list, days_remaining: int,
                               k: int = 3, max_iter: int = 100) -> dict:
    if not appliance_names:
        return {}

    def power_feature(name):
        con = APPLIANCE_CONSTRAINTS.get(name, {"min_hours": 0, "max_hours": 24})
        return calculate_monthly_units(name, con["max_hours"], days_remaining)

    features = {name: power_feature(name) for name in appliance_names}

    if len(appliance_names) < k:
        sorted_apps = sorted(features.items(), key=lambda x: x[1], reverse=True)
        labels = {}
        cluster_names = ['HIGH', 'MEDIUM', 'LOW']
        for i, (name, _) in enumerate(sorted_apps):
            labels[name] = cluster_names[min(i, k - 1)]
        return labels

    values = list(features.values())
    centroids = [max(values), (max(values) + min(values)) / 2, min(values)]

    labels = {}
    for _ in range(max_iter):
        new_labels = {}
        for name, val in features.items():
            distances = [abs(val - c) for c in centroids]
            new_labels[name] = distances.index(min(distances))

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

    centroid_order = sorted(range(k), key=lambda i: centroids[i], reverse=True)
    cluster_label_map = {}
    label_names = ['HIGH', 'MEDIUM', 'LOW']
    for rank, ci in enumerate(centroid_order):
        cluster_label_map[ci] = label_names[min(rank, 2)]

    return {name: cluster_label_map[idx] for name, idx in labels.items()}


# SECTION 2: CSP PROBLEM FORMULATION

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

        self.clusters = kmeans_cluster_appliances(
            list(selected_appliances.keys()), self.days_remaining
        )

        self.cluster_weights = {'HIGH': 0.4, 'MEDIUM': 1.5, 'LOW': 4.0}

        self.appliance_priority = {
            'refrigerator'          : 5.0,
            'refrigerator_small'    : 5.0,
            'refrigerator_medium'   : 5.0,
            'refrigerator_large'    : 5.0,
            'ceiling_fan'           : 4.5,
            'inverter_fan'          : 4.5,
            'pedestal_fan'          : 4.0,
            'table_fan'             : 4.0,
            'led_bulb'              : 4.5,
            'energy_saver'          : 4.5,
            'tube_light'            : 4.0,
            'led_tube'              : 4.0,
            'wifi_router'           : 4.0,
            'tv_led_24'             : 3.0,
            'tv_led_32'             : 3.0,
            'tv_led_40'             : 2.8,
            'tv_led_43'             : 2.8,
            'tv_led_50'             : 2.5,
            'tv_led_55'             : 2.5,
            'tv_led_65'             : 2.2,
            'tv_led_75'             : 2.0,
            'tv_led_85'             : 1.8,
            'laptop'                : 3.0,
            'desktop_pc'            : 2.5,
            'washing_machine_semi'  : 2.5,
            'washing_machine_auto'  : 2.5,
            'microwave'             : 2.5,
            'electric_kettle'       : 2.0,
            'toaster'               : 2.0,
            'roti_maker'            : 2.0,
            'water_pump_1hp'        : 3.0,
            'water_pump_0.5hp'      : 3.0,
            'water_pump_1.5hp'      : 2.8,
            'submersible_pump'      : 2.5,
            'cooler'                : 3.5,
            'AC_0.75_ton'           : 1.0,
            'AC_1_ton'              : 0.8,
            'AC_1.5_ton'            : 0.6,
            'AC_2_ton'              : 0.4,
            'AC_2.5_ton'            : 0.3,
            'window_ac_1ton'        : 0.7,
            'geyser_electric_small' : 0.8,
            'geyser_electric_large' : 0.6,
            'immersion_rod'         : 1.0,
            'deep_freezer'          : 1.5,
            'electric_iron'         : 2.0,
            'electric_oven'         : 1.5,
            'induction_cooker'      : 1.5,
            'room_heater'           : 1.0,
            'hair_dryer'            : 1.5,
        }


    # SECTION 3: DOMAIN BUILDER

    def _build_domains(self) -> dict:
        domains = {}
        for name, user_hours in self.appliances.items():
            constraints = APPLIANCE_CONSTRAINTS.get(
                name, {"min_hours": 0, "max_hours": 24}
            )
            lo = constraints["min_hours"]
            hi = max(constraints.get("max_hours", 24), user_hours)
            hi = min(hi, 24)
            domain = [round(lo + 0.5 * i, 1)
                      for i in range(int((hi - lo) / 0.5) + 1)]
            domains[name] = domain
        return domains


    # SECTION 4: FEASIBILITY CHECK

    def _minimum_possible_units(self) -> float:
        min_units = sum(
            calculate_monthly_units(name, self.domains[name][0], self.days_remaining)
            for name in self.appliances
        )
        return round(self.consumed + min_units, 4)

    def _floor_assignment(self) -> dict:
        return {name: self.domains[name][0] for name in self.appliances}


    # SECTION 5: CONSTRAINT CHECKERS

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

        comfort_penalty = 0
        for name in assignment:
            diff = abs(assignment[name] - self.appliances[name])
            weight = self.appliance_priority.get(
                name,
                self.cluster_weights.get(self.clusters.get(name, 'MEDIUM'), 1.5)
            )
            comfort_penalty += diff * weight

        slack              = max(0, PROTECTED_SLAB_LIMIT - total)
        efficiency_penalty = slack * 0.1

        return hard_penalty + comfort_penalty + efficiency_penalty


    # SECTION 6: INITIAL ASSIGNMENT

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


    # SECTION 7: HILL CLIMBING

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


    # SECTION 8: SIMULATED ANNEALING

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

            name   = random.choice(list(current.keys()))
            domain = self.domains[name]
            idx    = domain.index(current[name])

            delta = random.choice([-1, +1])
            ni    = idx + delta
            if not (0 <= ni < len(domain)):
                temperature *= cooling_rate
                continue

            neighbor       = dict(current)
            neighbor[name] = domain[ni]
            neighbor_cost  = self._cost(neighbor)

            delta_cost = neighbor_cost - current_cost
            if delta_cost < 0 or random.random() < math.exp(-delta_cost / temperature):
                current      = neighbor
                current_cost = neighbor_cost

            if current_cost < best_cost:
                best      = dict(current)
                best_cost = current_cost

            temperature *= cooling_rate

        return best


    # SECTION 9: LOCAL BEAM SEARCH

    def _local_beam_search(self, k: int = 5, max_iter: int = 200) -> dict:
        beams = []
        for _ in range(k):
            assignment = self._initial_assignment(randomize=True)
            cost       = self._cost(assignment)
            beams.append((cost, assignment))

        pref_assignment = self._initial_assignment(randomize=False)
        pref_cost       = self._cost(pref_assignment)
        beams.append((pref_cost, pref_assignment))
        beams.sort(key=lambda x: x[0])
        beams = beams[:k]

        best_overall      = dict(beams[0][1])
        best_overall_cost = beams[0][0]

        for _ in range(max_iter):
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

            all_neighbors.sort(key=lambda x: x[0])
            beams = all_neighbors[:k]

            if beams[0][0] < best_overall_cost:
                best_overall_cost = beams[0][0]
                best_overall      = dict(beams[0][1])

            if best_overall_cost < 0.01:
                break

        return best_overall


    # SECTION 10: MIN-CONFLICTS REPAIR

    def _min_conflicts_repair(self, assignment: dict,
                               max_steps: int = 5000) -> dict:
        current = dict(assignment)

        for _ in range(max_steps):
            if self._total_monthly_units(current) <= PROTECTED_SLAB_LIMIT:
                break

            candidates = []
            for name in current:
                domain = self.domains[name]
                idx    = domain.index(current[name])
                if idx > 0:
                    contrib  = calculate_monthly_units(
                        name, current[name], self.days_remaining
                    )
                    indiv_priority = self.appliance_priority.get(
                        name,
                        {'HIGH': 0.5, 'MEDIUM': 2, 'LOW': 5}[
                            self.clusters.get(name, 'MEDIUM')
                        ]
                    )
                    reduction_score = contrib * (1.0 / max(indiv_priority, 0.1))
                    candidates.append((reduction_score, name, idx))

            if not candidates:
                break

            candidates.sort(reverse=True)
            _, worst, widx = candidates[0]
            domain         = self.domains[worst]
            current[worst] = domain[widx - 1]

        return current


    # SECTION 11: MAIN SOLVER

    def solve(self, restarts: int = 8) -> dict:

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

        best_assignment = None
        best_cost       = math.inf

        beam_result = self._local_beam_search(k=5, max_iter=200)
        beam_cost   = self._cost(beam_result)
        if beam_cost < best_cost:
            best_cost       = beam_cost
            best_assignment = beam_result

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

        initial = self._initial_assignment(randomize=False)
        result  = self._hill_climbing(initial)
        cost    = self._cost(result)
        if cost < best_cost:
            best_cost       = cost
            best_assignment = result

        for _ in range(restarts):
            initial = self._initial_assignment(randomize=True)
            result  = self._hill_climbing(initial)
            cost    = self._cost(result)
            if cost < best_cost:
                best_cost       = cost
                best_assignment = result

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

        if not self._is_satisfied(best_assignment):
            best_assignment = self._min_conflicts_repair(best_assignment)

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


# SECTION 12: SELF-TEST

if __name__ == "__main__":
    print("BIJLI-DOST — Enhanced AI Solver Self-Test")
    print("K-means + CSP + Hill Climbing + SA + Local Beam Search")

    print("\n[Test A — Normal Household]")
    csp_a = BijliDostCSP(
        {"AC_1.5_ton": 8, "ceiling_fan": 18,
         "refrigerator_medium": 24, "led_bulb": 8, "tv_led_32": 5},
        units_already_consumed=120,
        days_remaining=15
    )
    res_a = csp_a.solve()
    print(f"  Clusters    : {csp_a.clusters}")
    print(f"  Total units : {res_a['total_units']} kWh")
    print(f"  Is safe     : {res_a['is_safe']}")
    print(f"  Impossible  : {res_a['impossible']}")
    assert res_a["is_safe"], "Test A Failed!"
    print("  Test A Passed!")

    print("\n[Test B — Impossible Heavy Household]")
    csp_b = BijliDostCSP(
        {"AC_2_ton": 10, "AC_1.5_ton": 8, "deep_freezer": 24,
         "refrigerator_large": 24, "water_pump_1hp": 3,
         "geyser_electric_large": 2, "washing_machine_auto": 3, "desktop_pc": 6},
        units_already_consumed=140,
        days_remaining=12
    )
    res_b = csp_b.solve()
    print(f"  Total units : {res_b['total_units']} kWh")
    print(f"  Is safe     : {res_b['is_safe']}")
    print(f"  Impossible  : {res_b['impossible']}")
    assert res_b["impossible"], "Test B should be flagged impossible!"
    print("  Test B Passed!")

    print("\n[Test C — Danger Zone]")
    csp_c = BijliDostCSP(
        {"AC_1.5_ton": 8, "ceiling_fan": 16, "refrigerator_medium": 24,
         "led_bulb": 10, "tv_led_32": 5, "washing_machine_semi": 2},
        units_already_consumed=165,
        days_remaining=18
    )
    res_c = csp_c.solve()
    print(f"  Clusters    : {csp_c.clusters}")
    print(f"  Total units : {res_c['total_units']} kWh")
    print(f"  Is safe     : {res_c['is_safe']}")
    print(f"  Impossible  : {res_c['impossible']}")
    assert res_c["is_safe"], "Test C Failed!"
    print("  Test C Passed!")

    print("\nAll tests passed. Enhanced version ready!")