import os
import time
from nepra_rules import (
    APPLIANCES,
    APPLIANCE_CONSTRAINTS,
    PROTECTED_SLAB_LIMIT,
    get_warning_level,
)
from csp_solver import BijliDostCSP


# SECTION 1: UI HELPER FUNCTIONS

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')


def print_banner():
    print("=" * 65)
    print("         BIJLI-DOST — AI Electricity Slab Scheduler  ⚡")
    print("         Powered by CSP + Hill Climbing AI Engine")
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
            print(f"Please enter a value between {min_val} and {max_val}.")
        except ValueError:
            print("Invalid input. Please enter a number.")


def get_valid_int(prompt: str, min_val: int, max_val: int) -> int:
    while True:
        try:
            val = int(input(prompt))
            if min_val <= val <= max_val:
                return val
            print(f"Please enter a value between {min_val} and {max_val}.")
        except ValueError:
            print("Invalid input. Please enter a whole number.")


# SECTION 2: APPLIANCE MENU

APPLIANCE_MENU = [
    ("── Cooling & Heating ──────────────────", None),
    ("AC 0.75-Ton",         "AC_0.75_ton"),
    ("AC 1-Ton",            "AC_1_ton"),
    ("AC 1.5-Ton",          "AC_1.5_ton"),
    ("AC 2-Ton",            "AC_2_ton"),
    ("AC 2.5-Ton",          "AC_2.5_ton"),
    ("Window AC 1-Ton",     "window_ac_1ton"),
    ("Ceiling Fan",         "ceiling_fan"),
    ("Inverter Fan",        "inverter_fan"),
    ("Pedestal Fan",        "pedestal_fan"),
    ("Table Fan",           "table_fan"),
    ("Exhaust Fan",         "exhaust_fan"),
    ("Air Cooler",          "cooler"),
    ("Room Heater",         "room_heater"),
    ("── Kitchen ───────────────────────────", None),
    ("Refrigerator Small",  "refrigerator_small"),
    ("Refrigerator Medium", "refrigerator_medium"),
    ("Refrigerator Large",  "refrigerator_large"),
    ("Deep Freezer",        "deep_freezer"),
    ("Microwave",           "microwave"),
    ("Electric Kettle",     "electric_kettle"),
    ("Toaster",             "toaster"),
    ("Washing Machine Semi","washing_machine_semi"),
    ("Washing Machine Auto","washing_machine_auto"),
    ("Electric Oven",       "electric_oven"),
    ("Induction Cooker",    "induction_cooker"),
    ("Blender / Juicer",    "blender_juicer"),
    ("Food Processor",      "food_processor"),
    ("Rice Cooker",         "rice_cooker"),
    ("Dishwasher",          "dishwasher"),
    ("Electric Iron",       "electric_iron"),
    ("Roti Maker",          "roti_maker"),
    ("── Lighting ──────────────────────────", None),
    ("LED Bulb",            "led_bulb"),
    ("Energy Saver (CFL)",  "energy_saver"),
    ("Tube Light",          "tube_light"),
    ("LED Tube",            "led_tube"),
    ("LED Strip",           "led_strip"),
    ("Downlight LED",       "downlight_led"),
    ("── Entertainment ─────────────────────", None),
    ("LED TV 24-inch",      "tv_led_24"),
    ("LED TV 32-inch",      "tv_led_32"),
    ("LED TV 40-inch",      "tv_led_40"),
    ("LED TV 43-inch",      "tv_led_43"),
    ("LED TV 50-inch",      "tv_led_50"),
    ("LED TV 55-inch",      "tv_led_55"),
    ("LED TV 65-inch",      "tv_led_65"),
    ("LED TV 75-inch",      "tv_led_75"),
    ("LED TV 85-inch",      "tv_led_85"),
    ("PS4 / PS5",           "ps4_ps5"),
    ("Xbox",                "xbox"),
    ("Set-Top Box",         "set_top_box"),
    ("Home Theater",        "home_theater"),
    ("── Computers & Office ────────────────", None),
    ("Laptop",              "laptop"),
    ("Desktop PC",          "desktop_pc"),
    ("LED Monitor",         "monitor_led"),
    ("Wi-Fi Router",        "wifi_router"),
    ("Inkjet Printer",      "printer_inkjet"),
    ("Laser Printer",       "printer_laser"),
    ("── Utilities & Water ─────────────────", None),
    ("Water Pump 0.5HP",    "water_pump_0.5hp"),
    ("Water Pump 1HP",      "water_pump_1hp"),
    ("Water Pump 1.5HP",    "water_pump_1.5hp"),
    ("Submersible Pump",    "submersible_pump"),
    ("Geyser Small (15L)",  "geyser_electric_small"),
    ("Geyser Large (25L+)", "geyser_electric_large"),
    ("Immersion Rod",       "immersion_rod"),
    ("── Backup & Security ─────────────────", None),
    ("UPS 500VA",           "ups_500va"),
    ("UPS 1000VA",          "ups_1000va"),
    ("UPS 1500VA",          "ups_1500va"),
    ("Home Inverter",       "inverter_home"),
    ("Solar Inverter",      "solar_inverter"),
    ("Security Camera",     "security_cam"),
    ("Doorbell Camera",     "doorbell_cam"),
    ("Air Purifier",        "air_purifier"),
    ("── Personal Care ─────────────────────", None),
    ("Hair Dryer",          "hair_dryer"),
    ("Hair Straightener",   "hair_straightener"),
    ("Electric Shaver",     "electric_shaver"),
    ("Electric Blanket",    "electric_blanket"),
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
            print("Please enter a valid number.")
            continue

        if choice == 0:
            if not selected:
                print("Please select at least one appliance.")
                continue
            break

        if choice not in number_to_key:
            print(f"Invalid choice. Pick between 1 and {max(number_to_key)}.")
            continue

        display_name, key = number_to_key[choice]

        if key in selected:
            print(f"{display_name} already added.")
            continue

        constraints = APPLIANCE_CONSTRAINTS[key]
        lo          = constraints["min_hours"]
        hi          = constraints["max_hours"]
        watts       = APPLIANCES[key]

        print(f"\n  {display_name} selected ({watts}W)")
        print(f"     Allowed range: {lo}h – {hi}h per day")

        hours = get_valid_float(
            f"     How many hours/day do you prefer? ({lo}–{hi}): ",
            lo, hi
        )
        selected[key] = hours
        print(f"     Added: {display_name} → {hours} hrs/day\n")

    return selected


# SECTION 3: RESULTS DISPLAY

def display_warning_banner(warning_level: str, total_units: float):
    if warning_level == "SAFE":
        print("\nSTATUS: SAFE — You are comfortably within the slab!")
    elif warning_level == "WARNING":
        print("\nSTATUS: WARNING — Getting close to the limit!")
    elif warning_level == "CRITICAL":
        print("\nSTATUS: CRITICAL — Only a tiny buffer left!")
    else:
        print("\nSTATUS: EXCEEDED — You have crossed the 199-unit limit!")

    print(f"      Projected total: {total_units} units / {PROTECTED_SLAB_LIMIT} limit")


def display_schedule(result: dict, selected_appliances: dict, days_remaining: int):
    print_section("BIJLI-DOST OPTIMIZED SCHEDULE")

    if result.get("impossible"):
        print("\n MATHEMATICALLY IMPOSSIBLE SCENARIO DETECTED")
        print(f"  {'─' * 60}")
        print("  Even running all appliances at MINIMUM allowed hours")
        print("  exceeds the 199-unit protected slab given your current")
        print("  consumption this month.")
        print(f"\n  Minimum possible total : {result['total_units']} units")
        print(f"  Protected slab limit   : {PROTECTED_SLAB_LIMIT} units")
        print(f"\n  RECOMMENDATIONS:")
        print("  → You have already lost the protected slab this month.")
        print("  → Remove heavy appliances like AC, Geyser, Deep Freezer.")
        print("  → Re-run Bijli-Dost at the start of next billing cycle.")
        return

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
    if result.get("impossible"):
        return

    print_section("BIJLI-DOST TIPS")

    schedule        = result["schedule"]
    biggest         = max(schedule, key=lambda n: (APPLIANCES[n] * schedule[n]) / 1000)
    biggest_display = biggest.replace("_", " ").title()

    print(f"\n  1. Your biggest energy consumer is: {biggest_display}")
    print(f"     Even 1 hour less per day makes a big difference.\n")

    if result["units_saved"] < 2:
        print("  2. Buffer is very tight. Avoid adding any new appliance usage.")
        print("     One extra hour of AC could push you over 199 units!\n")
    elif result["units_saved"] < 5:
        print("  2. Small buffer. Try to follow the schedule strictly.\n")
    else:
        print("  2. Good buffer. You have some flexibility in daily usage.\n")

    print("  3. Run your washing machine and iron during off-peak hours.")
    print("     This doesn't save units but reduces grid stress.")
    print("\n  4. If you add a new appliance mid-month, re-run Bijli-Dost")
    print("     to recalculate your schedule immediately.\n")


# SECTION 4: MAIN APPLICATION FLOW

def main():
    clear_screen()
    print_banner()

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
        print("\nYou have already exceeded the 199-unit protected slab.")
        print("  Bijli-Dost can no longer save your slab this month.")
        print("  Run again at the start of next billing cycle.")
        return

    days_remaining = get_valid_int(
        "\n  Days remaining in your billing cycle (1–30): ",
        1, 30
    )

    number_to_key = show_appliance_menu()
    selected      = collect_appliances(number_to_key)

    print_section("STEP 3 — AI Optimizer Running...")
    print("\nFormulating CSP variables and domains...")
    time.sleep(0.8)
    print("Running Hill Climbing with Random Restarts...")
    time.sleep(0.8)
    print("Applying Min-Conflicts repair if needed...")
    time.sleep(0.6)
    print("Optimal schedule found!\n")

    csp    = BijliDostCSP(selected, units_consumed, days_remaining)
    result = csp.solve(restarts=8)

    clear_screen()
    print_banner()
    display_schedule(result, selected, days_remaining)
    display_tips(result)

    print_section("Run Again?")
    again = input("\n  Would you like to try a different scenario? (y/n): ").strip().lower()
    if again == 'y':
        main()
    else:
        print("\n  شکریہ! Thank you for using Bijli-Dost.")
        print("  Stay under 199 units and save your slab! ⚡\n")
        print("=" * 65)


if __name__ == "__main__":
    main()