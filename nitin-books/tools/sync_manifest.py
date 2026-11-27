#!/usr/bin/env python3
"""Adds any new chapter files to books.json.

Usage (from the site folder):   python3 tools/sync_manifest.py

For every book listed in books.json it looks inside books/<book-id>/ for files named
NN-some-name.html. A file that is not in the manifest yet is added with its <h1> as the title.
A chapter that had a title but no file ("notes not added yet") gets its file attached when the
chapter's id (the part after NN-) matches. Also bumps the offline-cache version in sw.js.
"""
import json, re, glob, os, html
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp = os.path.join(root, "books.json")
m = json.load(open(mp, encoding="utf-8"))
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
changed = 0
for b in m["books"]:
    have = {c.get("file"): c for c in b["chapters"] if c.get("file")}
    byid = {c["id"]: c for c in b["chapters"]}
    for path in sorted(glob.glob(os.path.join(root, "books", b["id"], "*.html"))):
        f = os.path.basename(path)
        if f in have: continue
        text = open(path, encoding="utf-8").read()
        t = re.search(r"<h1>(.*?)</h1>", text, re.S)
        title = html.unescape(re.sub("<.*?>", "", t.group(1))).strip() if t else f
        cid = re.sub(r"^\d+-", "", f[:-5])
        if cid in byid:
            byid[cid]["file"] = f
        elif slug(title) in byid:
            byid[slug(title)]["file"] = f
        else:
            b["chapters"].append({"id": cid, "title": title, "file": f})
        changed += 1
        print("added", b["id"], f, "->", title)
json.dump(m, open(mp, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
sw = os.path.join(root, "sw.js")
s = open(sw, encoding="utf-8").read()
s2 = re.sub(r'nitin-books-v(\d+)', lambda x: f"nitin-books-v{int(x.group(1))+1}", s)
open(sw, "w", encoding="utf-8").write(s2)
print(changed, "chapter(s) added; offline cache version bumped.")
