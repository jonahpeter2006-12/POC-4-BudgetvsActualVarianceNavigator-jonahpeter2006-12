from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import duckdb
import os

app = FastAPI(title="Budget vs Actual Variance Navigator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = os.path.join(os.path.dirname(__file__), "budget_data.csv")

def load_data():
    return pd.read_csv(DATA_FILE)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Budget vs Actual Variance Navigator"}

@app.get("/api/summary")
def get_summary():
    df = load_data()
    total_budget = float(df["budget_amount"].sum())
    total_actual = float(df["actual_amount"].sum())
    total_committed = float(df["committed_amount"].sum())
    variance = total_actual - total_budget
    variance_pct = round((variance / total_budget) * 100, 2) if total_budget > 0 else 0
    
    return {
        "total_budget": total_budget,
        "total_actual": total_actual,
        "total_committed": total_committed,
        "variance": variance,
        "variance_pct": variance_pct,
        "status": "Over Budget" if variance > 0 else "Under Budget"
    }

@app.get("/api/waterfall")
def get_waterfall():
    df = load_data()
    total_budget = float(df["budget_amount"].sum())
    
    dept_variance = df.groupby("department").apply(
        lambda x: float(x["actual_amount"].sum() - x["budget_amount"].sum())
    ).to_dict()
    
    total_actual = float(df["actual_amount"].sum())
    
    waterfall_items = [{"name": "Base Budget", "value": total_budget, "is_total": True}]
    for dept, val in dept_variance.items():
        waterfall_items.append({"name": f"{dept} Variance", "value": round(val, 2), "is_total": False})
    waterfall_items.append({"name": "Final Actual", "value": total_actual, "is_total": True})
    
    return {"waterfall": waterfall_items}

@app.get("/api/department-breakdown")
def get_department_breakdown():
    df = load_data()
    con = duckdb.connect()
    
    query = """
        SELECT 
            department,
            SUM(budget_amount) as budget,
            SUM(actual_amount) as actual,
            SUM(committed_amount) as committed,
            SUM(actual_amount - budget_amount) as variance,
            ROUND((SUM(actual_amount - budget_amount) / SUM(budget_amount)) * 100, 2) as variance_pct
        FROM df
        GROUP BY department
        ORDER BY variance DESC
    """
    result = con.execute(query).df().to_dict(orient="records")
    return {"departments": result}

@app.get("/api/monthly-trends")
def get_monthly_trends():
    df = load_data()
    con = duckdb.connect()
    
    query = """
        SELECT 
            month,
            SUM(budget_amount) as budget,
            SUM(actual_amount) as actual,
            SUM(forecast_amount) as forecast
        FROM df
        GROUP BY month
    """
    result = con.execute(query).df().to_dict(orient="records")
    return {"trends": result}
