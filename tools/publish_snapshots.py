"""Publish generated Spotify JSON safely when main changes during collection.

Keep the collected JSON in memory, fetch the latest main, and apply only
changes made by this run. A regular git rebase can conflict on snapshots.
"""
import copy
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MISSING = object()


def git(*args, check=True):
    completed = subprocess.run(
        ["git", *args], cwd=ROOT, capture_output=True, text=True
    )
    if check and completed.returncode:
        raise RuntimeError(
            "git " + " ".join(args) + "\n" + completed.stdout + completed.stderr
        )
    return completed


def current_json(path):
    file = ROOT / path
    return json.loads(file.read_text()) if file.is_file() else MISSING


def checkout_json(path):
    result = git("show", "HEAD:" + path, check=False)
    return json.loads(result.stdout) if result.returncode == 0 else MISSING


def iso(value, field):
    return value.get(field, "") if isinstance(value, dict) else ""


def reconcile(old, collected, latest):
    """Merge only the run's edits, retaining unrelated changes on main."""
    if collected == old:
        return latest
    if latest == old or collected == latest:
        return collected
    if isinstance(collected, dict) and isinstance(latest, dict):
        merged = copy.deepcopy(latest)
        keys = set(old) | set(collected) if isinstance(old, dict) else set(collected)
        for key in keys:
            before = old.get(key, MISSING) if isinstance(old, dict) else MISSING
            after = collected.get(key, MISSING)
            remote = latest.get(key, MISSING)
            if after == before:
                continue
            if after is MISSING:
                merged.pop(key, None)
            else:
                merged[key] = reconcile(before, after, remote) if remote is not MISSING else after
        return merged
    if isinstance(collected, list) and isinstance(latest, list):
        if all(isinstance(x, str) for x in collected + latest):
            return sorted(set(collected + latest), reverse=True)
    # When both changed an individual statistic, prefer the fresh collection.
    return collected


def merge_document(path, old, collected, latest):
    if collected is MISSING:
        return MISSING if latest == old else latest
    if latest is MISSING:
        return collected
    if old is MISSING:
        return reconcile({}, collected, latest)
    # Don't roll back a newer independently completed collection.
    if path.endswith("/group.json") or path.endswith("/solo.json") or "/history/" in path:
        if iso(latest, "date") > iso(collected, "date"):
            return latest
        if (iso(latest, "date") == iso(collected, "date")
                and iso(latest, "captured_at") > iso(collected, "captured_at")):
            return latest
    merged = reconcile(old, collected, latest)
    if path.endswith("/state.json"):
        for kind in ("group", "solo"):
            remote_entry = latest.get(kind, {})
            own_entry = collected.get(kind, {})
            if iso(remote_entry, "last_success") > iso(own_entry, "last_success"):
                merged[kind] = remote_entry
    return merged


def main():
    paths = [
        line for line in git("diff", "--cached", "--name-only", "--", "data/").stdout.splitlines()
        if line.startswith("data/") and line.endswith(".json")
    ]
    if not paths:
        print("No collected JSON changes to publish")
        return
    changes = [(p, checkout_json(p), current_json(p)) for p in paths]
    print("Publishing", len(changes), "updated JSON files from this run")

    for attempt in range(1, 5):
        git("fetch", "origin", "main")
        git("reset", "--hard", "origin/main")
        for path, before, collected in changes:
            latest = current_json(path)
            merged = merge_document(path, before, collected, latest)
            destination = ROOT / path
            if merged is MISSING:
                destination.unlink(missing_ok=True)
            else:
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n")
        git("add", "--", "data/")
        if git("diff", "--cached", "--quiet", check=False).returncode == 0:
            print("Latest main already contains these changes")
            return
        git("commit", "-m", "Update SEVENTEEN Group streams")
        pushed = git("push", "origin", "HEAD:main", check=False)
        if pushed.returncode == 0:
            print("Published collected stats successfully")
            return
        print(f"Main changed while pushing (attempt {attempt}/4): {pushed.stderr.strip()}")
    raise SystemExit("Could not publish after four retries; next scheduled run will retry")


if __name__ == "__main__":
    main()
