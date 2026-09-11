# Editing project case studies

Each HTML page is standalone and shares `style.css`. Its opening `case-summary` has four sections: Problem, Contribution, Result and Design takeaway. Current summaries reuse the repository’s existing project descriptions and evaluation figures; they are not a new verification of external results.

To make these pages your own, edit each section in your voice:

- **Problem:** Who needed this and what was difficult? What constraints mattered?
- **Contribution:** What did you personally implement or investigate? For group work, distinguish your role from the team's.
- **Result:** What worked? Give the metric, evaluation setup and baseline where you have them. Separate offline experiments, working prototypes and production outcomes.
- **What I learned:** Replace “Design takeaway” with this heading and describe a specific surprise, mistake, tradeoff or change you would make. The current design takeaways describe implementation choices without inventing personal experiences.

Keep project logos in `assets/projects/` (referenced as `../assets/projects/` from project pages). Add your own screenshots to `projects/assets/` with descriptive alt text and captions. Link working demos and source repositories near the result. Never add a demo URL or metric you cannot substantiate.

The three Start Here selections and their existing figures are configured in `openWelcomeNote()` in `js/apps.js`. The full catalogue lives in `content/data.js`.
