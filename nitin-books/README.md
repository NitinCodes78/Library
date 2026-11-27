# Nitin's Library: free, fast, offline-friendly reading site

Two books today (Java, Spring Boot). Every chapter is its own file in `books/`; `books.json` is the table of contents. The page (`index.html`) only reads those files, so adding a book never means touching the code.

## Folder map
```
index.html              the reader (library, contents, page-turn reader, highlights, notes, bookmarks)
books.json              list of books and chapters (title, file)
books/java/*.html       one file per chapter (34 so far)
books/spring/*.html     Spring Boot chapters (38 chapters: servlets through role-based authorization)
sw.js, manifest.webmanifest, icon.svg   offline mode and "Add to Home screen"
functions/api/notes.js  optional: syncs notes between devices (Cloudflare KV)
tools/sync_manifest.py  adds new chapter files to books.json for you
```

## Publish (one time, about 15 minutes, free)
1. Create a **private** GitHub repo (e.g. `nitin-books`) and upload this whole folder.
2. On dash.cloudflare.com go to **Workers & Pages, Create, Pages, Connect to Git**, pick the repo, leave the build command empty and the output directory `/`. Deploy. You get `https://<name>.pages.dev`.
3. Done. It works offline after the first visit, and highlights/notes/bookmarks are kept in the browser's storage (the site asks the browser to keep it permanently).

Optional, to sync across laptop and phone and lock the site to your email:
- **KV:** Workers & Pages, KV, create `books-notes`. In the Pages project: Settings, Bindings, add KV namespace, variable name `NOTES`. Redeploy.
- **Email lock:** Zero Trust, Access, Applications, Add, Self-hosted. Domain `<name>.pages.dev`; policy Allow, Emails, your address; login method One-time PIN.
- Your email is on line 4 of `functions/api/notes.js`.
Without these two steps the site still works; notes simply stay on each device (use **Notes, Back up** to move them).

## Add a new book (for example LLD)
1. Make a folder `books/lld/` and put one HTML file per chapter in it, named `01-intro.html`, `02-solid.html` ...
2. Add this to `books.json` under `"books"`:
   ```json
   {"id":"lld","title":"LLD","author":"Nitin","color":"#7b3fa0","cover":"generic","chapters":[]}
   ```
3. Run `python3 tools/sync_manifest.py` (adds the chapters, bumps the offline version). Or edit `books.json` by hand and change `nitin-books-v2` in `sw.js` to `v3`.
4. Push to GitHub. Cloudflare redeploys in about 1 to 2 minutes; phones pick up the new version the next time they open the site online.

To add a chapter to an existing book: drop the file in its folder, run the same script, push.

## Chapter file format (what the reader understands)
Each file starts with `<h1>Title</h1>` and `<p class="kicker">one line</p>`, then plain HTML:
- `<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<table>`, `<b>`, `<code>`
- Code: `<pre><code class="java">...</code></pre>` (escape `<` as `&lt;`); it is colour-highlighted automatically
- Boxes: `<div class="box ex">` example, `box fix` correction, `box extra` good to know, `box iq` interview corner (use `<details><summary>Q</summary><p>A</p></details>` inside)
- Diagrams: `<div class="flow"><b>A</b><i>label</i><b>B</b></div>`, `<div class="diag"><div class="row"><div class="cb">..</div></div></div>`, `<div class="tree2"><div class="top">..</div><div class="kids"><div>..</div></div></div>`
- Images: put them in the book folder and use `<img src="books/lld/pic.png">` or inline SVG in `<figure class="fig">`

## Reader features
Page colours (sepia default, ivory, white, mint, sky, dusk, night, black), font and size, scroll / one page / two pages, optional page-turn animation, highlights in four colours, side notes, per-page Notes list, bookmarks across books, page numbers, Continue reading, next/previous chapter at the page edges, offline.
