PROTECTED_SLAB_LIMIT    = 199
DANGER_THRESHOLD        = 195
CRITICAL_THRESHOLD      = 198
DAYS_IN_BILLING_CYCLE   = 30

APPLIANCES = {
    "AC_0.75_ton"           : 700,
    "AC_1_ton"              : 1000,
    "AC_1.5_ton"            : 1500,
    "AC_2_ton"              : 2000,
    "AC_2.5_ton"            : 2500,
    "window_ac_1ton"        : 1200,
    "ceiling_fan"           : 80,
    "inverter_fan"          : 30,
    "pedestal_fan"          : 60,
    "table_fan"             : 35,
    "exhaust_fan"           : 35,
    "cooler"                : 200,
    "refrigerator_small"    : 100,
    "refrigerator_medium"   : 150,
    "refrigerator_large"    : 200,
    "deep_freezer"          : 200,
    "microwave"             : 1200,
    "electric_kettle"       : 1500,
    "toaster"               : 900,
    "washing_machine_semi"  : 400,
    "washing_machine_auto"  : 700,
    "electric_oven"         : 2000,
    "induction_cooker"      : 1800,
    "blender_juicer"        : 500,
    "food_processor"        : 600,
    "rice_cooker"           : 700,
    "dishwasher"            : 1200,
    "electric_iron"         : 1000,
    "roti_maker"            : 1000,
    "geyser_electric_small" : 2000,
    "geyser_electric_large" : 3000,
    "immersion_rod"         : 1500,
    "room_heater"           : 2000,
    "water_pump_0.5hp"      : 375,
    "water_pump_1hp"        : 750,
    "water_pump_1.5hp"      : 1100,
    "submersible_pump"      : 1500,
    "led_bulb"              : 10,
    "energy_saver"          : 20,
    "tube_light"            : 40,
    "led_tube"              : 18,
    "led_strip"             : 20,
    "downlight_led"         : 7,
    "tv_led_24"             : 30,
    "tv_led_32"             : 45,
    "tv_led_40"             : 65,
    "tv_led_43"             : 75,
    "tv_led_50"             : 95,
    "tv_led_55"             : 120,
    "tv_led_65"             : 150,
    "tv_led_75"             : 200,
    "tv_led_85"             : 250,
    "laptop"                : 65,
    "desktop_pc"            : 200,
    "monitor_led"           : 30,
    "wifi_router"           : 10,
    "printer_inkjet"        : 30,
    "printer_laser"         : 400,
    "ups_500va"             : 60,
    "ups_1000va"            : 100,
    "ups_1500va"            : 150,
    "ps4_ps5"               : 200,
    "xbox"                  : 180,
    "set_top_box"           : 15,
    "home_theater"          : 100,
    "hair_dryer"            : 1800,
    "hair_straightener"     : 100,
    "electric_shaver"       : 15,
    "air_purifier"          : 50,
    "security_cam"          : 15,
    "doorbell_cam"          : 5,
    "electric_blanket"      : 150,
    "inverter_home"         : 100,
    "solar_inverter"        : 50,
}

APPLIANCE_CONSTRAINTS = {
    "AC_0.75_ton"           : {"min_hours": 0,  "max_hours": 24},
    "AC_1_ton"              : {"min_hours": 0,  "max_hours": 24},
    "AC_1.5_ton"            : {"min_hours": 0,  "max_hours": 24},
    "AC_2_ton"              : {"min_hours": 0,  "max_hours": 24},
    "AC_2.5_ton"            : {"min_hours": 0,  "max_hours": 24},
    "window_ac_1ton"        : {"min_hours": 0,  "max_hours": 24},
    "ceiling_fan"           : {"min_hours": 0,  "max_hours": 24},
    "inverter_fan"          : {"min_hours": 0,  "max_hours": 24},
    "pedestal_fan"          : {"min_hours": 0,  "max_hours": 24},
    "table_fan"             : {"min_hours": 0,  "max_hours": 24},
    "exhaust_fan"           : {"min_hours": 0,  "max_hours": 24},
    "cooler"                : {"min_hours": 0,  "max_hours": 24},
    "refrigerator_small"    : {"min_hours": 12, "max_hours": 24},
    "refrigerator_medium"   : {"min_hours": 12, "max_hours": 24},
    "refrigerator_large"    : {"min_hours": 12, "max_hours": 24},
    "deep_freezer"          : {"min_hours": 16, "max_hours": 24},
    "microwave"             : {"min_hours": 0,  "max_hours": 24},
    "electric_kettle"       : {"min_hours": 0,  "max_hours": 24},
    "toaster"               : {"min_hours": 0,  "max_hours": 24},
    "washing_machine_semi"  : {"min_hours": 0,  "max_hours": 24},
    "washing_machine_auto"  : {"min_hours": 0,  "max_hours": 24},
    "electric_oven"         : {"min_hours": 0,  "max_hours": 24},
    "induction_cooker"      : {"min_hours": 0,  "max_hours": 24},
    "blender_juicer"        : {"min_hours": 0,  "max_hours": 24},
    "food_processor"        : {"min_hours": 0,  "max_hours": 24},
    "rice_cooker"           : {"min_hours": 0,  "max_hours": 24},
    "dishwasher"            : {"min_hours": 0,  "max_hours": 24},
    "electric_iron"         : {"min_hours": 0,  "max_hours": 24},
    "roti_maker"            : {"min_hours": 0,  "max_hours": 24},
    "geyser_electric_small" : {"min_hours": 0,  "max_hours": 24},
    "geyser_electric_large" : {"min_hours": 0,  "max_hours": 24},
    "immersion_rod"         : {"min_hours": 0,  "max_hours": 24},
    "room_heater"           : {"min_hours": 0,  "max_hours": 24},
    "water_pump_0.5hp"      : {"min_hours": 0,  "max_hours": 24},
    "water_pump_1hp"        : {"min_hours": 0,  "max_hours": 24},
    "water_pump_1.5hp"      : {"min_hours": 0,  "max_hours": 24},
    "submersible_pump"      : {"min_hours": 0,  "max_hours": 24},
    "led_bulb"              : {"min_hours": 0,  "max_hours": 24},
    "energy_saver"          : {"min_hours": 0,  "max_hours": 24},
    "tube_light"            : {"min_hours": 0,  "max_hours": 24},
    "led_tube"              : {"min_hours": 0,  "max_hours": 24},
    "led_strip"             : {"min_hours": 0,  "max_hours": 24},
    "downlight_led"         : {"min_hours": 0,  "max_hours": 24},
    "tv_led_24"             : {"min_hours": 0,  "max_hours": 24},
    "tv_led_32"             : {"min_hours": 0,  "max_hours": 24},
    "tv_led_40"             : {"min_hours": 0,  "max_hours": 24},
    "tv_led_43"             : {"min_hours": 0,  "max_hours": 24},
    "tv_led_50"             : {"min_hours": 0,  "max_hours": 24},
    "tv_led_55"             : {"min_hours": 0,  "max_hours": 24},
    "tv_led_65"             : {"min_hours": 0,  "max_hours": 24},
    "tv_led_75"             : {"min_hours": 0,  "max_hours": 24},
    "tv_led_85"             : {"min_hours": 0,  "max_hours": 24},
    "laptop"                : {"min_hours": 0,  "max_hours": 24},
    "desktop_pc"            : {"min_hours": 0,  "max_hours": 24},
    "monitor_led"           : {"min_hours": 0,  "max_hours": 24},
    "wifi_router"           : {"min_hours": 8,  "max_hours": 24},
    "printer_inkjet"        : {"min_hours": 0,  "max_hours": 24},
    "printer_laser"         : {"min_hours": 0,  "max_hours": 24},
    "ups_500va"             : {"min_hours": 0,  "max_hours": 24},
    "ups_1000va"            : {"min_hours": 0,  "max_hours": 24},
    "ups_1500va"            : {"min_hours": 0,  "max_hours": 24},
    "ps4_ps5"               : {"min_hours": 0,  "max_hours": 24},
    "xbox"                  : {"min_hours": 0,  "max_hours": 24},
    "set_top_box"           : {"min_hours": 0,  "max_hours": 24},
    "home_theater"          : {"min_hours": 0,  "max_hours": 24},
    "hair_dryer"            : {"min_hours": 0,  "max_hours": 24},
    "hair_straightener"     : {"min_hours": 0,  "max_hours": 24},
    "electric_shaver"       : {"min_hours": 0,  "max_hours": 24},
    "air_purifier"          : {"min_hours": 0,  "max_hours": 24},
    "security_cam"          : {"min_hours": 0,  "max_hours": 24},
    "doorbell_cam"          : {"min_hours": 0,  "max_hours": 24},
    "electric_blanket"      : {"min_hours": 0,  "max_hours": 24},
    "inverter_home"         : {"min_hours": 0,  "max_hours": 24},
    "solar_inverter"        : {"min_hours": 0,  "max_hours": 24},
}


# SECTION 4: HELPER FUNCTIONS

def calculate_daily_units(appliance_name: str, hours_per_day: float) -> float:
    watts = APPLIANCES.get(appliance_name, 0)
    return (watts * hours_per_day) / 1000


def calculate_monthly_units(appliance_name: str, hours_per_day: float,
                             days: int = DAYS_IN_BILLING_CYCLE) -> float:
    return calculate_daily_units(appliance_name, hours_per_day) * days


def get_remaining_budget(units_consumed_so_far: float) -> float:
    return PROTECTED_SLAB_LIMIT - units_consumed_so_far


def is_within_safe_limit(total_units: float) -> bool:
    return total_units <= PROTECTED_SLAB_LIMIT


def get_warning_level(total_units: float) -> str:
    if total_units <= DANGER_THRESHOLD:
        return "SAFE"
    elif total_units <= CRITICAL_THRESHOLD:
        return "WARNING"
    elif total_units <= PROTECTED_SLAB_LIMIT:
        return "CRITICAL"
    else:
        return "EXCEEDED"


# SECTION 5: SELF-TEST

if __name__ == "__main__":
    print("BIJLI-DOST — nepra_rules.py Self-Test")
    print(f"Total appliances: {len(APPLIANCES)}")

    ac = "AC_1.5_ton"
    daily = calculate_daily_units(ac, 8)
    monthly = calculate_monthly_units(ac, 8)
    print(f"{ac} at 8h/day: Daily={daily:.3f} kWh, Monthly={monthly:.3f} kWh")

    for units in [150, 195, 198, 201]:
        print(f"  {units} units -> {get_warning_level(units)}")

    print("nepra_rules.py loaded successfully.")