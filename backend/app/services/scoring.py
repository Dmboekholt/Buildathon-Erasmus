"""
Future: compare junior spoken answers to task briefs / ground truth via LLM.

Wire this from a background job after webhook saves a debrief (kind=work_check_in),
or call the existing TypeScript scoreDebrief flow from the frontend.
"""

from __future__ import annotations

from typing import Any


def build_scoring_payload(
    *,
    transcript: str,
    tasks: list[dict[str, Any]],
    junior_name: str,
) -> dict[str, Any]:
    """Shape data for an LLM rubric call (not invoked yet)."""
    return {
        "junior_name": junior_name,
        "transcript": transcript,
        "assignments": tasks,
        "rubric": {
            "decision_making": "Forecasts, assumptions, trade-offs stated in their own words",
            "insights": "Non-obvious points beyond the brief / AI draft",
            "judgement": "Conviction, risks, defensibility under pushback",
        },
    }
