"""Eksperyment: minimalna pętla agenta nad LiteLLM (MiniMax-M3).

Cel eksperymentu (krok 4 planu): zweryfikować tool calling MiniMax przez
LiteLLM na realnym zadaniu — zbudowanie projektu harness/harness z Dockerem.

To NIE jest kod produktu: pętla agenta w produkcie należy do DSH (D5.1),
a wykonanie odbywa się w sandboxie. Tutaj polecenia biegną na hoście,
w jawnie wskazanym katalogu roboczym — wyłącznie na potrzeby eksperymentu.

Trajectory (append-only JSONL) trafia do pliku wskazanego w --trajectory.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

from openai import OpenAI

MAX_OUTPUT_CHARS = 8000
THINK_RE = re.compile(r"<think>.*?</think>", re.S)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "run_shell",
            "description": (
                "Wykonaj polecenie shell w katalogu roboczym eksperymentu. "
                "Zwraca kod wyjścia oraz obcięte stdout i stderr. "
                "Dla długich operacji (np. docker build) ustaw odpowiedni timeout_s."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string"},
                    "timeout_s": {"type": "integer", "minimum": 5, "maximum": 3600},
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "finish",
            "description": (
                "Zakończ zadanie. Podaj status (success/failure), podsumowanie "
                "wykonanej pracy oraz dowody (polecenia weryfikujące i ich wyniki)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["success", "failure"]},
                    "summary": {"type": "string"},
                    "evidence": {"type": "string"},
                },
                "required": ["status", "summary", "evidence"],
            },
        },
    },
]


class Trajectory:
    def __init__(self, path: Path) -> None:
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)

    def append(self, kind: str, **payload) -> None:
        record = {"ts": datetime.now(timezone.utc).isoformat(), "kind": kind, **payload}
        with self.path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")


def run_shell(workdir: Path, command: str, timeout_s: int = 120) -> dict:
    started = time.monotonic()
    try:
        proc = subprocess.run(
            command,
            shell=True,
            cwd=workdir,
            capture_output=True,
            text=True,
            timeout=timeout_s,
        )
        return {
            "exit_code": proc.returncode,
            "duration_s": round(time.monotonic() - started, 1),
            "stdout": proc.stdout[-MAX_OUTPUT_CHARS:],
            "stderr": proc.stderr[-MAX_OUTPUT_CHARS:],
        }
    except subprocess.TimeoutExpired:
        return {
            "exit_code": -1,
            "duration_s": round(time.monotonic() - started, 1),
            "stdout": "",
            "stderr": f"TIMEOUT po {timeout_s}s",
        }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--task-file", required=True)
    parser.add_argument("--workdir", required=True)
    parser.add_argument("--trajectory", required=True)
    parser.add_argument("--base-url", default="http://127.0.0.1:4000")
    parser.add_argument("--model", default="helmflow-default")
    parser.add_argument("--max-iterations", type=int, default=40)
    args = parser.parse_args()

    workdir = Path(args.workdir).resolve()
    workdir.mkdir(parents=True, exist_ok=True)
    trajectory = Trajectory(Path(args.trajectory))
    task = Path(args.task_file).read_text(encoding="utf-8")

    client = OpenAI(
        base_url=f"{args.base_url}/v1",
        api_key=os.environ.get("LITELLM_MASTER_KEY", "brak"),
    )

    messages = [
        {
            "role": "system",
            "content": (
                "Jesteś agentem wykonawczym. Pracujesz wyłącznie przez narzędzie "
                "run_shell w katalogu roboczym; kończysz narzędziem finish z dowodami. "
                "Wykonuj po jednym poleceniu na raz i sprawdzaj wynik, zanim przejdziesz "
                "dalej. Dla poleceń długotrwałych (docker build) ustawiaj timeout_s "
                "adekwatnie (np. 3600). Nie proś człowieka o nic — działaj samodzielnie."
            ),
        },
        {"role": "user", "content": task},
    ]
    trajectory.append("task", content=task, workdir=str(workdir), model=args.model)

    usage_total = {"prompt_tokens": 0, "completion_tokens": 0}

    for iteration in range(1, args.max_iterations + 1):
        response = client.chat.completions.create(
            model=args.model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=4000,
            timeout=600,
        )
        choice = response.choices[0]
        message = choice.message
        if response.usage:
            usage_total["prompt_tokens"] += response.usage.prompt_tokens or 0
            usage_total["completion_tokens"] += response.usage.completion_tokens or 0

        content_clean = THINK_RE.sub("", message.content or "").strip()
        trajectory.append(
            "model_response",
            iteration=iteration,
            content=content_clean,
            tool_calls=[
                {"name": tc.function.name, "arguments": tc.function.arguments}
                for tc in (message.tool_calls or [])
            ],
            finish_reason=choice.finish_reason,
        )

        if not message.tool_calls:
            # Model odpowiedział tekstem zamiast narzędziem — przypomnienie protokołu.
            messages.append({"role": "assistant", "content": content_clean})
            messages.append(
                {
                    "role": "user",
                    "content": "Używaj wyłącznie narzędzi run_shell i finish.",
                }
            )
            continue

        messages.append(
            {
                "role": "assistant",
                "content": message.content or "",
                "tool_calls": [tc.model_dump() for tc in message.tool_calls],
            }
        )

        for tool_call in message.tool_calls:
            arguments = json.loads(tool_call.function.arguments)
            if tool_call.function.name == "finish":
                trajectory.append("finish", iteration=iteration, **arguments, usage=usage_total)
                print(json.dumps({"result": arguments, "usage": usage_total, "iterations": iteration},
                                 ensure_ascii=False, indent=2))
                return 0 if arguments.get("status") == "success" else 1

            command = arguments["command"]
            timeout_s = int(arguments.get("timeout_s", 120))
            print(f"[{iteration}] $ {command}  (timeout {timeout_s}s)", flush=True)
            result = run_shell(workdir, command, timeout_s)
            trajectory.append("tool_result", iteration=iteration, command=command, **result)
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result, ensure_ascii=False),
                }
            )

    trajectory.append("aborted", reason="max_iterations", usage=usage_total)
    print(json.dumps({"result": {"status": "aborted"}, "usage": usage_total}, ensure_ascii=False))
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
