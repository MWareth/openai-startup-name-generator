#!/usr/bin/env python3
"""Lightweight Asana CRM helper for a real-estate lead board.

Dependency-free (stdlib only). Auth via the ASANA_TOKEN env var (a Personal
Access Token). Default board via the ASANA_PROJECT env var (a project GID),
overridable with --project on any command.

Subcommands:
  whoami                       Verify token; show user + workspaces.
  projects [--workspace GID]   List projects (find your board's GID).
  stages   [--project GID]     List the board's sections (pipeline stages).
  list     [--project GID] [--stage NAME] [--json]
                               Show leads grouped by stage.
  show     <lead> [--project GID]
                               Show one lead's details + recent comments.
  update   <lead> <text...> [--project GID]
                               Add a comment/update to a lead.
  move     <lead> <stage> [--project GID]
                               Move a lead to another stage (section).

<lead> may be an Asana task GID (all digits) or a case-insensitive substring
of the lead/task name (must match exactly one lead).
"""
import json
import os
import sys
import argparse
import urllib.request
import urllib.parse
import urllib.error

API = "https://app.asana.com/api/1.0"


def _token():
    tok = os.environ.get("ASANA_TOKEN")
    if not tok:
        sys.exit(
            "ERROR: ASANA_TOKEN is not set.\n"
            "Create a Personal Access Token at "
            "https://app.asana.com/0/my-apps and export it, e.g.:\n"
            "  export ASANA_TOKEN=1/1234567890:abcdef...\n"
            "In Claude Code on the web, add it as an environment secret/variable."
        )
    return tok


def _request(method, path, params=None, body=None):
    url = f"{API}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    data = json.dumps({"data": body}).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {_token()}")
    req.add_header("Accept", "application/json")
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        sys.exit(f"ERROR: Asana API {e.code} on {method} {path}\n{detail}")
    except urllib.error.URLError as e:
        sys.exit(f"ERROR: network failure reaching Asana: {e.reason}")


def _get_all(path, params=None):
    """GET with pagination; returns the concatenated data list."""
    params = dict(params or {})
    params.setdefault("limit", 100)
    out = []
    offset = None
    while True:
        p = dict(params)
        if offset:
            p["offset"] = offset
        resp = _request("GET", path, params=p)
        out.extend(resp.get("data", []))
        nxt = resp.get("next_page")
        if not nxt:
            break
        offset = nxt.get("offset")
        if not offset:
            break
    return out


def _project_gid(args):
    gid = getattr(args, "project", None) or os.environ.get("ASANA_PROJECT")
    if not gid:
        sys.exit(
            "ERROR: no project set. Pass --project <gid> or set ASANA_PROJECT.\n"
            "Run `asana_leads.py projects` to find your board's GID."
        )
    return gid


def _section_of(task):
    """Return the section/stage name a task sits in within its project."""
    for m in task.get("memberships", []):
        sec = m.get("section")
        if sec and sec.get("name"):
            return sec["name"]
    return "(no stage)"


LEAD_FIELDS = (
    "name,completed,due_on,assignee.name,notes,"
    "memberships.section.name,memberships.project.name,custom_fields.name,"
    "custom_fields.display_value"
)


def _leads(project_gid, include_completed=False):
    tasks = _get_all(
        f"/projects/{project_gid}/tasks",
        {"opt_fields": LEAD_FIELDS},
    )
    if not include_completed:
        tasks = [t for t in tasks if not t.get("completed")]
    return tasks


def _resolve_lead(args):
    """Find a single task by GID or name substring within the project."""
    q = args.lead
    if q.isdigit():
        return _request(
            "GET", f"/tasks/{q}", {"opt_fields": LEAD_FIELDS}
        )["data"]
    tasks = _leads(_project_gid(args), include_completed=True)
    ql = q.lower()
    matches = [t for t in tasks if ql in t.get("name", "").lower()]
    if not matches:
        sys.exit(f"No lead matching '{q}' in this board.")
    if len(matches) > 1:
        names = "\n".join(f"  - {t['name']} (gid {t['gid']})" for t in matches)
        sys.exit(
            f"'{q}' matches {len(matches)} leads; be more specific or use a GID:\n{names}"
        )
    return matches[0]


# ---------------------------------------------------------------- commands

def cmd_whoami(args):
    me = _request("GET", "/users/me", {"opt_fields": "name,email,workspaces.name"})["data"]
    print(f"Logged in as: {me.get('name')} <{me.get('email')}>")
    print("Workspaces:")
    for w in me.get("workspaces", []):
        print(f"  - {w['name']}  (gid {w['gid']})")


def cmd_projects(args):
    params = {"opt_fields": "name,archived"}
    if args.workspace:
        params["workspace"] = args.workspace
    projs = _get_all("/projects", params)
    for p in projs:
        if p.get("archived"):
            continue
        print(f"{p['gid']}  {p['name']}")


def cmd_stages(args):
    secs = _get_all(f"/projects/{_project_gid(args)}/sections", {"opt_fields": "name"})
    for s in secs:
        print(f"{s['gid']}  {s['name']}")


def cmd_list(args):
    tasks = _leads(_project_gid(args))
    if args.stage:
        sl = args.stage.lower()
        tasks = [t for t in tasks if sl in _section_of(t).lower()]
    if args.json:
        print(json.dumps(tasks, indent=2))
        return
    by_stage = {}
    for t in tasks:
        by_stage.setdefault(_section_of(t), []).append(t)
    if not tasks:
        print("No active leads found.")
        return
    for stage, items in by_stage.items():
        print(f"\n## {stage}  ({len(items)})")
        for t in items:
            who = (t.get("assignee") or {}).get("name", "unassigned")
            due = t.get("due_on") or "no due date"
            print(f"  • {t['name']}  —  {who}, due {due}  (gid {t['gid']})")


def cmd_show(args):
    t = _resolve_lead(args)
    print(f"# {t['name']}  (gid {t['gid']})")
    print(f"Stage:    {_section_of(t)}")
    print(f"Assignee: {(t.get('assignee') or {}).get('name', 'unassigned')}")
    print(f"Due:      {t.get('due_on') or '—'}")
    cf = [c for c in t.get("custom_fields", []) if c.get("display_value")]
    if cf:
        print("Fields:")
        for c in cf:
            print(f"  - {c['name']}: {c['display_value']}")
    if t.get("notes"):
        print(f"\nNotes:\n{t['notes']}")
    stories = _get_all(f"/tasks/{t['gid']}/stories", {"opt_fields": "text,type,created_at,created_by.name"})
    comments = [s for s in stories if s.get("type") == "comment"]
    if comments:
        print("\nRecent updates:")
        for s in comments[-5:]:
            by = (s.get("created_by") or {}).get("name", "?")
            print(f"  [{s.get('created_at','')[:10]}] {by}: {s.get('text','')}")


def cmd_update(args):
    t = _resolve_lead(args)
    text = " ".join(args.text)
    _request("POST", f"/tasks/{t['gid']}/stories", body={"text": text})
    print(f"✓ Added update to '{t['name']}' (gid {t['gid']}):\n  {text}")


def cmd_move(args):
    t = _resolve_lead(args)
    secs = _get_all(f"/projects/{_project_gid(args)}/sections", {"opt_fields": "name"})
    sl = args.stage.lower()
    match = [s for s in secs if sl in s["name"].lower()]
    if not match:
        avail = ", ".join(s["name"] for s in secs)
        sys.exit(f"No stage matching '{args.stage}'. Stages: {avail}")
    if len(match) > 1:
        avail = ", ".join(s["name"] for s in match)
        sys.exit(f"'{args.stage}' is ambiguous: {avail}")
    sec = match[0]
    _request("POST", f"/sections/{sec['gid']}/addTask", body={"task": t["gid"]})
    print(f"✓ Moved '{t['name']}' → {sec['name']}")


def main():
    p = argparse.ArgumentParser(description="Asana real-estate lead helper.")
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("whoami"); sp.set_defaults(func=cmd_whoami)

    sp = sub.add_parser("projects"); sp.add_argument("--workspace")
    sp.set_defaults(func=cmd_projects)

    sp = sub.add_parser("stages"); sp.add_argument("--project")
    sp.set_defaults(func=cmd_stages)

    sp = sub.add_parser("list")
    sp.add_argument("--project"); sp.add_argument("--stage")
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(func=cmd_list)

    sp = sub.add_parser("show")
    sp.add_argument("lead"); sp.add_argument("--project")
    sp.set_defaults(func=cmd_show)

    sp = sub.add_parser("update")
    sp.add_argument("lead"); sp.add_argument("text", nargs="+")
    sp.add_argument("--project")
    sp.set_defaults(func=cmd_update)

    sp = sub.add_parser("move")
    sp.add_argument("lead"); sp.add_argument("stage")
    sp.add_argument("--project")
    sp.set_defaults(func=cmd_move)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
