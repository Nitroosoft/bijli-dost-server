# =============================================================================
# nepra_rules.py
# Module 1: NEPRA Constants, Appliance Data, and Hard Constraints
# Project: Bijli-Dost — AI Slab Scheduler
# =============================================================================

# -----------------------------------------------------------------------------
# SECTION 1: NEPRA SLAB CONSTANTS
# These are the official thresholds that define the "protected" billing slab.
# SOURCE: NEPRA tariff schedule (domestic consumers)
# -----------------------------------------------------------------------------

PROTECTED_SLAB_LIMIT    = 199   # units (kWh) — stay AT or BELOW this
DANGER_THRESHOLD        = 195   # units — Bijli-Dost raises a warning here
CRITICAL_THRESHOLD      = 198   # units — last-chance warning
DAYS_IN_BILLING_CYCLE   = 30    # standard billing month


# -----------------------------------------------------------------------------
# SECTION 2: STANDARD APPLIANCE WATTAGE DICTIONARY
# Wattage values are real-world averages for Pakistani household appliances.
# Key   : appliance name (string ID used throughout the system)
# Value : power consumption in WATTS (W)
# Formula to convert to units: kWh = (Watts × Hours) / 1000
# -----------------------------------------------------------------------------

APPLIANCES = {
    # Cooling & Heating
    "AC_1_ton":         1500,   # 1-Ton Air Conditioner
    "AC_1.5_ton":       2000,   # 1.5-Ton Air Conditioner (most common in PK)
    "AC_2_ton":         2500,   # 2-Ton Air Conditioner
    "ceiling_fan":      75,     # Standard ceiling fan
    "pedestal_fan":     60,     # Standing/pedestal fan
    "cooler":           200,    # Air cooler (desert cooler)

    # Kitchen Appliances
    "refrigerator":     150,    # Single-door fridge (avg. always-on load)
    "deep_freezer":     200,    # Chest freezer
    "microwave":        1200,   # Standard microwave oven
    "electric_kettle":  1500,   # Electric kettle
    "toaster":          800,    # Pop-up toaster
    "washing_machine":  500,    # Semi-automatic washing machine

    # Lighting
    "led_bulb":         10,     # Single LED bulb (per bulb)
    "energy_saver":     20,     # CFL energy saver bulb
    "tube_light":       40,     # Fluorescent tube light

    # Entertainment & Office
    "tv_led_32":        60,     # 32-inch LED TV
    "tv_led_55":        120,    # 55-inch LED TV
    "laptop":           65,     # Laptop (charging + use)
    "desktop_pc":       200,    # Desktop computer + monitor
    "wifi_router":      10,     # Wi-Fi router (always on)

    # Water & Utilities
    "water_pump":       750,    # Domestic water pump (1 HP)
    "geyser_electric":  3000,   # Electric water heater/geyser
    "iron":             1000,   # Clothes iron
}


# -----------------------------------------------------------------------------
# SECTION 3: HARD CONSTRAINTS PER APPLIANCE
# These are non-negotiable operational rules.
# min_hours : appliance MUST run at least this many hours/day
# max_hours : appliance CANNOT run more than this many hours/day
# -----------------------------------------------------------------------------

APPLIANCE_CONSTRAINTS = {
    "AC_1_ton":         {"min_hours": 0,  "max_hours": 12},
    "AC_1.5_ton":       {"min_hours": 0,  "max_hours": 12},
    "AC_2_ton":         {"min_hours": 0,  "max_hours": 10},
    "ceiling_fan":      {"min_hours": 0,  "max_hours": 24},
    "pedestal_fan":     {"min_hours": 0,  "max_hours": 24},
    "cooler":           {"min_hours": 0,  "max_hours": 18},
    "refrigerator":     {"min_hours": 12, "max_hours": 24},  # Must run >= 12h (food safety)
    "deep_freezer":     {"min_hours": 16, "max_hours": 24},  # Must run >= 16h
    "microwave":        {"min_hours": 0,  "max_hours": 2},
    "electric_kettle":  {"min_hours": 0,  "max_hours": 1},
    "toaster":          {"min_hours": 0,  "max_hours": 1},
    "washing_machine":  {"min_hours": 0,  "max_hours": 4},
    "led_bulb":         {"min_hours": 0,  "max_hours": 12},
    "energy_saver":     {"min_hours": 0,  "max_hours": 12},
    "tube_light":       {"min_hours": 0,  "max_hours": 12},
    "tv_led_32":        {"min_hours": 0,  "max_hours": 8},
    "tv_led_55":        {"min_hours": 0,  "max_hours": 8},
    "laptop":           {"min_hours": 0,  "max_hours": 10},
    "desktop_pc":       {"min_hours": 0,  "max_hours": 8},
    "wifi_router":      {"min_hours": 8,  "max_hours": 24},  # Usually always on
    "water_pump":       {"min_hours": 0,  "max_hours": 3},
    "geyser_electric":  {"min_hours": 0,  "max_hours": 2},
    "iron":             {"min_hours": 0,  "max_hours": 2},
}


# -----------------------------------------------------------------------------
# SECTION 4: HELPER FUNCTIONS
# -----------------------------------------------------------------------------

def calculate_daily_units(appliance_name: str, hours_per_day: float) -> float:
    """
    Calculate daily electricity consumption for one appliance.
    Returns consumption in kWh (units).
    """
    watts = APPLIANCES[appliance_name]
    return (watts * hours_per_day) / 1000


def calculate_monthly_units(appliance_name: str, hours_per_day: float,
                             days: int = DAYS_IN_BILLING_CYCLE) -> float:
    """
    Calculate total monthly consumption for one appliance.
    """
    return calculate_daily_units(appliance_name, hours_per_day) * days


def get_remaining_budget(units_consumed_so_far: float) -> float:
    """
    Returns how many units are left before hitting the danger zone.
    """
    return PROTECTED_SLAB_LIMIT - units_consumed_so_far


def is_within_safe_limit(total_units: float) -> bool:
    """
    Returns True if total consumption is safely within the protected slab.
    """
    return total_units <= PROTECTED_SLAB_LIMIT


def get_warning_level(total_units: float) -> str:
    """
    Returns a warning level string based on current consumption.
    """
    if total_units <= DANGER_THRESHOLD:
        return "SAFE"
    elif total_units <= CRITICAL_THRESHOLD:
        return "WARNING"
    elif total_units <= PROTECTED_SLAB_LIMIT:
        return "CRITICAL"
    else:
        return "EXCEEDED"


# -----------------------------------------------------------------------------
# SECTION 5: QUICK SELF-TEST (runs only when this file is executed directly)
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 55)
    print("   BIJLI-DOST — nepra_rules.py Self-Test")
    print("=" * 55)

    # Test 1: Appliance unit calculation
    ac = "AC_1.5_ton"
    hours = 8
    daily = calculate_daily_units(ac, hours)
    monthly = calculate_monthly_units(ac, hours)
    print(f"\n[Test 1] {ac} running {hours}h/day:")
    print(f"  Daily consumption  : {daily:.3f} kWh")
    print(f"  Monthly consumption: {monthly:.3f} kWh")

    # Test 2: Budget check
    consumed = 120
    remaining = get_remaining_budget(consumed)
    print(f"\n[Test 2] Units consumed so far: {consumed}")
    print(f"  Remaining budget   : {remaining} units")
    print(f"  Warning level      : {get_warning_level(consumed)}")

    # Test 3: Warning levels
    print(f"\n[Test 3] Warning level thresholds:")
    for units in [150, 195, 198, 201]:
        print(f"  {units} units → {get_warning_level(units)}")

    print("\n[✓] nepra_rules.py loaded successfully. All constants ready.")
    print("=" * 55)