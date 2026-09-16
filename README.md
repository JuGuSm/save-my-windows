# Déjà Vu

A GNOME Shell extension that restores your window layout — position, workspace, monitor — whenever Wayland scrambles it
(e.g. after suspend). Works well on Wayland and helps with multi-monitor, multi-workspace setups.

![screenshot.png](screenshot.png)

Déjà Vu periodically records all open windows along with their monitors and workspaces, so you can restore that layout
later, automatically or on demand.

## Features

- **Save / Restore Layout** — snapshot the current window layout, or restore the last one saved.
- **Default Layout** — save a separate layout as your "default" (e.g. your usual daily setup), independent from the
  regularly auto-saved one, and restore or edit it whenever you want.
- **Auto-save** — periodically saves the current layout in the background (every 5 minutes by default); can be turned
  off from the panel menu.
- **Auto-restore after suspend** — automatically restores your last saved layout after the system resumes from suspend.
- **Regex title matching** — match windows for restoration even if their title changes (see below).

## Window title pattern matching

When restoring a layout, each saved window entry is matched against currently open windows using its `wm_class` and
`title`. By default `title` must match **exactly**.

To match by pattern instead, prefix the saved `title` with `re:` — the rest of the string is compiled as a JavaScript
regular expression and tested against the live window's title:

```json
{
  "title": "re:^Firefox",
  "wm_class": "firefox",
  "workspace": 0,
  "monitor": 0,
  "x": 0, "y": 0, "width": 1280, "height": 800
}
```

This matches any Firefox window whose title starts with "Firefox", regardless of the active tab.

Examples:

| `title` in `layout.json` | Behavior |
|---|---|
| `"Firefox — Mozilla Firefox"` | Exact match only (default) |
| `"re:^Firefox"` | Matches any title starting with "Firefox" |
| `"re:.*\\.txt — gedit"` | Matches any `.txt` file open in gedit, regardless of filename |

Notes:
- Entries without the `re:` prefix are unaffected — a plain-text `layout.json` keeps working exactly as before.
- If the text after `re:` is not a valid regular expression, the entry is logged as an error and skipped (that window
  won't be restored), rather than crashing the extension.
- Matching is evaluated per saved entry independently, so a broad pattern can in principle match more than one currently
  open window (same limitation as an exact-title match on two windows sharing the same title).

## Default layout

In addition to the regularly saved/auto-saved layout (`layout.json`), you can keep a separate "default" layout
(`layout_default.json`) — for example your usual daily window arrangement, kept stable regardless of what gets
auto-saved during the day. From the panel menu:

- **Save Current Layout as Default** — snapshots the current layout into `layout_default.json`.
- **Restore Default Layout** — restores from `layout_default.json` instead of the regular layout.
- **Edit Default Layout** — opens `layout_default.json` in your system's default text editor (creating an empty file
  first if none exists yet), useful for hand-editing entries or adding `re:` patterns.

## Installation

This extension is not published on extensions.gnome.org — install it manually:

```bash
./install.sh
```

This installs to `~/.local/share/gnome-shell/extensions/deja-vu@JuGuSm/` and enables the extension. Reload GNOME Shell
afterwards (see below) to pick it up.

## Reloading GNOME Shell after changes

- **X11**: press `Alt+F2`, type `r`, press Enter. Restarts GNOME Shell without logging out.
- **Wayland**: GNOME Shell cannot be restarted in place; log out and back in for changes to take effect.

# Dev notes

### Releasing a new version

- Bump `version` in `metadata.json`
- Run `./release.sh` to tag the release
- Run `./pack.sh` to build the zip if you want to distribute it manually

## Credits

Originally based on [lukastymo/save-my-windows](https://github.com/lukastymo/save-my-windows), since archived by its
author — GNOME on Wayland now restores window layouts correctly after suspend/resume in most cases, though not always
reliably enough for every setup. Déjà Vu continues from that codebase with its own name, feature set, and maintenance.

## License

This extension is released under the GNU Public License version 3.
