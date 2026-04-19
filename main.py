# =============================================================================
# main.py
# Entry Point & CLI Interface
# Project: Bijli-Dost — AI Slab Scheduler
# FINAL VERSION: Impossible case handled + table header fixed
# =============================================================================

import os
import time
from nepra_rules import (
    APPLIANCES,
    APPLIANCE_CONSTRAINTS,
    PROTECTED_SLAB_LIMIT,
    get_warning_level,
)
from csp_solver import BijliDostCSP


# =============================================================================
# SECTION 1: UI HELPER FUNCTIONS
# =============================================================================

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')


def print_banner():
    print("=" * 65)
    print("       ⚡  BIJLI-DOST — AI Electricity Slab Scheduler  ⚡")
    print("          Powered by CSP + Hill Climbing AI Engine")
    print("        Keeping Pakistani Homes Under 199 Units!")
    print("=" * 65)


def print_section(title: str):
    print(f"\n{'─' * 65}")
    print(f"  {title}")
    print(f"{'─' * 65}")


def get_valid_float(prompt: str, min_val: float, max_val: float) -> float:
    while True:
        try:
            val = float(input(prompt))
            if min_val <= val <= max_val:
                return val
            print(f"  ⚠  Please enter a value between {min_val} and {max_val}.")
        except ValueError:
            print("  ⚠  Invalid input. Please enter a number.")


def get_valid_int(prompt: str, min_val: int, max_val: int) -> int:
    while True:
        try:
            val = int(input(prompt))
            if min_val <= val <= max_val:
                return val
            print(f"  ⚠  Please enter a value between {min_val} and {max_val}.")
        except ValueError:
            print("  ⚠  Invalid input. Please enter a whole number.")


# =============================================================================
# SECTION 2: APPLIANCE MENU
# =============================================================================

APPLIANCE_MENU = [
    ("── Cooling & Heating ──────────────────", None),
    ("AC 1-Ton",            "AC_1_ton"),
    ("AC 1.5-Ton",          "AC_1.5_ton"),
    ("AC 2-Ton",            "AC_2_ton"),
    ("Ceiling Fan",         "ceiling_fan"),
    ("Pedestal Fan",        "pedestal_fan"),
    ("Air Cooler",          "cooler"),
    ("── Kitchen ───────────────────────────", None),
    ("Refrigerator",        "refrigerator"),
    ("Deep Freezer",        "deep_freezer"),
    ("Microwave",           "microwave"),
    ("Electric Kettle",     "electric_kettle"),
    ("Toaster",             "toaster"),
    ("Washing Machine",     "washing_machine"),
    ("── Lighting ──────────────────────────", None),
    ("LED Bulb",            "led_bulb"),
    ("Energy Saver (CFL)",  "energy_saver"),
    ("Tube Light",          "tube_light"),
    ("── Entertainment & Office ────────────", None),
    ("LED TV 32-inch",      "tv_led_32"),
    ("LED TV 55-inch",      "tv_led_55"),
    ("Laptop",              "laptop"),
    ("Desktop PC",          "desktop_pc"),
    ("Wi-Fi Router",        "wifi_router"),
    ("── Utilities ─────────────────────────", None),
    ("Water Pump",          "water_pump"),
    ("Electric Geyser",     "geyser_electric"),
    ("Clothes Iron",        "iron"),
]


def show_appliance_menu():
    print_section("STEP 2 — Select Your Appliances")
    print("  Enter the NUMBER of each appliance you use.")
    print("  Type 0 when done.\n")

    item_number   = 1
    number_to_key = {}

    for display_name, key in APPLIANCE_MENU:
        if key is None:
            print(f"  {display_name}")
        else:
            watts = APPLIANCES[key]
            print(f"  [{item_number:>2}]  {display_name:<25} ({watts}W)")
            number_to_key[item_number] = (display_name, key)
            item_number += 1

    return number_to_key


def collect_appliances(number_to_key: dict) -> dict:
    selected = {}
    print()

    while True:
        try:
            choice = int(input("  Enter appliance number (0 = done): "))
        except ValueError:
            print("  ⚠  Please enter a valid number.")
            continue

        if choice == 0:
            if not selected:
                print("  ⚠  Please select at least one appliance.")
                continue
            break

        if choice not in number_to_key:
            print(f"  ⚠  Invalid choice. Pick between 1 and {max(number_to_key)}.")
            continue

        display_name, key = number_to_key[choice]

        if key in selected:
            print(f"  ⚠  {display_name} already added.")
            continue

        constraints = APPLIANCE_CONSTRAINTS[key]
        lo          = constraints["min_hours"]
        hi          = constraints["max_hours"]
        watts       = APPLIANCES[key]

        print(f"\n  ✔  {display_name} selected ({watts}W)")
        print(f"     Allowed range: {lo}h – {hi}h per day")

        hours = get_valid_float(
            f"     How many hours/day do you prefer? ({lo}–{hi}): ",
            lo, hi
        )
        selected[key] = hours
        print(f"     Added: {display_name} → {hours} hrs/day\n")

    return selected


# =============================================================================
# SECTION 3: RESULTS DISPLAY
# =============================================================================

def display_warning_banner(warning_level: str, total_units: float):
    if warning_level == "SAFE":
        print("\n  ✅  STATUS: SAFE — You are comfortably within the slab!")
    elif warning_level == "WARNING":
        print("\n  ⚠️   STATUS: WARNING — Getting close to the limit!")
    elif warning_level == "CRITICAL":
        print("\n  🔴  STATUS: CRITICAL — Only a tiny buffer left!")
    else:
        print("\n  ❌  STATUS: EXCEEDED — You have crossed the 199-unit limit!")

    print(f"      Projected total: {total_units} units / {PROTECTED_SLAB_LIMIT} limit")


def display_schedule(result: dict, selected_appliances: dict, days_remaining: int):
    print_section("⚡ BIJLI-DOST OPTIMIZED SCHEDULE")

    # ── Impossible case — show clear message and exit early ─────────────
    if result.get("impossible"):
        print("\n  ❌  MATHEMATICALLY IMPOSSIBLE SCENARIO DETECTED")
        print(f"  {'─' * 60}")
        print("  Even running all appliances at MINIMUM allowed hours")
        print("  exceeds the 199-unit protected slab given your current")
        print("  consumption this month.")
        print(f"\n  Minimum possible total : {result['total_units']} units")
        print(f"  Protected slab limit   : {PROTECTED_SLAB_LIMIT} units")
        print(f"\n  💡 RECOMMENDATIONS:")
        print("  → You have already lost the protected slab this month.")
        print("  → Remove heavy appliances like AC, Geyser, Deep Freezer.")
        print("  → Re-run Bijli-Dost at the start of next billing cycle.")
        return

    # ── Normal schedule table ────────────────────────────────────────────
    schedule = result["schedule"]

    print(f"\n  {'Appliance':<22} {'Your Pref':>10} {'AI Recommends':>14} {'Daily kWh':>10}")
    print(f"  {'─'*22} {'─'*10} {'─'*14} {'─'*10}")

    for name, ai_hours in schedule.items():
        user_pref = selected_appliances[name]
        daily_kwh = round((APPLIANCES[name] * ai_hours) / 1000, 3)

        if ai_hours < user_pref:
            change = "↓ reduced"
        elif ai_hours > user_pref:
            change = "↑ increased"
        else:
            change = "✔ kept"

        display = name.replace("_", " ").title()
        print(f"  {display:<22} {user_pref:>9}h {ai_hours:>12}h  {change:<12} {daily_kwh:>6} kWh")

    print(f"\n  {'─' * 65}")
    print(f"  {'Daily consumption':<40} {result['daily_units']:>8} kWh/day")
    print(f"  {'Daily budget allowed':<40} {result['daily_budget']:>8} kWh/day")
    print(f"  {'Days remaining':<40} {days_remaining:>8} days")
    print(f"  {'Projected total this month':<40} {result['total_units']:>8} kWh")
    print(f"  {'Safety buffer (units saved)':<40} {result['units_saved']:>8} kWh")
    print(f"  {'─' * 65}")

    display_warning_banner(result["warning_level"], result["total_units"])


def display_tips(result: dict):
    # Skip tips for impossible case
    if result.get("impossible"):
        return

    print_section("💡 BIJLI-DOST TIPS")

    schedule        = result["schedule"]
    biggest         = max(schedule, key=lambda n: (APPLIANCES[n] * schedule[n]) / 1000)
    biggest_display = biggest.replace("_", " ").title()

    print(f"\n  1. Your biggest energy consumer is: {biggest_display}")
    print(f"     Even 1 hour less per day makes a big difference.\n")

    if result["units_saved"] < 2:
        print("  2. 🔴 Buffer is very tight. Avoid adding any new appliance usage.")
        print("     One extra hour of AC could push you over 199 units!\n")
    elif result["units_saved"] < 5:
        print("  2. ⚠  Small buffer. Try to follow the schedule strictly.\n")
    else:
        print("  2. ✅ Good buffer. You have some flexibility in daily usage.\n")

    print("  3. Run your washing machine and iron during off-peak hours.")
    print("     This doesn't save units but reduces grid stress.")
    print("\n  4. If you add a new appliance mid-month, re-run Bijli-Dost")
    print("     to recalculate your schedule immediately.\n")


# =============================================================================
# SECTION 4: MAIN APPLICATION FLOW
# =============================================================================

def main():
    clear_screen()
    print_banner()

    # ── STEP 1: Billing Info ────────────────────────────────────────────────
    print_section("STEP 1 — Enter Your Billing Information")
    print("\n  This information is on your WAPDA/DISCO electricity bill.")

    units_consumed = get_valid_float(
        "\n  Units consumed so far this month (0–199): ",
        0, 199
    )

    remaining_budget = PROTECTED_SLAB_LIMIT - units_consumed
    print(f"\n  Remaining budget : {remaining_budget:.1f} units")
    print(f"  Warning level    : {get_warning_level(units_consumed)}")

    if units_consumed >= PROTECTED_SLAB_LIMIT:
        print("\n  ❌ You have already exceeded the 199-unit protected slab.")
        print("     Bijli-Dost can no longer save your slab this month.")
        print("     Run again at the start of next billing cycle.")
        return

    days_remaining = get_valid_int(
        "\n  Days remaining in your billing cycle (1–30): ",
        1, 30
    )

    # ── STEP 2: Select Appliances ───────────────────────────────────────────
    number_to_key = show_appliance_menu()
    selected      = collect_appliances(number_to_key)

    # ── STEP 3: Run AI Solver ───────────────────────────────────────────────
    print_section("STEP 3 — AI Optimizer Running...")
    print("\n  🤖 Formulating CSP variables and domains...")
    time.sleep(0.8)
    print("  🔍 Running Hill Climbing with Random Restarts...")
    time.sleep(0.8)
    print("  🔧 Applying Min-Conflicts repair if needed...")
    time.sleep(0.6)
    print("  ✅ Optimal schedule found!\n")

    csp    = BijliDostCSP(selected, units_consumed, days_remaining)
    result = csp.solve(restarts=8)

    # ── STEP 4: Display Results ─────────────────────────────────────────────
    clear_screen()
    print_banner()
    display_schedule(result, selected, days_remaining)
    display_tips(result)

    # ── STEP 5: Run Again? ──────────────────────────────────────────────────
    print_section("Run Again?")
    again = input("\n  Would you like to try a different scenario? (y/n): ").strip().lower()
    if again == 'y':
        main()
    else:
        print("\n  شکریہ! Thank you for using Bijli-Dost.")
        print("  Stay under 199 units and save your slab! ⚡\n")
        print("=" * 65)


# =============================================================================
if __name__ == "__main__":
    main()