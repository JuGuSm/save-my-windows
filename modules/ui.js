import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {DEFAULT_LAYOUT_FILE} from './storage.js';

const MODULE_PATH = import.meta.url.replace('file://', '');
const EXTENSION_DIR = GLib.path_get_dirname(GLib.path_get_dirname(MODULE_PATH));
const ICONS_DIR = GLib.build_filenamev([EXTENSION_DIR, 'icons']);

function iconPath(iconName) {
  return GLib.build_filenamev([ICONS_DIR, iconName]);
}

function loadIcon(iconName, size = 16) {
  return new St.Icon({
    gicon: Gio.icon_new_for_string(iconPath(iconName)),
    icon_size: size,
  });
}

function menuItemWithIcon(label, iconName, onActivate) {
  const item = new PopupMenu.PopupImageMenuItem(label, Gio.icon_new_for_string(iconPath(iconName)));
  item.connect('activate', onActivate);
  return item;
}

function switchItemWithIcon(label, iconName, initialState, onToggled) {
  const item = new PopupMenu.PopupSwitchMenuItem(label, initialState);
  item.insert_child_at_index(loadIcon(iconName), 0);
  item.connect('toggled', onToggled);
  return item;
}

export class UIManager {
  constructor(extension) {
    this.extension = extension;
    this.button = null;
  }

  createPanelMenu() {
    this.button = new PanelMenu.Button(0.0, 'Save My Windows', false);
    this.button.add_child(loadIcon('app-icon.png', 20));

    const saveItem = menuItemWithIcon('Save Current Layout', 'save-current.png', () => {
      this.extension.saveLayout();
      this.notify('Layout saved.');
    });
    this.button.menu.addMenuItem(saveItem);

    const restoreItem = menuItemWithIcon('Restore Last Layout', 'restore-current.png', () => {
      this.extension.restoreLayout();
      this.notify('Layout restored.');
    });
    this.button.menu.addMenuItem(restoreItem);

    this.button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const saveDefaultItem = menuItemWithIcon('Save Current Layout as Default', 'save-default.png', () => {
      this.extension.saveDefaultLayout();
      this.notify('Default layout saved.');
    });
    this.button.menu.addMenuItem(saveDefaultItem);

    const restoreDefaultItem = menuItemWithIcon('Restore Default Layout', 'restore-default.png', () => {
      this.extension.restoreDefaultLayout();
      this.notify('Default layout restored.');
    });
    this.button.menu.addMenuItem(restoreDefaultItem);

    this.button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const autoSaveItem = switchItemWithIcon(
      'Save Automatically (5m)',
      'save-auto.png',
      this.extension.autoSaveEnabled,
      (item, state) => this.extension.setAutoSaveEnabled(state)
    );
    this.button.menu.addMenuItem(autoSaveItem);

    const autoRestoreItem = switchItemWithIcon(
      'Restore Automatically (after suspend)',
      'restore-auto.png',
      this.extension.autoRestoreAfterSuspend,
      (item, state) => this.extension.setAutoRestoreAfterSuspend(state)
    );
    this.button.menu.addMenuItem(autoRestoreItem);

    this.button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const editDefaultItem = menuItemWithIcon('Edit Default Layout', 'edit-default.png', () => {
      this._openDefaultLayoutInEditor();
    });
    this.button.menu.addMenuItem(editDefaultItem);

    Main.panel.addToStatusArea('save-my-windows-jugusm', this.button);
  }

  notify(message) {
    Main.notify('Save My Windows', message);
  }

  _openDefaultLayoutInEditor() {
    try {
      if (!GLib.file_test(DEFAULT_LAYOUT_FILE, GLib.FileTest.EXISTS)) {
        GLib.file_set_contents(DEFAULT_LAYOUT_FILE, '[]');
      }

      const file = Gio.File.new_for_path(DEFAULT_LAYOUT_FILE);
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
