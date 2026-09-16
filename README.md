# Déjà Vu

A GNOME Shell extension that saves and restores your window layout — position, size, monitor, and workspace — for each
open window. Useful for people, like me, who organise their screen in a structured way by dedicating a specific space to each app.

![screenshot.png](screenshot.png)

## Features

- **Save / Restore Layout** — snapshot the current arrangement of windows, or restore the last one saved.
- **Default Layout** — keep a second, separate layout (e.g. your usual daily setup) that auto-save never overwrites.
  Save, restore, or hand-edit it independently from the regular layout.
- **Auto-save** — saves the current layout in the background every 5 minutes. Can be turned off from the menu.
- **Auto-restore after suspend** — restores the last saved layout automatically when the system resumes.
- **Regex title matching** — match a window for restoration by a pattern instead of an exact title, so a window whose
  title changes (browser tab, open file) still gets restored.
- Runs entirely locally: no telemetry, no network access.

## Installation

Not published on extensions.gnome.org — install manually from a clone of this repository:

```bash
./install.sh
```

This copies the extension to `~/.local/share/gnome-shell/extensions/deja-vu@JuGuSm/` and enables it. To install
system-wide instead:

```bash
sudo ./install.sh --system
```

After installing or updating, reload GNOME Shell to pick up the change:

- **X11**: `Alt+F2`, type `r`, press Enter — restarts GNOME Shell in place.
- **Wayland**: GNOME Shell can't restart in place; log out and back in.

## Usage

Click the panel icon (top bar) to open the menu:

| Menu item | Action |
|---|---|
| Save Current Layout | Snapshot the layout of all currently open windows. |
| Restore Last Layout | Restore the most recently saved layout. |
| Save Current Layout as Default | Snapshot the current layout into a separate "default" layout. |
| Restore Default Layout | Restore from the default layout instead of the regular one. |
| Save Automatically (5m) | Toggle background auto-save every 5 minutes. |
| Restore Automatically (after suspend) | Toggle auto-restore of the last layout right after resume. |
| Edit Default Layout | Open the default layout's JSON file in your system's text editor. |

Layouts are stored as JSON under `~/.config/deja-vu/`:

- `layout.json` — the regular layout (written by "Save Current Layout" and auto-save).
- `layout_default.json` — the default layout (written by "Save Current Layout as Default").
- `settings.json` — the two toggle states above.

Each entry in a layout file looks like:

```json
{
  "title": "Firefox — Mozilla Firefox",
  "wm_class": "firefox",
  "workspace": 0,
  "monitor": 0,
  "x": 0,
  "y": 32,
  "width": 1920,
  "height": 1048
}
```

### Matching windows on restore

When restoring, each saved entry is matched against currently open windows by `wm_class` and `title`. By default
`title` must match **exactly**.

Prefix `title` with `re:` to match by regular expression instead — useful when a window's title changes (a browser
tab, an open file name):

```json
{ "title": "re:^Firefox", "wm_class": "firefox", "workspace": 0, "monitor": 0, "x": 0, "y": 0, "width": 1280, "height": 800 }
```

| `title` value | Behavior |
|---|---|
| `"Firefox — Mozilla Firefox"` | Exact match only (default) |
| `"re:^Firefox"` | Matches any title starting with "Firefox" |
| `"re:.*\\.txt — gedit"` | Matches any `.txt` file open in gedit, regardless of filename |

An invalid pattern after `re:` is logged and that entry is skipped — it won't crash the extension, it just won't
restore that window.

## D-Bus interface

Exported at `/org/gnome/Shell/Extensions/DejaVu`, interface `org.gnome.Shell.Extensions.DejaVu`:

```bash
gdbus call --session --dest org.gnome.Shell \
  --object-path /org/gnome/Shell/Extensions/DejaVu \
  --method org.gnome.Shell.Extensions.DejaVu.<method>
```

Available methods:
- `ListWindows`
- `SaveLayout`
- `RestoreLayout`
- `SaveDefaultLayout`
- `RestoreDefaultLayout`.

## Project layout

```
extension.js          Entry point: D-Bus interface, auto-save timer, settings toggles
modules/windows.js    Collects/matches/restores window state (title, position, workspace, monitor)
modules/storage.js    Reads/writes layout.json, layout_default.json and settings.json
modules/suspend.js    Listens for system resume via login1's D-Bus PrepareForSleep signal
modules/ui.js         Panel button and menu
icons/                Menu and panel icons
icon.png              Listing icon (gnome-extensions / extensions.gnome.org convention)
```

## Development

```bash
./install.sh         # install locally and enable
./pack.sh            # build a distributable zip in dist/
./release.sh         # tag a release from metadata.json's version
```

## Credits

Originally based on [lukastymo/save-my-windows](https://github.com/lukastymo/save-my-windows), since archived by its
author. Déjà Vu continues from that codebase under its own name, with its own feature set and maintenance.

## License

GNU General Public License v3 (GPL-3.0-or-later) — see [LICENSE](LICENSE).
