"""Load a junior's current assignments for the voice agent."""

from __future__ import annotations

from typing import Any

from app.services.agent_prompt import first_name


def format_tasks_for_agent(tasks: list[dict[str, Any]], junior_name: str) -> dict[str, str]:
    if not tasks:
        summary = "No open tasks are assigned right now."
        bullets = "None."
    else:
        lines = []
        for i, t in enumerate(tasks, start=1):
            due = t.get("due_at") or "no due date"
            lines.append(
                f"{i}. {t.get('title', 'Untitled')} (status: {t.get('status', 'unknown')}, due: {due})\n"
                f"   Brief: {t.get('description', '')}"
            )
        summary = f"{junior_name} has {len(tasks)} active assignment(s)."
        bullets = "\n".join(lines)

    questions = (
        "1. What is your work product on your current assignment(s)?\n"
        "2. What have you been up to since we last spoke?\n"
        "3. Walk me through real insights and decision-making — not what the model drafted.\n"
        "4. Where did you disagree with AI output, and what did you change?\n"
        "5. What would you do differently if the client pushed back tomorrow?"
    )

    return {
        "junior_name": junior_name,
        "current_work_summary": summary,
        "current_tasks_detail": bullets,
        "check_in_questions": questions,
    }


def fetch_junior_work_context(supabase, junior_id: str) -> tuple[dict[str, Any] | None, dict[str, str]]:
    try:
        profile_res = (
            supabase.table("profiles")
            .select("id, full_name, phone, role, check_in_interval_days")
            .eq("id", junior_id)
            .maybe_single()
            .execute()
        )
    except Exception:
        profile_res = (
            supabase.table("profiles")
            .select("id, full_name, phone, role")
            .eq("id", junior_id)
            .maybe_single()
            .execute()
        )
    profile = profile_res.data
    if not profile or profile.get("role") != "junior":
        return None, {}

    tasks_res = (
        supabase.table("tasks")
        .select("id, title, description, status, due_at")
        .eq("assignee_id", junior_id)
        .in_("status", ["assigned", "in_progress"])
        .order("due_at")
        .execute()
    )
    tasks = tasks_res.data or []
    primary_task_id = tasks[0]["id"] if tasks else None
    display_name = profile.get("full_name") or "Analyst"
    variables = format_tasks_for_agent(tasks, display_name)
    # First name for phone greeting (Sam) — used in API first_message and {{junior_name}} in UI
    variables["employee_first_name"] = first_name(display_name)

    work_context = {
        "profile": profile,
        "tasks": tasks,
        "primary_task_id": primary_task_id,
        "dynamic_variables": variables,
    }
    return work_context, variables
