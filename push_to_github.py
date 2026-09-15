#!/usr/bin/env python3
"""
Hospital Management System - Python GitHub Automation Script
Stages, commits, and pushes code to GitHub remote repository.
"""

import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
REPO_URL = "https://github.com/Sxnjxy25/Infrastructure-as-Code-for-Hospital-Management-.git"

def run_cmd(cmd, check=True):
    print(f"[*] Executing: {' '.join(cmd)}")
    res = subprocess.run(cmd, cwd=str(ROOT_DIR), text=True)
    if check and res.returncode != 0:
        print(f"[!] Command failed with return code {res.returncode}")
        sys.exit(res.returncode)
    return res

def main():
    print("=" * 60)
    print("   PUSHING REPOSITORY TO GITHUB (PYTHON AUTOMATION)")
    print("=" * 60)
    print()

    # 1. Configure Author
    run_cmd(["git", "config", "user.email", "adith@example.com"], check=False)
    run_cmd(["git", "config", "user.name", "Adithya"], check=False)

    # 2. Git Init
    run_cmd(["git", "init"], check=False)

    # 3. Stage
    print("\n[*] Staging all files...")
    run_cmd(["git", "add", "."])

    # 4. Commit
    commit_msg = sys.argv[1] if len(sys.argv) > 1 else "Hospital Management System - Complete Python FastAPI Stack, Unified Web UI & IaC"
    print(f"\n[*] Committing with message: '{commit_msg}'...")
    run_cmd(["git", "commit", "-m", commit_msg], check=False)

    # 5. Set Branch & Remote
    print("\n[*] Setting main branch and remote...")
    run_cmd(["git", "branch", "-M", "main"], check=False)
    run_cmd(["git", "remote", "remove", "origin"], check=False)
    run_cmd(["git", "remote", "add", "origin", REPO_URL])

    # 6. Push
    print("\n[*] Pushing to GitHub...")
    run_cmd(["git", "push", "-u", "origin", "main", "--force"])

    print()
    print("=" * 60)
    print("  SUCCESSFULLY PUSHED TO GITHUB!")
    print(f"  URL: {REPO_URL.replace('.git', '')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
