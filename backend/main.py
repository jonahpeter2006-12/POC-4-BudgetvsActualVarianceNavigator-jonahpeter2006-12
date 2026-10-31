
from datetime import datetime
from pathlib import Path
from typing import Any

import duckdb
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Budget vs Actual Variance Navigator API",
    version="2.0.0",
    description="Financial performance and budget variance analytics API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

DATA_FILE = Path(__file__).resolve().parent / "budget_data.csv"

REQUIRED_COLUMNS = {
    "cost_centre",
    "department",
    "account_category",
    "month",
    "budget_amount",
    "actual_amount",
    "committed_amount",
    "forecast_amount",
}

AMOUNT_COLUMNS = [
    "budget_amount",
    "actual_amount",
    "committed_amount",
    "forecast_amount",
]

GROUPING_COLUMNS = [
    "department",
    "month",
    "cost_centre",
    "account_category",
]


def load_data() -> pd.DataFrame:
    """Load and validate the financial CSV dataset."""
    try:
        df = pd.read_csv(DATA_FILE)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail="Financial dataset was not found.",
        ) from exc
    except (OSError, pd.errors.ParserError) as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to read the financial dataset.",
        ) from exc

    missing = REQUIRED_COLUMNS.difference(df.columns)
    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Dataset is missing columns: {sorted(missing)}",
        )

    if df.empty:
        raise HTTPException(
            status_code=500,
            detail="Financial dataset contains no records.",
        )

    for column in AMOUNT_COLUMNS:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    if df[AMOUNT_COLUMNS].isna().any().any():
        raise HTTPException(
            status_code=500,
            detail="Dataset contains missing or invalid financial amounts.",
        )

    if (df[AMOUNT_COLUMNS] < 0).any().any():
        raise HTTPException(
            status_code=500,
            detail="Dataset contains negative financial amounts.",
        )

    if df[GROUPING_COLUMNS].isna().any().any():
        raise HTTPException(
            status_code=500,
            detail="Dataset contains missing grouping information.",
        )

    return df


def get_month_date(month: str) -> datetime:
    """Convert month labels such as Jan 2026 into sortable dates."""
    try:
        return datetime.strptime(month, "%b %Y")
    except ValueError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid month label in dataset: {month}",
        ) from exc


def money(value: Any) -> float:
    """Return a rounded numeric value for API responses."""
    return round(float(value), 2)


def apply_filters(
    df: pd.DataFrame,
    department: str | None = None,
    month: str | None = None,
) -> pd.DataFrame:
    """Validate and apply the shared dashboard filters."""

    if department:
        available_departments = df["department"].unique().tolist()

        if department not in available_departments:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Unknown department filter.",
                    "available_departments": sorted(available_departments),
                },
            )

        df = df[df["department"] == department]

    if month:
        available_months = df["month"].unique().tolist()

        if month not in available_months:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Unknown month filter.",
                    "available_months": sorted(
                        available_months,
                        key=get_month_date,
                    ),
                },
            )

        df = df[df["month"] == month]

    return df


def sort_monthly_results(result: list[dict]) -> list[dict]:
    """Sort monthly results chronologically."""
    return sorted(
        result,
        key=lambda row: get_month_date(row["month"]),
    )


def round_result_fields(
    rows: list[dict],
    fields: list[str],
) -> list[dict]:
    """Round selected numeric fields in grouped API results."""
    for row in rows:
        for field in fields:
            row[field] = money(row[field])

    return rows


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "Budget vs Actual Variance Navigator",
        "version": "2.0.0",
    }


@app.get("/api/summary")
def get_summary(
    department: str | None = Query(default=None),
    month: str | None = Query(default=None),
):
    df = apply_filters(load_data(), department, month)

    total_budget = df["budget_amount"].sum()
    total_actual = df["actual_amount"].sum()
    total_committed = df["committed_amount"].sum()
    total_forecast = df["forecast_amount"].sum()

    variance = total_actual - total_budget

    variance_pct = (
        (variance / total_budget) * 100
        if total_budget != 0
        else 0
    )

    status = (
        "Over Budget" if variance > 0
        else "Under Budget" if variance < 0
        else "On Budget"
    )

    return {
        "total_budget": money(total_budget),
        "total_actual": money(total_actual),
        "total_committed": money(total_committed),
        "total_forecast": money(total_forecast),
        "variance": money(variance),
        "variance_pct": money(variance_pct),
        "status": status,
        "record_count": int(len(df)),
        "department_count": int(df["department"].nunique()),
    }


@app.get("/api/waterfall")
def get_waterfall(
    department: str | None = Query(default=None),
    month: str | None = Query(default=None),
):
    df = apply_filters(load_data(), department, month)

    total_budget = df["budget_amount"].sum()
    total_actual = df["actual_amount"].sum()

    grouped = (
        df.groupby("department")
        .agg(
            budget=("budget_amount", "sum"),
            actual=("actual_amount", "sum"),
        )
        .reset_index()
    )

    grouped["variance"] = grouped["actual"] - grouped["budget"]
    grouped = grouped.sort_values("department")

    waterfall_items = [
        {
            "name": "Base Budget",
            "value": money(total_budget),
            "is_total": True,
        }
    ]

    for _, row in grouped.iterrows():
        waterfall_items.append(
            {
                "name": f"{row['department']} Variance",
                "value": money(row["variance"]),
                "is_total": False,
            }
        )

    waterfall_items.append(
        {
            "name": "Final Actual",
            "value": money(total_actual),
            "is_total": True,
        }
    )

    variance_sum = grouped["variance"].sum()

    reconciles = bool(
        abs((total_budget + variance_sum) - total_actual) < 0.01
    )

    return {
        "waterfall": waterfall_items,
        "reconciliation": {
            "budget": money(total_budget),
            "variance_sum": money(variance_sum),
            "actual": money(total_actual),
            "reconciles": reconciles,
        },
    }


@app.get("/api/department-breakdown")
def get_department_breakdown(
    department: str | None = Query(default=None),
    month: str | None = Query(default=None),
):
    df = apply_filters(load_data(), department, month)

    with duckdb.connect() as con:
        result = con.execute(
            """
            SELECT
                department,
                SUM(budget_amount) AS budget,
                SUM(actual_amount) AS actual,
                SUM(committed_amount) AS committed,
                SUM(forecast_amount) AS forecast,
                SUM(actual_amount - budget_amount) AS variance,
                CASE
                    WHEN SUM(budget_amount) = 0 THEN 0
                    ELSE ROUND(
                        SUM(actual_amount - budget_amount)
                        / SUM(budget_amount) * 100,
                        2
                    )
                END AS variance_pct
            FROM df
            GROUP BY department
            ORDER BY variance DESC
            """
        ).df().to_dict(orient="records")

    round_result_fields(
        result,
        [
            "budget",
            "actual",
            "committed",
            "forecast",
            "variance",
            "variance_pct",
        ],
    )

    return {"departments": result}


@app.get("/api/monthly-trends")
def get_monthly_trends(
    department: str | None = Query(default=None),
    month: str | None = Query(default=None),
):
    """Return monthly financial trends with shared filters."""
    df = apply_filters(load_data(), department, month)

    with duckdb.connect() as con:
        result = con.execute(
            """
            SELECT
                month,
                SUM(budget_amount) AS budget,
                SUM(actual_amount) AS actual,
                SUM(forecast_amount) AS forecast
            FROM df
            GROUP BY month
            """
        ).df().to_dict(orient="records")

    result = sort_monthly_results(result)

    round_result_fields(
        result,
        ["budget", "actual", "forecast"],
    )

    return {"trends": result}


@app.get("/api/department-heatmap")
def get_department_heatmap(
    department: str | None = Query(default=None),
    month: str | None = Query(default=None),
):
    df = apply_filters(load_data(), department, month)

    with duckdb.connect() as con:
        result = con.execute(
            """
            SELECT
                department,
                account_category,
                SUM(budget_amount) AS budget,
                SUM(actual_amount) AS actual,
                SUM(actual_amount - budget_amount) AS variance,
                CASE
                    WHEN SUM(budget_amount) = 0 THEN 0
                    ELSE ROUND(
                        SUM(actual_amount - budget_amount)
                        / SUM(budget_amount) * 100,
                        2
                    )
                END AS variance_pct
            FROM df
            GROUP BY department, account_category
            ORDER BY department, account_category
            """
        ).df().to_dict(orient="records")

    round_result_fields(
        result,
        ["budget", "actual", "variance", "variance_pct"],
    )

    return {"heatmap": result}


@app.get("/api/forecast")
def get_forecast(
    range_pct: float = Query(default=10.0, ge=0, le=50),
    department: str | None = Query(default=None),
    month: str | None = Query(default=None),
):
    """
    Return an illustrative forecast range.

    This is an assumption-based display range, not a statistically
    validated confidence interval. The current dataset does not
    contain historical forecast-error observations.
    """
    df = apply_filters(load_data(), department, month)

    with duckdb.connect() as con:
        result = con.execute(
            """
            SELECT
                month,
                SUM(budget_amount) AS budget,
                SUM(actual_amount) AS actual,
                SUM(forecast_amount) AS forecast
            FROM df
            GROUP BY month
            """
        ).df().to_dict(orient="records")

    result = sort_monthly_results(result)

    forecast_items = []

    for row in result:
        forecast = float(row["forecast"])
        margin = forecast * (range_pct / 100)

        forecast_items.append(
            {
                "month": row["month"],
                "budget": money(row["budget"]),
                "actual": money(row["actual"]),
                "forecast": money(forecast),
                "lower_bound": money(max(0, forecast - margin)),
                "upper_bound": money(forecast + margin),
            }
        )

    return {
        "forecast": forecast_items,
        "method": "Illustrative percentage-based range",
        "range_pct": range_pct,
        "is_statistically_validated": False,
        "disclaimer": (
            "The displayed range is assumption-based and is not "
            "a statistically validated confidence interval."
        ),
    }


@app.get("/api/filters")
def get_filters():
    df = load_data()

    months = sorted(
        df["month"].unique().tolist(),
        key=get_month_date,
    )

    return {
        "departments": sorted(df["department"].unique().tolist()),
        "months": months,
        "account_categories": sorted(
            df["account_category"].unique().tolist()
        ),
        "cost_centres": sorted(df["cost_centre"].unique().tolist()),
    }
