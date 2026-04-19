# =============================================================================
# app.py
# Streamlit Web Interface for Bijli-Dost
# Project: Bijli-Dost — AI Electricity Slab Scheduler
# Run with: streamlit run app.py
# =============================================================================

import streamlit as st
import pandas as pd
import numpy as np
from nepra_rules import (
    APPLIANCES,
    APPLIANCE_CONSTRAINTS,
    PROTECTED_SLAB_LIMIT,
    DANGER_THRESHOLD,
    get_warning_level,
    calculate_daily_units,
)
from csp_solver import BijliDostCSP

# =============================================================================
# SECTION 1: PAGE CONFIG & CUSTOM STYLING
# =============================================================================

st.set_page_config(
    page_title="Bijli-Dost ⚡",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    /* ── Google Font ── */
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

    /* ── Global Reset ── */
    html, body, [class*="css"] {
        font-family: 'DM Sans', sans-serif;
        background-color: #0a0a0f;
        color: #e8e8f0;
    }

    /* ── Hide Streamlit Defaults ── */
    #MainMenu, footer, header { visibility: hidden; }
    .block-container { padding: 2rem 3rem; }

    /* ── Hero Banner ── */
    .hero {
        background: linear-gradient(135deg, #0d1b2a 0%, #1a1a2e 50%, #16213e 100%);
        border: 1px solid #00d4ff22;
        border-radius: 20px;
        padding: 3rem 2.5rem;
        margin-bottom: 2rem;
        position: relative;
        overflow: hidden;
    }
    .hero::before {
        content: '⚡';
        position: absolute;
        font-size: 180px;
        right: 2rem;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0.05;
    }
    .hero h1 {
        font-family: 'Syne', sans-serif;
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(90deg, #00d4ff, #ffffff, #ffd700);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
        line-height: 1.1;
    }
    .hero p {
        color: #8899aa;
        font-size: 1.1rem;
        margin-top: 0.8rem;
        font-weight: 300;
    }
    .hero .badge {
        display: inline-block;
        background: #00d4ff15;
        border: 1px solid #00d4ff44;
        color: #00d4ff;
        padding: 0.3rem 1rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 500;
        margin-bottom: 1rem;
        letter-spacing: 0.05em;
    }

    /* ── Metric Cards ── */
    .metric-card {
        background: #111827;
        border: 1px solid #1f2937;
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        transition: border-color 0.3s;
    }
    .metric-card:hover { border-color: #00d4ff44; }
    .metric-card .label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 500;
    }
    .metric-card .value {
        font-family: 'Syne', sans-serif;
        font-size: 2rem;
        font-weight: 700;
        color: #ffffff;
        margin: 0.3rem 0;
    }
    .metric-card .unit {
        font-size: 0.8rem;
        color: #4b5563;
    }

    /* ── Status Banners ── */
    .status-safe {
        background: #052e16;
        border: 1px solid #16a34a;
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        color: #4ade80;
        font-weight: 600;
        font-size: 1.1rem;
    }
    .status-warning {
        background: #1c1502;
        border: 1px solid #ca8a04;
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        color: #fbbf24;
        font-weight: 600;
        font-size: 1.1rem;
    }
    .status-critical {
        background: #1c0a02;
        border: 1px solid #ea580c;
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        color: #fb923c;
        font-weight: 600;
        font-size: 1.1rem;
    }
    .status-exceeded {
        background: #1c0202;
        border: 1px solid #dc2626;
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        color: #f87171;
        font-weight: 600;
        font-size: 1.1rem;
    }
    .status-impossible {
        background: #1a0a1a;
        border: 1px solid #9333ea;
        border-radius: 12px;
        padding: 1.5rem;
        color: #c084fc;
    }

    /* ── Section Headers ── */
    .section-title {
        font-family: 'Syne', sans-serif;
        font-size: 1.3rem;
        font-weight: 700;
        color: #ffffff;
        margin: 2rem 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #1f2937;
    }

    /* ── Appliance Tags ── */
    .appliance-tag {
        display: inline-block;
        background: #1f2937;
        border: 1px solid #374151;
        border-radius: 8px;
        padding: 0.4rem 0.8rem;
        font-size: 0.85rem;
        color: #d1d5db;
        margin: 0.3rem;
    }

    /* ── Progress Bar Custom ── */
    .progress-wrap {
        background: #1f2937;
        border-radius: 999px;
        height: 12px;
        overflow: hidden;
        margin: 0.5rem 0;
    }
    .progress-fill-safe     { height: 100%; background: linear-gradient(90deg, #16a34a, #4ade80); border-radius: 999px; }
    .progress-fill-warning  { height: 100%; background: linear-gradient(90deg, #ca8a04, #fbbf24); border-radius: 999px; }
    .progress-fill-critical { height: 100%; background: linear-gradient(90deg, #ea580c, #fb923c); border-radius: 999px; }
    .progress-fill-exceeded { height: 100%; background: linear-gradient(90deg, #dc2626, #f87171); border-radius: 999px; }

    /* ── Footer ── */
    .footer {
        text-align: center;
        padding: 2rem;
        color: #374151;
        font-size: 0.85rem;
        border-top: 1px solid #1f2937;
        margin-top: 3rem;
    }

    /* ── Sidebar ── */
    [data-testid="stSidebar"] {
        background: #0d1117;
        border-right: 1px solid #1f2937;
    }

    /* ── Buttons ── */
    .stButton > button {
        background: linear-gradient(135deg, #00d4ff, #0099cc);
        color: #000000;
        font-family: 'Syne', sans-serif;
        font-weight: 700;
        border: none;
        border-radius: 10px;
        padding: 0.7rem 2rem;
        font-size: 1rem;
        width: 100%;
        transition: opacity 0.2s;
    }
    .stButton > button:hover { opacity: 0.85; }

    /* ── Dataframe ── */
    .stDataFrame { border-radius: 12px; overflow: hidden; }
</style>
""", unsafe_allow_html=True)


# =============================================================================
# SECTION 2: APPLIANCE MENU DATA
# =============================================================================

APPLIANCE_DISPLAY = {
    "AC_1_ton"        : "AC 1-Ton",
    "AC_1.5_ton"      : "AC 1.5-Ton",
    "AC_2_ton"        : "AC 2-Ton",
    "ceiling_fan"     : "Ceiling Fan",
    "pedestal_fan"    : "Pedestal Fan",
    "cooler"          : "Air Cooler",
    "refrigerator"    : "Refrigerator",
    "deep_freezer"    : "Deep Freezer",
    "microwave"       : "Microwave",
    "electric_kettle" : "Electric Kettle",
    "toaster"         : "Toaster",
    "washing_machine" : "Washing Machine",
    "led_bulb"        : "LED Bulb",
    "energy_saver"    : "Energy Saver (CFL)",
    "tube_light"      : "Tube Light",
    "tv_led_32"       : "LED TV 32-inch",
    "tv_led_55"       : "LED TV 55-inch",
    "laptop"          : "Laptop",
    "desktop_pc"      : "Desktop PC",
    "wifi_router"     : "Wi-Fi Router",
    "water_pump"      : "Water Pump",
    "geyser_electric" : "Electric Geyser",
    "iron"            : "Clothes Iron",
}

APPLIANCE_GROUPS = {
    "❄️ Cooling & Heating" : ["AC_1_ton", "AC_1.5_ton", "AC_2_ton",
                               "ceiling_fan", "pedestal_fan", "cooler"],
    "🍳 Kitchen"           : ["refrigerator", "deep_freezer", "microwave",
                               "electric_kettle", "toaster", "washing_machine"],
    "💡 Lighting"          : ["led_bulb", "energy_saver", "tube_light"],
    "💻 Entertainment"     : ["tv_led_32", "tv_led_55", "laptop",
                               "desktop_pc", "wifi_router"],
    "🔧 Utilities"         : ["water_pump", "geyser_electric", "iron"],
}


# =============================================================================
# SECTION 3: HELPER FUNCTIONS
# =============================================================================

def get_progress_class(warning_level: str) -> str:
    mapping = {
        "SAFE"    : "progress-fill-safe",
        "WARNING" : "progress-fill-warning",
        "CRITICAL": "progress-fill-critical",
        "EXCEEDED": "progress-fill-exceeded",
    }
    return mapping.get(warning_level, "progress-fill-exceeded")


def get_status_class(warning_level: str) -> str:
    mapping = {
        "SAFE"    : "status-safe",
        "WARNING" : "status-warning",
        "CRITICAL": "status-critical",
        "EXCEEDED": "status-exceeded",
    }
    return mapping.get(warning_level, "status-exceeded")


def get_status_emoji(warning_level: str) -> str:
    mapping = {
        "SAFE"    : "✅",
        "WARNING" : "⚠️",
        "CRITICAL": "🔴",
        "EXCEEDED": "❌",
    }
    return mapping.get(warning_level, "❌")


# =============================================================================
# SECTION 4: HERO SECTION
# =============================================================================

st.markdown("""
<div class="hero">
    <div class="badge">⚡ AI-POWERED · CSP + HILL CLIMBING</div>
    <h1>Bijli-Dost</h1>
    <p>Your intelligent electricity slab guardian — keeping Pakistani homes safely under 199 units.</p>
</div>
""", unsafe_allow_html=True)


# =============================================================================
# SECTION 5: SIDEBAR — BILLING INFO
# =============================================================================

with st.sidebar:
    st.markdown("### ⚡ Bijli-Dost")
    st.markdown("---")
    st.markdown("**📋 Your Billing Info**")
    st.caption("Find these on your WAPDA/DISCO bill")

    units_consumed = st.number_input(
        "Units consumed so far",
        min_value=0.0,
        max_value=198.0,
        value=0.0,
        step=1.0,
        help="How many kWh units have you used this month?"
    )

    days_remaining = st.slider(
        "Days remaining in billing cycle",
        min_value=1,
        max_value=30,
        value=15,
        help="How many days are left before your bill is generated?"
    )

    remaining_budget = PROTECTED_SLAB_LIMIT - units_consumed
    warning_now      = get_warning_level(units_consumed)
    pct              = min((units_consumed / PROTECTED_SLAB_LIMIT) * 100, 100)
    prog_class       = get_progress_class(warning_now)

    st.markdown("---")
    st.markdown("**📊 Current Status**")
    st.markdown(f"""
    <div class="progress-wrap">
        <div class="{prog_class}" style="width:{pct:.1f}%"></div>
    </div>
    <p style="color:#6b7280; font-size:0.8rem; margin:0.3rem 0">
        {units_consumed:.0f} / {PROTECTED_SLAB_LIMIT} units used ({pct:.1f}%)
    </p>
    """, unsafe_allow_html=True)

    st.markdown(f"**Remaining budget:** `{remaining_budget:.1f} units`")
    st.markdown(f"**Status:** {get_status_emoji(warning_now)} `{warning_now}`")

    st.markdown("---")
    st.caption("Bijli-Dost · Knight Riders · FAST-NUCES · 4th Semester")


# =============================================================================
# SECTION 6: MAIN CONTENT — APPLIANCE SELECTION
# =============================================================================

if units_consumed >= PROTECTED_SLAB_LIMIT:
    st.markdown("""
    <div class="status-exceeded">
        ❌ You have already exceeded the 199-unit protected slab this month.<br>
        <small style="font-weight:400">Re-run Bijli-Dost at the start of your next billing cycle.</small>
    </div>
    """, unsafe_allow_html=True)
    st.stop()

st.markdown('<div class="section-title">🏠 Select Your Appliances</div>',
            unsafe_allow_html=True)
st.caption("Choose your appliances and set your preferred daily usage hours.")

selected_appliances = {}

for group_name, appliance_keys in APPLIANCE_GROUPS.items():
    with st.expander(group_name, expanded=(group_name == "❄️ Cooling & Heating")):
        cols = st.columns(2)
        for i, key in enumerate(appliance_keys):
            display = APPLIANCE_DISPLAY[key]
            watts   = APPLIANCES[key]
            con     = APPLIANCE_CONSTRAINTS[key]
            lo, hi  = con["min_hours"], con["max_hours"]

            with cols[i % 2]:
                use = st.checkbox(f"{display} ({watts}W)", key=f"chk_{key}")
                if use:
                    hours = st.slider(
                        f"Hours/day",
                        min_value=float(lo),
                        max_value=float(hi),
                        value=float(min(4, hi)) if lo == 0 else float(lo),
                        step=0.5,
                        key=f"hrs_{key}",
                        help=f"Allowed: {lo}h – {hi}h"
                    )
                    selected_appliances[key] = hours


# =============================================================================
# SECTION 7: LIVE PREVIEW
# =============================================================================

if selected_appliances:
    st.markdown('<div class="section-title">👀 Live Preview</div>',
                unsafe_allow_html=True)

    preview_data = []
    for key, hours in selected_appliances.items():
        daily_kwh   = calculate_daily_units(key, hours)
        monthly_kwh = daily_kwh * days_remaining
        preview_data.append({
            "Appliance"     : APPLIANCE_DISPLAY[key],
            "Wattage (W)"   : APPLIANCES[key],
            "Hrs/Day"       : hours,
            "Daily kWh"     : round(daily_kwh, 3),
            "Projected kWh" : round(monthly_kwh, 2),
        })

    df_preview = pd.DataFrame(preview_data)

    # Use numpy for total calculation
    daily_total    = np.sum([r["Daily kWh"]   for r in preview_data])
    monthly_total  = np.sum([r["Projected kWh"] for r in preview_data])
    grand_total    = units_consumed + monthly_total

    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="label">Daily Consumption</div>
            <div class="value">{daily_total:.2f}</div>
            <div class="unit">kWh / day</div>
        </div>""", unsafe_allow_html=True)
    with c2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="label">Projected Total</div>
            <div class="value">{grand_total:.1f}</div>
            <div class="unit">units this month</div>
        </div>""", unsafe_allow_html=True)
    with c3:
        color  = "#4ade80" if grand_total <= PROTECTED_SLAB_LIMIT else "#f87171"
        status = "Safe ✅" if grand_total <= PROTECTED_SLAB_LIMIT else "Over Limit ❌"
        st.markdown(f"""
        <div class="metric-card">
            <div class="label">Slab Status</div>
            <div class="value" style="color:{color}; font-size:1.4rem">{status}</div>
            <div class="unit">{PROTECTED_SLAB_LIMIT} unit limit</div>
        </div>""", unsafe_allow_html=True)

    st.dataframe(df_preview, use_container_width=True, hide_index=True)


# =============================================================================
# SECTION 8: RUN AI OPTIMIZER
# =============================================================================

st.markdown("---")

if not selected_appliances:
    st.info("👆 Please select at least one appliance above to continue.")
else:
    if st.button("⚡ Run Bijli-Dost AI Optimizer"):

        with st.spinner("🤖 Formulating CSP... Running Hill Climbing... Applying Min-Conflicts..."):
            csp    = BijliDostCSP(selected_appliances, units_consumed, days_remaining)
            result = csp.solve(restarts=8)

        st.markdown('<div class="section-title">🎯 AI Optimized Schedule</div>',
                    unsafe_allow_html=True)

        # ── Impossible case ─────────────────────────────────────────────
        if result.get("impossible"):
            st.markdown("""
            <div class="status-impossible">
                <strong>❌ Mathematically Impossible Scenario</strong><br><br>
                Even running all your selected appliances at their
                <strong>minimum allowed hours</strong> exceeds the
                199-unit protected slab given your current consumption.<br><br>
                <strong>💡 Recommendations:</strong><br>
                → You have already lost the protected slab this month.<br>
                → Remove heavy appliances like AC, Geyser, or Deep Freezer.<br>
                → Re-run Bijli-Dost at the start of your next billing cycle.
            </div>
            """, unsafe_allow_html=True)
            st.stop()

        # ── Metric cards ────────────────────────────────────────────────
        m1, m2, m3, m4 = st.columns(4)
        with m1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="label">Total Units</div>
                <div class="value">{result['total_units']}</div>
                <div class="unit">kWh projected</div>
            </div>""", unsafe_allow_html=True)
        with m2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="label">Daily Usage</div>
                <div class="value">{result['daily_units']}</div>
                <div class="unit">kWh / day</div>
            </div>""", unsafe_allow_html=True)
        with m3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="label">Safety Buffer</div>
                <div class="value">{result['units_saved']}</div>
                <div class="unit">units remaining</div>
            </div>""", unsafe_allow_html=True)
        with m4:
            st.markdown(f"""
            <div class="metric-card">
                <div class="label">Daily Budget</div>
                <div class="value">{result['daily_budget']}</div>
                <div class="unit">kWh allowed/day</div>
            </div>""", unsafe_allow_html=True)

        # ── Status banner ───────────────────────────────────────────────
        wl      = result["warning_level"]
        emoji   = get_status_emoji(wl)
        cls     = get_status_class(wl)
        pct_now = min((result["total_units"] / PROTECTED_SLAB_LIMIT) * 100, 100)
        p_cls   = get_progress_class(wl)

        st.markdown(f"""
        <div class="{cls}">
            {emoji} STATUS: {wl} —
            Projected total: {result['total_units']} units / {PROTECTED_SLAB_LIMIT} limit
        </div>
        <div class="progress-wrap" style="margin-top:1rem">
            <div class="{p_cls}" style="width:{pct_now:.1f}%"></div>
        </div>
        """, unsafe_allow_html=True)

        # ── Schedule table using pandas ─────────────────────────────────
        st.markdown('<div class="section-title">📋 Schedule Breakdown</div>',
                    unsafe_allow_html=True)

        schedule_data = []
        for key, ai_hours in result["schedule"].items():
            user_pref = selected_appliances[key]
            daily_kwh = round(calculate_daily_units(key, ai_hours), 3)

            if ai_hours < user_pref:
                change = f"↓ Reduced by {user_pref - ai_hours:.1f}h"
            elif ai_hours > user_pref:
                change = f"↑ Increased by {ai_hours - user_pref:.1f}h"
            else:
                change = "✔ Kept as preferred"

            schedule_data.append({
                "Appliance"      : APPLIANCE_DISPLAY[key],
                "Your Preference": f"{user_pref}h",
                "AI Recommends"  : f"{ai_hours}h",
                "Change"         : change,
                "Daily kWh"      : daily_kwh,
            })

        df_schedule = pd.DataFrame(schedule_data)
        st.dataframe(df_schedule, use_container_width=True, hide_index=True)

        # ── Bar chart using matplotlib via streamlit ─────────────────────
        st.markdown('<div class="section-title">📊 Energy Consumption Chart</div>',
                    unsafe_allow_html=True)

        chart_data = pd.DataFrame({
            "Appliance"      : [APPLIANCE_DISPLAY[k] for k in result["schedule"]],
            "Your Preference": [
                round(calculate_daily_units(k, selected_appliances[k]), 3)
                for k in result["schedule"]
            ],
            "AI Optimized"   : [
                round(calculate_daily_units(k, v), 3)
                for k, v in result["schedule"].items()
            ],
        }).set_index("Appliance")

        st.bar_chart(chart_data, use_container_width=True)

        # ── Tips ─────────────────────────────────────────────────────────
        st.markdown('<div class="section-title">💡 Bijli-Dost Tips</div>',
                    unsafe_allow_html=True)

        biggest = max(
            result["schedule"],
            key=lambda n: calculate_daily_units(n, result["schedule"][n])
        )

        tip1, tip2 = st.columns(2)
        with tip1:
            st.info(f"🔋 **Biggest consumer:** {APPLIANCE_DISPLAY[biggest]}\n\n"
                    f"Even 1 hour less per day makes a big difference.")
        with tip2:
            if result["units_saved"] < 2:
                st.error("🔴 **Tight buffer!** Avoid any extra appliance usage.\n\n"
                         "One extra AC hour could push you over 199 units!")
            elif result["units_saved"] < 5:
                st.warning("⚠️ **Small buffer.** Follow the schedule strictly.")
            else:
                st.success("✅ **Good buffer.** You have some flexibility in daily usage.")

        st.info("🕐 Run your washing machine and iron during off-peak hours to reduce grid stress.")
        st.info("🔄 If you add a new appliance mid-month, re-run Bijli-Dost to recalculate immediately.")


# =============================================================================
# SECTION 9: FOOTER
# =============================================================================

st.markdown("""
<div class="footer">
    ⚡ Bijli-Dost — AI Electricity Slab Scheduler &nbsp;|&nbsp;
    Knight Riders &nbsp;|&nbsp; FAST-NUCES &nbsp;|&nbsp; 4th Semester &nbsp;|&nbsp;
    Powered by CSP + Hill Climbing AI
</div>
""", unsafe_allow_html=True)
