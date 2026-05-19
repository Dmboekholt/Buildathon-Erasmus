"""Detect Supabase/PostgREST errors for optional schema features."""

from postgrest.exceptions import APIError


def is_missing_table(exc: BaseException, table: str) -> bool:
    if isinstance(exc, APIError):
        payload = exc.args[0] if exc.args else {}
        if isinstance(payload, dict):
            code = str(payload.get("code", ""))
            msg = str(payload.get("message", "")).lower()
            if code == "PGRST205" and table.lower() in msg:
                return True
    msg = str(exc).lower()
    return table.lower() in msg and (
        "pgrst205" in msg
        or "does not exist" in msg
        or "could not find the table" in msg
    )


def is_missing_column(exc: BaseException, column: str) -> bool:
    msg = str(exc).lower()
    return column.lower() in msg and "does not exist" in msg
