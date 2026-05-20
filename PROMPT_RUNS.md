# 🗂 PROMPT_RUNS · Execution Log for 8-PRO Prompt Lab

This file tracks every time a curated prompt (from 8-PRO tab 🧩 Módulos or 📚 Library) is executed by Claude Code.

## Why this exists
The user runs the same prompt multiple times across sessions. Without history:
- Claude redoes work already done.
- Improvements stack noisily instead of compounding.
- No memory of what was tried, what worked, what failed.

## How Claude uses this
**Before starting** any curated prompt, Claude:
1. Greps this file for the prompt ID (e.g. `ID:13-NOT.P1`).
2. Reads prior runs · understands what's been done · what's pending.
3. Picks an EXTENSION or NEW angle · never repeats.

**After completing**, Claude appends an entry (see template below).

## Entry template

```
### ID:<promptId> · <YYYY-MM-DD>
- Commit: <hash>
- Files: <list>
- Changed: <1-2 lines what was actually done>
- Next: <what to try in the next run · what to skip>
```

## Conventions
- Prompt IDs follow `{module-code}.{kind}` for module prompts (e.g. `12-FIN.P1`, `10-SYS.P3`) or `LIB.{slug}` for library prompts (e.g. `LIB.bug-hunt`, `LIB.sync-audit`).
- Append at the BOTTOM of the relevant section. Don't rewrite history.
- One commit = one entry (don't combine multiple runs).
- If a run produced no changes (was an audit), still log it with `Files: -` so the next run knows it was already audited.

---

## 📒 Module Prompts (16 × 3 = 48 prompts)

<!-- Append entries below for: 1-IND.P1, 1-IND.P2, 1-IND.P3, 2-APP.P1, ... 16-APA.P3 -->

### ID:2-APP.P3 · 2026-05-19
- Commit: b53c416
- Files: frontend/js/app-second-brain.js (NEW · 33K) · frontend/apply.html · frontend/js/cloud-sync.js
- Changed: Built the full 5-phase "Second Brain" layer for 2-APP. New `APP` IIFE namespace + `window.APP` CLI. 3 new tabs (Coach · Wiki · Canvas) + analysis history panel.
  - F1 · Foundation+CLI: `app_analyses` localStorage (registered in SYNC_REGISTRY) · auto-snapshot hook on runAnalysis() · history panel (last 20 · re-load) · `window.APP.{list,get,load,current,clear,exportAll,inbox,...}`.
  - F2 · Web Clipper: bookmarklet generator modal (`APP.showClipper()`) · captures JD from LinkedIn/Indeed/Computrabajo · `apply.html?clip=1` URL handler prefills form.
  - F3 · Outcome Coach: outcome editor modal (status/salary/notes per analysis) · local correlation engine (callback rate · skill lift · industry · word-count) · insights panel.
  - F4 · Job Market Wiki: concept aggregator (have/gap/tactical/powerWord/redFlag) · frequency-sorted chips · drill-down modal showing vacancies per concept.
  - F5 · Career Canvas: 6-column pipeline by outcome status · click node → outcome editor · cross-link count with 5-JOB `da_vacancies`.
- Next: P3 chosen idea was "all 5". For the NEXT 2-APP.P3 run — DO NOT rebuild these. Instead pick a NEW angle: e.g. (a) JSON Canvas export of the career graph to 15-MM · (b) Karpathy-style auto-clustering of the Wiki concepts into themes · (c) scheduled cron that re-scores stale analyses · (d) cross-device realtime for app_analyses. Verify the 5 phases still work before extending.

### ID:13-NOT.P3 · 2026-05-19
- Commit: <pending>
- Files: frontend/js/notes-brain.js (NEW · 33K) · frontend/notes.html (6 surgical edits)
- Changed: Built the full 5-phase "Second Brain" layer for 13-NOT. New `NOT` IIFE + `window.NOT` CLI. New tab 🗺️ Grafo. Notes go from flat list to connected knowledge base.
  - F1 · CLI+Daily: stable-`id` migration for sb_notes2 · daily note (`type:'daily'`) as quick-capture inbox · `window.NOT.{all,get,search,create,append,today,capture,link,backlinks,toFlashcard,graph,organize,...}`.
  - F2 · Wiki-links: `[[note title]]` syntax · clickable links · `[[`-autocomplete on #nBody · backlinks footer ("Mencionada en") per note card.
  - F3 · Notes→SRS: 🃏 Flashcard button per note (hover) → modal → adds card to eng_srs_deck (box 1, with sourceNoteId backlink).
  - F4 · Knowledge Graph: 🗺️ Grafo tab · radial SVG · nodes=notes, edges=wiki-links (solid) + shared tags (dashed) · color by tag · orphan detection · click node → jump to note.
  - F5 · Karpathy Organizer: 🧹 "Ordená mi cerebro" button · heuristic local analysis (near-dupes via Jaccard · tag suggestions via keywords · link suggestions via title mentions · orphans) with one-click apply · "Copy Karpathy prompt" for deep AI reorg.
- Next: For the NEXT 13-NOT.P3 run — DO NOT rebuild. New angles: (a) export the F4 graph to 15-MM as a real jsMind map · (b) realtime cross-device for the daily note · (c) auto-flashcard from selected text (not whole note) · (d) wire the deep-reorg prompt to actually run via a sub-agent. Verify the 5 phases still work first.

## 📚 Library Prompts

<!-- Append entries below for: LIB.bootstrap, LIB.bug-hunt, LIB.sync-audit, LIB.design-audit, LIB.cross-module, LIB.capabilities-audit, etc. -->

---

*Created 2026-05-15 · Fase D · token-saving overhaul.*
