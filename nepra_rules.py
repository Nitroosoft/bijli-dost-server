# =============================================================================
# nepra_rules.py
# Module 1: NEPRA Constants, Appliance Data, and Hard Constraints
# Project: Bijli-Dost — AI Slab Scheduler
# UPDATED: Accurate Pakistani market wattages + expanded appliance list
# Sources: chiefconsultantpak.com, japanelectronics.com.pk, savejoules.com,
#          aysonline.pk, expertpakistani.com, dawn.com energy guide
# =============================================================================

# -----------------------------------------------------------------------------
# SECTION 1: NEPRA SLAB CONSTANTS
# -----------------------------------------------------------------------------

PROTECTED_SLAB_LIMIT    = 199
DANGER_THRESHOLD        = 195
CRITICAL_THRESHOLD      = 198
DAYS_IN_BILLING_CYCLE   = 30


# -----------------------------------------------------------------------------
# SECTION 2: APPLIANCE WATTAGE DICTIONARY
# All values researched from Pakistani market sources (2024-2026)
# For inverter ACs: average running watts (not peak/startup watts)
# -----------------------------------------------------------------------------

APPLIANCES = {

    # ── AIR CONDITIONERS (Inverter — average running watts in Pakistani climate)
    # Source: aysonline.pk, chiefconsultantpak.com, expertpakistani.com
    # Inverter ACs vary 300W–1500W; we use realistic average running watts
    "AC_0.75_ton"   : 700,    # 0.75-ton inverter AC — small rooms
    "AC_1_ton"      : 1000,   # 1-ton inverter AC — avg running ~1000W
    "AC_1.5_ton"    : 1500,   # 1.5-ton inverter AC — most common in Pakistan
    "AC_2_ton"      : 2000,   # 2-ton inverter AC — large rooms
    "AC_2.5_ton"    : 2500,   # 2.5-ton inverter AC — hall/commercial
    "window_ac_1ton": 1200,   # Window AC 1-ton (non-inverter, older type)

    # ── FANS
    # Source: chiefconsultantpak.com (ceiling fan 80W), dawn.com
    "ceiling_fan"   : 80,     # Standard Pakistani ceiling fan (non-inverter)
    "inverter_fan"  : 30,     # Inverter ceiling fan (e.g. GFC, Pak, Super Asia)
    "pedestal_fan"  : 60,     # Pedestal/standing fan
    "table_fan"     : 35,     # Small table fan
    "exhaust_fan"   : 35,     # Bathroom/kitchen exhaust fan
    "cooler"        : 200,    # Air cooler / desert cooler

    # ── REFRIGERATORS
    # Source: savejoules.com, chiefconsultantpak.com (100–200W average)
    "refrigerator_small"  : 100,  # Small fridge (up to 10 CFT) — Dawlance, PEL
    "refrigerator_medium" : 150,  # Medium fridge (10–14 CFT) — most common
    "refrigerator_large"  : 200,  # Large/double door fridge (14+ CFT)
    "deep_freezer"        : 200,  # Chest freezer — Dawlance, PEL, Waves

    # ── KITCHEN APPLIANCES
    # Source: chiefconsultantpak.com, general appliance specs
    "microwave"          : 1200,  # Standard microwave oven
    "electric_kettle"    : 1500,  # Electric kettle (1.5–2L)
    "toaster"            : 900,   # Pop-up toaster (2-slice)
    "washing_machine_semi": 400,  # Semi-automatic washing machine (common in PK)
    "washing_machine_auto": 700,  # Fully automatic front/top load
    "electric_oven"      : 2000,  # Electric baking oven
    "induction_cooker"   : 1800,  # Induction cooktop
    "blender_juicer"     : 500,   # Juicer/blender (Anex, National, Westpoint)
    "food_processor"     : 600,   # Food processor
    "rice_cooker"        : 700,   # Electric rice cooker
    "dishwasher"         : 1200,  # Dishwasher (less common but exists)
    "electric_iron"      : 1000,  # Clothes iron (dry/steam)
    "roti_maker"         : 1000,  # Electric roti/chapati maker — very common PK

    # ── WATER HEATING
    # Source: chiefconsultantpak.com (2kW–4kW), dawn.com
    "geyser_electric_small" : 2000,  # Small electric geyser (15L)
    "geyser_electric_large" : 3000,  # Large electric geyser (25–35L)
    "immersion_rod"          : 1500,  # Immersion water heater rod — very common PK
    "room_heater"            : 2000,  # Electric room heater (fan/coil type)

    # ── WATER PUMPS
    # Source: chiefconsultantpak.com (0.75kW–2kW)
    "water_pump_0.5hp" : 375,   # 0.5 HP water pump
    "water_pump_1hp"   : 750,   # 1 HP water pump — most common in Pakistan
    "water_pump_1.5hp" : 1100,  # 1.5 HP water pump
    "submersible_pump" : 1500,  # Submersible borehole pump

    # ── LIGHTING
    # Source: standard LED specs, chiefconsultantpak.com
    "led_bulb"      : 10,   # LED bulb (single, 10W = 80W incandescent equivalent)
    "energy_saver"  : 20,   # CFL energy saver bulb
    "tube_light"    : 40,   # Fluorescent tube light (36W)
    "led_tube"      : 18,   # LED tube light replacement
    "led_strip"     : 20,   # LED strip lights (per metre avg)
    "downlight_led" : 7,    # LED downlight/spotlight

    # ── TELEVISIONS
    # Source: japanelectronics.com.pk, savejoules.com, mega.pk (actual spec sheets)
    "tv_led_24"  : 30,    # 24-inch LED TV — TCL, EcoStar, Haier
    "tv_led_32"  : 45,    # 32-inch LED TV — TCL ~45W, Haier ~50W
    "tv_led_40"  : 65,    # 40-inch LED TV — 60–100W avg
    "tv_led_43"  : 75,    # 43-inch LED TV — TCL spec 75W confirmed
    "tv_led_50"  : 95,    # 50-inch LED TV
    "tv_led_55"  : 120,   # 55-inch LED TV
    "tv_led_65"  : 150,   # 65-inch LED TV — Samsung, TCL, Haier
    "tv_led_75"  : 200,   # 75-inch LED TV
    "tv_led_85"  : 250,   # 85-inch LED TV

    # ── COMPUTERS & OFFICE
    "laptop"         : 65,    # Laptop (charging + use)
    "desktop_pc"     : 200,   # Desktop computer + monitor
    "monitor_led"    : 30,    # LED monitor (standalone)
    "wifi_router"    : 10,    # Wi-Fi router (always on)
    "printer_inkjet" : 30,    # Inkjet printer (standby/print avg)
    "printer_laser"  : 400,   # Laser printer
    "ups_500va"      : 60,    # UPS 500VA (charging loss + inverter)
    "ups_1000va"     : 100,   # UPS 1000VA
    "ups_1500va"     : 150,   # UPS 1500VA (common for 1.5-ton AC)

    # ── ENTERTAINMENT & GAMING
    "ps4_ps5"        : 200,   # PS4/PS5 gaming console
    "xbox"           : 180,   # Xbox gaming console
    "set_top_box"    : 15,    # DTH/Cable set-top box
    "home_theater"   : 100,   # Home theater / soundbar system

    # ── PERSONAL CARE & MISC
    "hair_dryer"     : 1800,  # Hair dryer (1200–2000W)
    "hair_straightener": 100, # Hair straightener/curler
    "electric_shaver": 15,    # Electric shaver
    "air_purifier"   : 50,    # Air purifier
    "security_cam"   : 15,    # CCTV / security camera (per camera)
    "doorbell_cam"   : 5,     # Smart doorbell camera
    "electric_blanket": 150,  # Electric blanket (winter)

    # ── SOLAR / BACKUP
    "inverter_home"  : 100,   # Home inverter (quiescent loss, not load)
    "solar_inverter" : 50,    # Solar inverter standby consumption
}


# -----------------------------------------------------------------------------
# SECTION 3: HARD CONSTRAINTS PER APPLIANCE
# All max_hours set to 24 — user decides their actual usage
# min_hours kept for essential appliances (fridge, freezer, router)
# -----------------------------------------------------------------------------

APPLIANCE_CONSTRAINTS = {
    "AC_0.75_ton"         : {"min_hours": 0,  "max_hours": 24},
    "AC_1_ton"            : {"min_hours": 0,  "max_hours": 24},
    "AC_1.5_ton"          : {"min_hours": 0,  "max_hours": 24},
    "AC_2_ton"            : {"min_hours": 0,  "max_hours": 24},
    "AC_2.5_ton"          : {"min_hours": 0,  "max_hours": 24},
    "window_ac_1ton"      : {"min_hours": 0,  "max_hours": 24},
    "ceiling_fan"         : {"min_hours": 0,  "max_hours": 24},
    "inverter_fan"        : {"min_hours": 0,  "max_hours": 24},
    "pedestal_fan"        : {"min_hours": 0,  "max_hours": 24},
    "table_fan"           : {"min_hours": 0,  "max_hours": 24},
    "exhaust_fan"         : {"min_hours": 0,  "max_hours": 24},
    "cooler"              : {"min_hours": 0,  "max_hours": 24},
    "refrigerator_small"  : {"min_hours": 12, "max_hours": 24},
    "refrigerator_medium" : {"min_hours": 12, "max_hours": 24},
    "refrigerator_large"  : {"min_hours": 12, "max_hours": 24},
    "deep_freezer"        : {"min_hours": 16, "max_hours": 24},
    "microwave"           : {"min_hours": 0,  "max_hours": 24},
    "electric_kettle"     : {"min_hours": 0,  "max_hours": 24},
    "toaster"             : {"min_hours": 0,  "max_hours": 24},
    "washing_machine_semi": {"min_hours": 0,  "max_hours": 24},
    "washing_machine_auto": {"min_hours": 0,  "max_hours": 24},
    "electric_oven"       : {"min_hours": 0,  "max_hours": 24},
    "induction_cooker"    : {"min_hours": 0,  "max_hours": 24},
    "blender_juicer"      : {"min_hours": 0,  "max_hours": 24},
    "food_processor"      : {"min_hours": 0,  "max_hours": 24},
    "rice_cooker"         : {"min_hours": 0,  "max_hours": 24},
    "dishwasher"          : {"min_hours": 0,  "max_hours": 24},
    "electric_iron"       : {"min_hours": 0,  "max_hours": 24},
    "roti_maker"          : {"min_hours": 0,  "max_hours": 24},
    "geyser_electric_small": {"min_hours": 0, "max_hours": 24},
    "geyser_electric_large": {"min_hours": 0, "max_hours": 24},
    "immersion_rod"       : {"min_hours": 0,  "max_hours": 24},
    "room_heater"         : {"min_hours": 0,  "max_hours": 24},
    "water_pump_0.5hp"    : {"min_hours": 0,  "max_hours": 24},
    "water_pump_1hp"      : {"min_hours": 0,  "max_hours": 24},
    "water_pump_1.5hp"    : {"min_hours": 0,  "max_hours": 24},
    "submersible_pump"    : {"min_hours": 0,  "max_hours": 24},
    "led_bulb"            : {"min_hours": 0,  "max_hours": 24},
    "energy_saver"        : {"min_hours": 0,  "max_hours": 24},
    "tube_light"          : {"min_hours": 0,  "max_hours": 24},
    "led_tube"            : {"min_hours": 0,  "max_hours": 24},
    "led_strip"           : {"min_hours": 0,  "max_hours": 24},
    "downlight_led"       : {"min_hours": 0,  "max_hours": 24},
    "tv_led_24"           : {"min_hours": 0,  "max_hours": 24},
    "tv_led_32"           : {"min_hours": 0,  "max_hours": 24},
    "tv_led_40"           : {"min_hours": 0,  "max_hours": 24},
    "tv_led_43"           : {"min_hours": 0,  "max_hours": 24},
    "tv_led_50"           : {"min_hours": 0,  "max_hours": 24},
    "tv_led_55"           : {"min_hours": 0,  "max_hours": 24},
    "tv_led_65"           : {"min_hours": 0,  "max_hours": 24},
    "tv_led_75"           : {"min_hours": 0,  "max_hours": 24},
    "tv_led_85"           : {"min_hours": 0,  "max_hours": 24},
    "laptop"              : {"min_hours": 0,  "max_hours": 24},
    "desktop_pc"          : {"min_hours": 0,  "max_hours": 24},
    "monitor_led"         : {"min_hours": 0,  "max_hours": 24},
    "wifi_router"         : {"min_hours": 8,  "max_hours": 24},
    "printer_inkjet"      : {"min_hours": 0,  "max_hours": 24},
    "printer_laser"       : {"min_hours": 0,  "max_hours": 24},
    "ups_500va"           : {"min_hours": 0,  "max_hours": 24},
    "ups_1000va"          : {"min_hours": 0,  "max_hours": 24},
    "ups_1500va"          : {"min_hours": 0,  "max_hours": 24},
    "ps4_ps5"             : {"min_hours": 0,  "max_hours": 24},
    "xbox"                : {"min_hours": 0,  "max_hours": 24},
    "set_top_box"         : {"min_hours": 0,  "max_hours": 24},
    "home_theater"        : {"min_hours": 0,  "max_hours": 24},
    "hair_dryer"          : {"min_hours": 0,  "max_hours": 24},
    "hair_straightener"   : {"min_hours": 0,  "max_hours": 24},
    "electric_shaver"     : {"min_hours": 0,  "max_hours": 24},
    "air_purifier"        : {"min_hours": 0,  "max_hours": 24},
    "security_cam"        : {"min_hours": 0,  "max_hours": 24},
    "doorbell_cam"        : {"min_hours": 0,  "max_hours": 24},
    "electric_blanket"    : {"min_hours": 0,  "max_hours": 24},
    "inverter_home"       : {"min_hours": 0,  "max_hours": 24},
    "solar_inverter"      : {"min_hours": 0,  "max_hours": 24},
}


# -----------------------------------------------------------------------------
# SECTION 4: HELPER FUNCTIONS
# -----------------------------------------------------------------------------

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


# -----------------------------------------------------------------------------
# SECTION 5: SELF-TEST
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 55)
    print("   BIJLI-DOST — nepra_rules.py Self-Test")
    print(f"   Total appliances: {len(APPLIANCES)}")
    print("=" * 55)

    ac = "AC_1.5_ton"
    daily = calculate_daily_units(ac, 8)
    monthly = calculate_monthly_units(ac, 8)
    print(f"\n[Test] {ac} at 8h/day:")
    print(f"  Daily:   {daily:.3f} kWh")
    print(f"  Monthly: {monthly:.3f} kWh")

    for units in [150, 195, 198, 201]:
        print(f"  {units} units → {get_warning_level(units)}")

    print("\n[✓] nepra_rules.py loaded successfully.")
    print("=" * 55)