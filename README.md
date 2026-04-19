# ⚡ Bijli-Dost — AI Electricity Slab Scheduler

> Keeping Pakistani Homes Under 199 Units!

---

## 📌 Problem Statement

In Pakistan, NEPRA offers a heavily subsidized "Protected Slab"
for households consuming 199 units or less per month. If a
household accidentally consumes even 1 extra unit (200+), the
protected status is revoked and the bill can double or triple.

Bijli-Dost is an AI-powered early warning system that takes your
current consumption and remaining days, then calculates the
optimal daily appliance schedule to guarantee you stay under
the 199-unit limit.

---

## 🧠 AI Architecture

This project uses classical AI techniques strictly aligned with
the FAST-NUCES Artificial Intelligence course outline:

| Technique          | Syllabus Week | Role in Project                        |
|--------------------|---------------|----------------------------------------|
| CSP Formulation    | Week 13       | Variables, Domains, Constraints        |
| Hill Climbing      | Week 8        | Local Search Optimizer                 |
| Random Restarts    | Week 8        | Escape local optima                    |
| Min-Conflicts      | Week 13       | Repair constraint violations           |
| Feasibility Check  | Week 13       | Detect mathematically impossible cases |

### CSP Formulation
- Variables   : Each selected appliance
- Domains     : Hours per day (min_hours to max_hours in 0.5h steps)
- Constraints :
  - HARD: Total monthly units <= 199 (NEPRA protected slab)
  - HARD: Each appliance hours within allowed range
  - SOFT: Minimize deviation from user preferred hours

---

## 📁 Project Structure

bijli_dost_project/
├── requirements.txt   — Dependencies (standard library only)
├── README.md          — This file
├── nepra_rules.py     — Module 1: Constants, appliance data, helpers
├── csp_solver.py      — Module 2: AI Brain (CSP + Local Search)
└── main.py            — Module 3: CLI Interface & entry point

---

## ⚙️ How to Run

### Step 1: Make sure Python is installed
python --version
# Should be Python 3.7 or higher

### Step 2: Navigate to project folder
cd bijli_dost_project

### Step 3: Run the application
python main.py

### Step 4 (Optional): Run module self-tests
python nepra_rules.py
python csp_solver.py

---

## 🧪 Test Scenarios

### Test 1 — Danger Zone Family
- Units consumed : 165
- Days remaining : 18
- Expected result: CRITICAL status, AI cuts AC heavily

### Test 2 — Safe Early Month
- Units consumed : 30
- Days remaining : 25
- Expected result: SAFE status, all appliances kept

### Test 3 — Impossible Heavy Household
- Units consumed : 140
- Days remaining : 12
- Expected result: Impossible case detected gracefully

---

## 🏠 Supported Appliances (23 total)

### Cooling & Heating
- AC 1-Ton, AC 1.5-Ton, AC 2-Ton
- Ceiling Fan, Pedestal Fan, Air Cooler

### Kitchen
- Refrigerator, Deep Freezer, Microwave
- Electric Kettle, Toaster, Washing Machine

### Lighting
- LED Bulb, Energy Saver (CFL), Tube Light

### Entertainment & Office
- LED TV 32-inch, LED TV 55-inch
- Laptop, Desktop PC, Wi-Fi Router

### Utilities
- Water Pump, Electric Geyser, Clothes Iron

---

## 👨‍💻 Developed By

- Project   : Bijli-Dost — AI Slab Scheduler
- Course    : Artificial Intelligence — FAST-NUCES
- Semester  : 4th Semester
- Group     : Knight Riders

### Group Members
| # | Name                  |
|---|-----------------------|
| 1 | Muhammad Usman Ghani  |
| 2 | Wasiq Ahmed           |
| 3 | Muhammad Azan         |
| 4 | Afrasiyab Khan        |
| 5 | Muhammad Awais        |

---

## 📜 License

This project is developed for academic purposes at FAST-NUCES.