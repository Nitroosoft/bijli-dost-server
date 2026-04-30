import time
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from nepra_rules import (
    APPLIANCES, APPLIANCE_CONSTRAINTS,
    PROTECTED_SLAB_LIMIT, get_warning_level, calculate_daily_units,
)
from csp_solver import BijliDostCSP
from google import genai
from google.genai import types
import base64, re, io
import PIL.Image

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
client = genai.Client(api_key=GEMINI_API_KEY)


# SECTION 1: HEALTH CHECK

@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "status"  : "running",
        "project" : "Bijli-Dost AI Slab Scheduler",
        "team"    : "NITROSOFT — FAST-NUCES"
    })


# SECTION 2: GET ALL APPLIANCES

@app.route("/appliances", methods=["GET"])
def get_appliances():
    data = []
    for key, watts in APPLIANCES.items():
        con = APPLIANCE_CONSTRAINTS[key]
        data.append({
            "key"      : key,
            "name"     : key.replace("_", " ").title(),
            "watts"    : watts,
            "min_hours": con["min_hours"],
            "max_hours": con["max_hours"],
        })
    return jsonify({"appliances": data})


# SECTION 3: RUN AI OPTIMIZER

@app.route("/optimize", methods=["POST"])
def optimize():
    body             = request.get_json()
    units_consumed   = float(body.get("units_consumed", 0))
    days_remaining   = int(body.get("days_remaining", 15))
    appliances_input = body.get("appliances", {})

    if units_consumed >= PROTECTED_SLAB_LIMIT:
        return jsonify({"error": "You have already exceeded the 199-unit protected slab."}), 400
    if not appliances_input:
        return jsonify({"error": "Please select at least one appliance."}), 400

    csp    = BijliDostCSP(appliances_input, units_consumed, days_remaining)
    result = csp.solve(restarts=8)

    quantities = body.get("quantities", {})

    schedule_detail = []
    for key, ai_hours in result["schedule"].items():
        user_pref = appliances_input[key]
        daily_kwh = round(calculate_daily_units(key, ai_hours), 3)
        qty       = int(quantities.get(key, 1))

        if ai_hours < user_pref:
            change = f"Reduced by {user_pref - ai_hours:.1f}h"
        elif ai_hours > user_pref:
            change = f"Increased by {ai_hours - user_pref:.1f}h"
        else:
            change = "Kept as preferred"

        unit_schedule = []
        if qty > 1:
            hours_per_unit = user_pref / qty
            units_on  = min(qty, int(ai_hours // hours_per_unit)) if hours_per_unit > 0 else 0
            remainder = round(ai_hours - (units_on * hours_per_unit), 1)

            for i in range(qty):
                if i < units_on:
                    unit_schedule.append({"unit": i + 1, "hours": hours_per_unit, "on": True})
                elif i == units_on and remainder > 0:
                    unit_schedule.append({"unit": i + 1, "hours": remainder, "on": True})
                else:
                    unit_schedule.append({"unit": i + 1, "hours": 0, "on": False})
        else:
            unit_schedule.append({"unit": 1, "hours": ai_hours, "on": ai_hours > 0})

        schedule_detail.append({
            "key"          : key,
            "name"         : key.replace("_", " ").title(),
            "user_pref"    : user_pref,
            "ai_hours"     : ai_hours,
            "change"       : change,
            "daily_kwh"    : daily_kwh,
            "qty"          : qty,
            "unit_schedule": unit_schedule,
        })

    return jsonify({
        "schedule"     : schedule_detail,
        "total_units"  : result["total_units"],
        "daily_units"  : result["daily_units"],
        "daily_budget" : result["daily_budget"],
        "units_saved"  : result["units_saved"],
        "warning_level": result["warning_level"],
        "is_safe"      : result["is_safe"],
        "impossible"   : result.get("impossible", False),
    })


# SECTION 4: BILL SCANNER V1

@app.route("/scan-bill", methods=["POST"])
def scan_bill():
    try:
        body      = request.get_json()
        image_b64 = body.get("image")

        if not image_b64:
            return jsonify({"error": "No image provided"}), 400

        image_data = base64.b64decode(image_b64)
        image_pil  = PIL.Image.open(io.BytesIO(image_data))

        disco_name = body.get("disco_name", "")
        disco_full = body.get("disco_full", "")

        prompt = f"""
You are analyzing a Pakistani electricity bill image.

IMPORTANT VALIDATION: This bill should be from {disco_full} ({disco_name}).
First check if this bill belongs to {disco_name} or {disco_full}.
Look for the company name or logo at the top of the bill.

If the bill does NOT belong to {disco_name}, respond with EXACTLY this one line:
WRONG_COMPANY: [write the actual company name found on the bill here]

If the bill DOES belong to {disco_name}, extract the meter readings and respond with EXACTLY:
PREVIOUS: [number]
CURRENT: [number]
UNITS: [number]

If you cannot read clearly, respond with exactly:
ERROR: Could not read bill

Nothing else. No extra text.
"""

        response   = None
        last_error = None
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model    = 'gemini-2.5-flash',
                    contents = [prompt, image_pil]
                )
                break
            except Exception as retry_err:
                last_error = retry_err
                if attempt < 2:
                    time.sleep(2)

        if response is None:
            raise last_error

        text = response.text.strip()

        if "WRONG_COMPANY:" in text:
            actual_company = text.split("WRONG_COMPANY:")[1].strip()
            return jsonify({
                "success"        : False,
                "wrong_company"  : True,
                "actual_company" : actual_company,
                "error"          : f"Wrong bill! This is a {actual_company} bill but you selected {disco_name}."
            })

        if "ERROR:" in text:
            return jsonify({
                "success": False,
                "error"  : "Could not read bill clearly. Please take a clearer photo."
            })

        lines    = text.split('\n')
        previous = None
        current  = None
        units    = None

        for line in lines:
            if 'PREVIOUS:' in line:
                nums = re.findall(r'\d+\.?\d*', line)
                if nums: previous = float(nums[0])
            elif 'CURRENT:' in line:
                nums = re.findall(r'\d+\.?\d*', line)
                if nums: current = float(nums[0])
            elif 'UNITS:' in line:
                nums = re.findall(r'\d+\.?\d*', line)
                if nums: units = float(nums[0])

        if units is None and previous is not None and current is not None:
            units = current - previous

        if units is None:
            return jsonify({
                "success": False,
                "error"  : "Could not extract units. Please enter manually."
            })

        units = round(units, 1)

        return jsonify({
            "success" : True,
            "previous": previous,
            "current" : current,
            "units"   : units,
            "message" : f"Successfully read {units} units from your bill!"
        })

    except Exception as e:
        print(f"Scan error: {str(e)}")
        return jsonify({"success": False, "error": f"Scan failed: {str(e)}"}), 500


# SECTION 5: BILL SCANNER V2

@app.route("/scan-bill-v2", methods=["POST"])
def scan_bill_v2():
    try:
        body      = request.get_json()
        image_b64 = body.get("image")
        scan_type = body.get("scan_type", "bill")

        if not image_b64:
            return jsonify({"error": "No image provided"}), 400

        image_data = base64.b64decode(image_b64)
        image_pil  = PIL.Image.open(io.BytesIO(image_data))

        if scan_type == "bill":
            disco_name = body.get("disco_name", "")
            disco_full = body.get("disco_full", "")

            prompt = f"""
You are analyzing a Pakistani electricity bill image.

IMPORTANT VALIDATION: This bill should be from {disco_full} ({disco_name}).
First check if this bill belongs to {disco_name} or {disco_full}.
Look for the company name or logo at the top of the bill.

If the bill does NOT belong to {disco_name}, respond with EXACTLY this one line:
WRONG_COMPANY: [write the actual company name found on the bill here]

If the bill DOES belong to {disco_name}, extract these values and respond with EXACTLY:
CURRENT_READING: [the present/current meter reading number shown on the bill]
READING_DATE: [the reading date shown on the bill in DD/MM/YYYY format]

If you cannot read clearly, respond with exactly:
ERROR: Could not read bill

Nothing else. No extra text.
"""

        else:
            prompt = """
You are analyzing a Pakistani electricity meter photo.

Read the current meter display and extract the meter reading number.

Respond with EXACTLY this one line:
METER_READING: [the number shown on the meter display]

If you cannot read clearly, respond with exactly:
ERROR: Could not read meter

Nothing else. No extra text.
"""

        response   = None
        last_error = None
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model    = 'gemini-2.5-flash',
                    contents = [prompt, image_pil]
                )
                break
            except Exception as retry_err:
                last_error = retry_err
                if attempt < 2:
                    time.sleep(2)

        if response is None:
            raise last_error

        text = response.text.strip()

        if scan_type == "bill":
            if "WRONG_COMPANY:" in text:
                actual_company = text.split("WRONG_COMPANY:")[1].strip()
                return jsonify({
                    "success"       : False,
                    "wrong_company" : True,
                    "actual_company": actual_company,
                    "error"         : f"Wrong bill! This is a {actual_company} bill but you selected {disco_name}."
                })

            if "ERROR:" in text:
                return jsonify({
                    "success": False,
                    "error"  : "Could not read bill clearly. Please take a clearer photo."
                })

            current_reading = None
            reading_date    = None

            for line in text.split('\n'):
                if 'CURRENT_READING:' in line:
                    nums = re.findall(r'\d+\.?\d*', line)
                    if nums: current_reading = float(nums[0])
                elif 'READING_DATE:' in line:
                    date_match = re.search(r'(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2,4})', line)
                    if date_match:
                        d, m, y = date_match.groups()
                        if len(y) == 2:
                            y = '20' + y
                        reading_date = f"{d.zfill(2)}/{m.zfill(2)}/{y}"

            if current_reading is None:
                return jsonify({"success": False, "error": "Could not extract meter reading from bill."})

            if reading_date is None:
                return jsonify({"success": False, "error": "Could not extract reading date from bill."})

            return jsonify({
                "success"        : True,
                "current_reading": current_reading,
                "reading_date"   : reading_date,
                "message"        : f"Bill reading {current_reading} on {reading_date}"
            })

        else:
            if "ERROR:" in text:
                return jsonify({"success": False, "error": "Could not read meter clearly. Please take a clearer photo."})

            meter_reading = None
            for line in text.split('\n'):
                if 'METER_READING:' in line:
                    nums = re.findall(r'\d+\.?\d*', line)
                    if nums: meter_reading = float(nums[0])

            if meter_reading is None:
                return jsonify({"success": False, "error": "Could not extract reading from meter photo."})

            return jsonify({
                "success"      : True,
                "meter_reading": meter_reading,
                "message"      : f"Meter reading: {meter_reading}"
            })

    except Exception as e:
        print(f"Scan V2 error: {str(e)}")
        return jsonify({"success": False, "error": f"Scan failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)