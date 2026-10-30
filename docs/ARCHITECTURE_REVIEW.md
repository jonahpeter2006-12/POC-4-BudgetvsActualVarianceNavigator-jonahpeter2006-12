\# ARCHITECTURE REVIEW

\## PoC-4: Budget vs Actual Variance Navigator



\*\*Project:\*\* Real Rails Interns Batch 8  

\*\*Organization:\*\* Infocreon Internship  

\*\*Repository:\*\* Budget vs Actual Variance Navigator  

\*\*Branch:\*\* `rebuild/full-stack-poc4`  

\*\*Document Status:\*\* Architecture Review Draft



\---



\## 1. Objective



The objective of this project is to build a Budget vs Actual Variance Navigator that helps business users understand financial performance across departments, cost centres, account categories, and months.



The application will identify budget deviations, highlight areas of overspending and underspending, and provide useful financial insights to support decision-making.



The implementation will follow the official PoC-4 requirements before the separate cinematic design phase.



\## 2. Existing Project Assessment



The current repository contains:



\### Backend

\- Python

\- FastAPI

\- Pandas

\- DuckDB

\- CSV-based synthetic financial dataset



Existing API endpoints:

\- `/api/health`

\- `/api/summary`

\- `/api/waterfall`

\- `/api/department-breakdown`

\- `/api/monthly-trends`



\### Frontend

\- Next.js

\- React

\- TypeScript

\- Existing dashboard page and styling



\### Dataset

The current dataset contains synthetic financial records for January–March 2026.



Verified dataset totals:



| Metric | Amount |

|---|---:|

| Total Budget | $601,000 |

| Total Actual | $633,000 |

| Total Committed | $42,500 |

| Total Forecast | $660,500 |

| Total Variance | +$32,000 |

| Variance Percentage | +5.32% |



These figures are based on the current CSV dataset and must be calculated from the source data rather than hardcoded in the frontend.



\## 3. Target Architecture



\### Frontend

\- Next.js

\- React

\- TypeScript

\- Tailwind CSS

\- Reusable dashboard components

\- API integration

\- Responsive layouts



\### Backend

\- Python

\- FastAPI

\- Pandas

\- DuckDB

\- Data validation and calculation services



\### Data

\- CSV-based synthetic financial dataset

\- Consistent financial calculation rules

\- Data validation before calculations



The existing repository will be improved and reorganized where necessary. Verified existing functionality may be reused.



\## 4. Required Dashboard Visualizations



The dashboard must implement all four required visualizations.



\### 4.1 Variance Waterfall

Show how department-level budget variances contribute to the overall difference between budget and actual spending.



\### 4.2 Monthly Trend

Compare budget, actual, and forecast amounts over time.



\### 4.3 Department Heatmap

Highlight department-level financial performance and variance patterns.



\### 4.4 Forecast Confidence Band

Display forecast values with an illustrative range.



\*\*Important limitation:\*\* The current dataset contains only three months of records and does not contain historical forecast-error observations. Therefore, the initial confidence band will be an illustrative forecast range based on documented assumptions, not a statistically validated confidence interval.



\## 5. Proposed API Design



Existing endpoints will be reviewed and improved.



| Endpoint | Purpose |

|---|---|

| `/api/health` | Backend health check |

| `/api/summary` | Overall financial KPIs |

| `/api/waterfall` | Variance waterfall data |

| `/api/department-breakdown` | Department financial comparison |

| `/api/monthly-trends` | Monthly budget, actual, and forecast |

| `/api/department-heatmap` | Department heatmap data |

| `/api/forecast` | Forecast values and illustrative range |



The new endpoints are proposed additions, not existing functionality.



\## 6. Financial Calculation Rules



The application will follow consistent financial calculations.



\*\*Variance:\*\*



`Actual - Budget`



\*\*Variance Percentage:\*\*



`(Variance / Budget) × 100`



\*\*Financial interpretation:\*\*

\- Positive variance: Over budget.

\- Negative variance: Under budget.

\- Zero variance: On budget.



Additional rules:

\- Handle zero-budget cases safely.

\- Keep committed amounts separate from actual spending.

\- Calculate dashboard figures from the dataset or backend API.

\- Avoid inconsistent or hardcoded financial figures.

\- Ensure waterfall calculations reconcile with overall financial totals.



\## 7. Quality and Testing Strategy



\### Backend Testing

\- Health endpoint validation.

\- Summary calculation validation.

\- Variance calculation validation.

\- Department aggregation validation.

\- Monthly trend validation.

\- Waterfall reconciliation.

\- Forecast range validation.

\- Invalid or missing data handling.



\### Frontend Testing

\- API integration.

\- Correct KPI rendering.

\- Chart data accuracy.

\- Filter behavior.

\- Loading and error states.

\- Responsive layout.

\- Navigation and interaction testing.



\## 8. Proposed Implementation Structure



The following is the proposed target structure. It is not a description of the current repository.



```text

project/

├── backend/

│   ├── main.py

│   ├── budget\_data.csv

│   ├── services/

│   ├── tests/

│   └── requirements.txt

├── frontend/

│   ├── src/

│   │   ├── app/

│   │   ├── components/

│   │   ├── lib/

│   │   └── types/

│   └── package.json

├── docs/

│   ├── ARCHITECTURE\_REVIEW.md

│   ├── VAR\_REPORT.md

│   └── UAT\_CHECKLIST.md

└── README.md

```



\## 9. Design Direction



The first implementation phase will prioritize:

\- Functional dashboard behavior.

\- Accurate financial calculations.

\- Complete API integration.

\- Required visualizations.

\- Responsive behavior.

\- Meaningful financial insights.



The separate cinematic design phase will follow core implementation and validation.



\## 10. Implementation Phases



1\. Review and approve architecture.

2\. Prepare backend data and calculation services.

3\. Implement and test required API endpoints.

4\. Build frontend components and API integration.

5\. Implement all four required visualizations.

6\. Verify calculations and interactions.

7\. Complete the separate cinematic design phase.

8\. Perform VAR.

9\. Perform UAT.

10\. Prepare submission materials.



\## 11. Official Execution Protocol



The project will follow the required execution protocol:



`Repomix → AI Handshake → Architecture Review → Implementation → VAR → UAT → Submission → Approval → Repository Handover`



Each stage must be completed and verified before proceeding to the next.



\---



\*\*Architecture Review Status:\*\* Draft prepared for review and approval.



\*\*Next Stage:\*\* Architecture approval, followed by implementation.

