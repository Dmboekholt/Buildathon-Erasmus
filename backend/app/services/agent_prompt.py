"""Build ElevenLabs outbound call payload (mode controls how much we override the agent)."""

from __future__ import annotations

# demo (default): Hi Sam + first question + disable end_call via tool_ids: []
# dashboard: dynamic variables only — Nova template often hangs up after greeting
# full: demo + full task list in system prompt


def first_name(full_name: str) -> str:
    parts = full_name.strip().split()
    return parts[0] if parts else "there"


def build_opening_message(full_name: str) -> str:
    """Client demo opener — name in text, flows straight into question 1."""
    name = first_name(full_name)
    return (
        f"Hi {name}, this is Judgment Ledger calling for your work check-in. "
        f"I'll keep this to about ten minutes. "
        f"First question: on your main assignment right now, what is your actual work product, "
        f"and what did you decide yourself rather than copy from AI?"
    )


def build_anti_hangup_prompt(variables: dict[str, str]) -> str:
    name = first_name(variables.get("junior_name", "the analyst"))
    return (
        f"You are a senior manager on a live phone call with {name}. "
        "This is a work check-in, not user research. "
        "Never end the call immediately after your introduction. "
        "Stay on the line at least five to eight minutes. "
        "Ask one question at a time and wait for answers. "
        "If they are quiet, prompt them again — do not hang up. "
        "Only wrap up after you have discussed their assignments and heard real reasoning. "
        "Do not use end_call in the first three minutes of the call."
    )


def build_system_prompt(variables: dict[str, str]) -> str:
    name = first_name(variables.get("junior_name", "there"))
    return f"""{build_anti_hangup_prompt(variables)}

{variables.get("current_work_summary", "")}

Assignments:
{variables.get("current_tasks_detail", "")}

Topics to cover:
{variables.get("check_in_questions", "")}

Be warm. Use their name ({name}). Ask follow-ups."""


def build_initiation_payload(
    *,
    junior_id: str,
    check_in_id: str,
    variables: dict[str, str],
    mode: str = "demo",
) -> dict:
    full_name = variables.get("junior_name", "Analyst")
    payload: dict = {
        "user_id": junior_id,
        "dynamic_variables": {
            **variables,
            "junior_name": first_name(full_name),
            "check_in_id": check_in_id,
            "junior_id": junior_id,
        },
    }

    if mode == "dashboard":
        return payload

    agent: dict = {
        "first_message": build_opening_message(full_name),
        "language": "en",
        "prompt": {
            "prompt": build_anti_hangup_prompt(variables)
            if mode == "demo"
            else build_system_prompt(variables),
            "tool_ids": [],
        },
    }
    payload["conversation_config_override"] = {"agent": agent}
    return payload
