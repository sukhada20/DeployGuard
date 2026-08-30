"""Terminal UI formatting and visual presentation for DeployGuard Demo."""

import sys
import time

RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
ITALIC = "\033[3m"
UNDERLINE = "\033[4m"

FG_BLACK = "\033[30m"
FG_RED = "\033[31m"
FG_GREEN = "\033[32m"
FG_YELLOW = "\033[33m"
FG_BLUE = "\033[34m"
FG_MAGENTA = "\033[35m"
FG_CYAN = "\033[36m"
FG_WHITE = "\033[37m"

FG_BRIGHT_RED = "\033[91m"
FG_BRIGHT_GREEN = "\033[92m"
FG_BRIGHT_YELLOW = "\033[93m"
FG_BRIGHT_BLUE = "\033[94m"
FG_BRIGHT_MAGENTA = "\033[95m"
FG_BRIGHT_CYAN = "\033[96m"
FG_BRIGHT_WHITE = "\033[97m"


def print_header(title: str, subtitle: str = "") -> None:
    width = 76
    print()
    print(f"{FG_BRIGHT_CYAN}╔{'═' * width}╗{RESET}")
    print(
        f"{FG_BRIGHT_CYAN}║{BOLD}{FG_BRIGHT_WHITE} {title.center(width - 2)} {RESET}{FG_BRIGHT_CYAN}║{RESET}"
    )
    if subtitle:
        print(
            f"{FG_BRIGHT_CYAN}║{DIM}{FG_WHITE} {subtitle.center(width - 2)} {RESET}{FG_BRIGHT_CYAN}║{RESET}"
        )
    print(f"{FG_BRIGHT_CYAN}╚{'═' * width}╝{RESET}")
    print()


def print_stage_banner(
    stage_num: int, title: str, agent_name: str, color: str = FG_BRIGHT_CYAN
) -> None:
    width = 76
    print(f"\n{color}{'━' * width}{RESET}")
    print(
        f"{color}{BOLD} STAGE {stage_num:02d} ► {title.upper()}{RESET}  {DIM}[Agent: {agent_name}]{RESET}"
    )
    print(f"{color}{'━' * width}{RESET}\n")


def print_agent_thought(
    agent_name: str, thought: str, color: str = FG_BRIGHT_MAGENTA
) -> None:
    print(
        f"  {color}┌─ {BOLD}{agent_name}{RESET}{color} (Reasoning & Policy Check) {'─' * max(1, 52 - len(agent_name))}┐{RESET}"
    )
    for line in thought.strip().split("\n"):
        print(f"  {color}│{RESET} {line}")
    print(f"  {color}└{'─' * 72}┘{RESET}\n")


def print_metric_table(
    baseline: dict[str, float],
    anomalous: dict[str, float],
    recovered: dict[str, float] | None = None,
) -> None:
    header = f"{'Metric Dimension':<20} {'Baseline':<12} {'Incident Peak':<16} {'Delta %':<12}"
    if recovered is not None:
        header += f" {'Recovered':<12} {'Status':<10}"
    else:
        header += f" {'Status':<10}"

    print(f"  {BOLD}{FG_BRIGHT_WHITE}{header}{RESET}")
    print(f"  {DIM}{'─' * len(header)}{RESET}")

    for metric, base_val in baseline.items():
        curr_val = anomalous.get(metric, base_val)
        delta_pct = ((curr_val - base_val) / base_val * 100.0) if base_val > 0 else 0.0
        delta_str = f"{delta_pct:+.1f}%" if abs(delta_pct) > 0.01 else "0.0%"

        if delta_pct > 50.0:
            status = f"{FG_BRIGHT_RED}CRITICAL{RESET}"
            delta_colored = f"{FG_BRIGHT_RED}{delta_str:<12}{RESET}"
        elif delta_pct > 15.0:
            status = f"{FG_BRIGHT_YELLOW}WARNING{RESET}"
            delta_colored = f"{FG_BRIGHT_YELLOW}{delta_str:<12}{RESET}"
        else:
            status = f"{FG_BRIGHT_GREEN}HEALTHY{RESET}"
            delta_colored = f"{FG_GREEN}{delta_str:<12}{RESET}"

        row = f"  {metric:<20} {base_val:<12.2f} {curr_val:<16.2f} {delta_colored}"
        if recovered is not None:
            rec_val = recovered.get(metric, base_val)
            rec_status = (
                f"{FG_BRIGHT_GREEN}NORMALIZED{RESET}"
                if abs(rec_val - base_val) <= (base_val * 0.15)
                else f"{FG_BRIGHT_RED}ANOMALOUS{RESET}"
            )
            row += f" {rec_val:<12.2f} {rec_status:<10}"
        else:
            row += f" {status:<10}"

        print(row)
    print()


def print_security_alert(scenario: str, details: str, passed: bool = True) -> None:
    badge = (
        f"{FG_BRIGHT_GREEN}🛡️  SECURITY GATE ENFORCED{RESET}"
        if passed
        else f"{FG_BRIGHT_RED}🚨 SECURITY BREACH DETECTED{RESET}"
    )
    border_color = FG_BRIGHT_GREEN if passed else FG_BRIGHT_RED

    print(f"  {border_color}╔{'═' * 72}╗{RESET}")
    print(f"  {border_color}║{RESET}  {badge} {DIM}[{scenario}]{RESET}")
    print(f"  {border_color}╟{'─' * 72}╢{RESET}")
    for line in details.strip().split("\n"):
        print(f"  {border_color}║{RESET}  {line}")
    print(f"  {border_color}╚{'═' * 72}╝{RESET}\n")


def prompt_step(stage_name: str, interactive: bool = True) -> None:
    if interactive:
        try:
            print(
                f"{FG_BRIGHT_YELLOW}► Press [Enter] to continue to {stage_name}...{RESET}",
                end="",
                flush=True,
            )
            input()
            print()
        except (KeyboardInterrupt, EOFError):
            print(f"\n{DIM}Demo execution interrupted by user.{RESET}")
            sys.exit(0)
    else:
        time.sleep(0.4)
