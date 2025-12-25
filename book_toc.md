# The Architecture of Evidence: A Modern Web-Native Data Visualization Handbook

This book is both a philosophical and technical guide to **building credible visual evidence on the web**—where **R/Python’s statistical rigor** meets **modern interactive publishing**.

## 🧬 This is a Living Specification
Unlike a static textbook, this project serves as the **Documentation of the Data Contract** for human and AI collaborators. It defines the formal bridge between analytical models and the visual interface. When an AI agent or a statistical script generates a result, it refers to this book to ensure its output (the "Evidence Payload") is structurally sound and aesthetically consistent.

---

## 🛠 The Technology Stack (Minimal by Design)

- **Observable Plot**: technical, exploratory, and statistical graphics (the “ggplot2 of the web”).
- **Recharts**: polished, operational dashboards and executive summaries.
- **Tigris & Next.js**: the pipeline for delivering asynchronous model outputs from Python/R agents to the browser.

---

## 🤖 The Agentic Workflow: Model-to-View
1. **Estimate**: An agent (or human) runs a model in Python or R.
2. **Contract**: The analysis is serialized into a JSON payload conforming to the specs defined in this handbook.
3. **Dispatch**: The payload is pushed to a **Tigris S3** bucket.
4. **Render**: The Next.js frontend detects the new data (via webhook or polling) and hydrates the corresponding component instantly.

---

## 📚 How Chapters Work (The Consistent Recipe)

Each chapter follows a rigid structure to maintain the integrity of the data contract:

1. **The Question**: The business or academic inquiry being addressed.
2. **The Data Contract (The API)**: The precise JSON schema required for this visualization. This is the **instruction set for AI agents**.
3. **Visual Grammar**: Encodings, scales, and annotations.
4. **Uncertainty Layer**: How the component handles variance and error metrics.
5. **Interactive Patterns**: Drill-downs, hovers, and selections.
6. **Failure Modes**: Warnings on how this visualization can be misinterpreted.
7. **Implementation Technicals**: Observable Plot vs Recharts logic.
8. **Automated Writeup**: Templates for figure captions and methods notes.

---

## 📖 Table of Contents

## Part I — Foundations: The Architecture of Evidence
1. **From Charts to Claims**: Evidence vs decoration.
2. **A Small Visual Language**: Line, dot, bar, interval, density, heatmap.
3. **Formalizing Data Contracts**: Defining JSON schemas for reproducible evidence.
4. **Scales, Units, and Honesty**: Log scales, indexing, and base-year normalization.
5. **Uncertainty as a First-Class Layer**: Confidence intervals and robust SEs.
6. **Publishing Standards**: Accessibility and Compliance.

## Part II — Time, Trend, and Change (The Workhorse Section)
7. **The Statistical Line Chart**: Volatility and rolling windows.
8. **Comparisons Over Time**: Base-indexing and YoY deltas.
9. **Event Annotations**: Policy shifts and regime shocks.
10. **Anomaly Detection**: Visualizing outliers with explainability.
11. **Panel Data Dynamics**: Within vs between variation.

## Part III — Place, Space, and Geography (Maps Without Mysticism)
12. **The Choropleth, Done Responsibly**: Denominators and uncertainty-aware shading.
13. **Linked Views**: Region selection → Longitudinal context.
14. **Geographic Small Multiples**: Temporal shifts across maps.
15. **The Map Alternative**: When dot plots outperform geographic views.

## Part IV — Categories, Composition, and Survey Truth
16. **The Categorical Canon**: Ranked bars vs interval dots.
17. **Compositional Shifts**: Visualizing mixture changes over time.
18. **Likert Logic**: Polarization and diverging distribution stacks.
19. **The Weighted Truth**: Handling survey weights and effective sample size.
20. **High-Cardinality Views**: Search-and-highlight primitives.

## Part V — Statistical Synthesis: Models, Diagnostics, and Text
21. **Distributions**: Histograms, Density, and ECDFs.
22. **Relationships**: Binned scatter plots and hexbins for large datasets.
23. **Regression Diagnostics**: Residual plots as visual validity checks.
24. **Coefficient Plots**: Centralizing model results without tables.
25. **Fixed Effects (Fixest)**: Visualizing FE structure and interpretability.
26. **Difference-in-Differences**: Parallel trends and counterfactuals.
27. **Event Studies**: Dynamic effects and omitted period conventions.
28. **Marginal Effects**: Interactions as facets, not spaghetti.
29. **Specification Curves**: Visualizing model robustness across specifications.
30. **Topic Modeling (NLP)**: Prevalence, drift, and representative exemplars.
31. **Document-Level Views**: Mixture distributions and mixed membership.

## Part VI — The Executive Suite (Tableau-Style Dashboards)
32. **Composite Layouts**: "Bento box" designs with Recharts.
33. **Decision Tables**: Tabular summaries with embedded sparklines and CI.
34. **Analytical Drill-Down**: National → Segment → Local entity flows.
35. **The Narrative Overlay**: Dynamic captions driven by data triggers.
36. **Performance & Polish**: Dark mode, animations, and premium UX.

---

## 🚀 Appendix — The API Reference
*   **A. Rosetta Stone**: Mapping Python/R libraries to Plot/Recharts.
*   **B. The Payload Registry**: Master list of JSON schemas for agents.
*   **C. Methods Templates**: Automated text generation for reports.
*   **D. The Component Library**: Using the `viz/components` patterns.
