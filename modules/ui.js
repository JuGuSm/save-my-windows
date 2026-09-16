import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {LayoutStorage} from './storage.js';

// GJS's import.meta.url is a "file://" URI string; a plain prefix strip is
// enough here since extension install paths are never percent-encoded.
const MODULE_PATH = import.meta.url.replace('file://', '');
const EXTENSION_DIR = GLib.path_get_dirname(GLib.path_get_dirname(MODULE_PATH));
const ICONS_DIR = GLib.build_filenamev([EXTENSION_DIR, 'icons']);

function iconPath(fileName) {
  return GLib.build_filenamev([ICONS_DIR, fileName]);
}

function loadIcon(fileName, size = 16) {
  return new St.Icon({
    gicon: Gio.icon_new_for_string(iconPath(fileName)),
    icon_size: size,
  });
}

export class UIManager {
  constructor(extension) {
    this.extension = extension;
    this.button = null;
  }

  createPanelMenu() {
    this.button = new PanelMenu.Button(0.0, 'Save My Windows', false);
    this.button.add_child(loadIcon('app-icon.png', 20));

    this._addActionItem('Save Current Layout', 'save-current.png', () => {
      this.extension.saveLayout();
      this.notify('Layout saved.');
    });

    this._addActionItem('Restore Last Layout', 'restore-current.png', () => {
      this.extension.restoreLayout();
      this.notify('Layout restored.');
    });

    this.button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    this._addActionItem('Save Current Layout as Default', 'save-default.png', () => {
      this.extension.saveDefaultLayout();
      this.notify('Default layout saved.');
    });

    this._addActionItem('Restore Default Layout', 'restore-default.png', () => {
      this.extension.restoreDefaultLayout();
      this.notify('Default layout restored.');
    });

    this.button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    this._addToggleItem(
      `Save Automatically (${this.extension.autoSaveIntervalMins}m)`,
      'save-auto.png',
      this.extension.autoSaveEnabled,
      (item, state) => this.extension.setAutoSaveEnabled(state)
    );

    this._addToggleItem(
      'Restore Automatically (after suspend)',
      'restore-auto.png',
      this.extension.autoRestoreAfterSuspend,
      (item, state) => this.extension.setAutoRestoreAfterSuspend(state)
    );

    this.button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    this._addActionItem('Edit Default Layout', 'edit-default.png', () => {
      this._openDefaultLayoutInEditor();
    });

    Main.panel.addToStatusArea('save-my-windows-jugusm', this.button);
  }

  _addActionItem(label, iconFileName, onActivate) {
    const item = new PopupMenu.PopupImageMenuItem(label, Gio.icon_new_for_string(iconPath(iconFileName)));
    item.connect('activate', onActivate);
    this.button.menu.addMenuItem(item);
    return item;
  }

  // PopupSwitchMenuItem has no icon-accepting constructor (unlike
  // PopupImageMenuItem above), so the icon is inserted manually as a child.
  _addToggleItem(label, iconFileName, initialState, onToggled) {
    const item = new PopupMenu.PopupSwitchMenuItem(label, initialState);
    item.insert_child_at_index(loadIcon(iconFileName), 0);
    item.connect('toggled', onToggled);
    this.button.menu.addMenuItem(item);
    return item;
  }

  notify(message) {
    Main.notify('Save My Windows', message);
  }

  _openDefaultLayoutInEditor() {
    try {
      LayoutStorage.ensureDefaultExists();
      const file = Gio.File.new_for_path(LayoutStorage.getDefaultLayoutPath());
      Gio.AppInfo.launch_default_for_uri(file.get_uri(), null);
    } catch (e) {
      console.error(`[SaveMyWindows] Failed to open default layout for editing: ${String(e)}`);
      this.notify('Failed to open default layout file.');
    }
  }

  destroy() {
    if (this.button) {
      this.button.destroy();
      this.button = null;
    }
  }
}
