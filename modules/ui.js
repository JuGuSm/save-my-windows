import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {DEFAULT_LAYOUT_FILE} from './storage.js';

export class UIManager {
  constructor(extension) {
    this.extension = extension;
    this.button = null;
  }

  createPanelMenu() {
    this.button = new PanelMenu.Button(0.0, 'Save My Windows', false);

    const icon = new St.Icon({
      icon_name: 'document-save-symbolic',
      style_class: 'system-status-icon',
    });
    this.button.add_child(icon);

    const saveItem = new PopupMenu.PopupMenuItem('Save Current Layout');
    saveItem.connect('activate', () => {
      this.extension.saveLayout();
      this.notify('Layout saved.');
    });
    this.button.menu.addMenuItem(saveItem);

    const saveDefaultItem = new PopupMenu.PopupMenuItem('Save Current Layout as Default');
    saveDefaultItem.connect('activate', () => {
      this.extension.saveDefaultLayout();
      this.notify('Default layout saved.');
    });
    this.button.menu.addMenuItem(saveDefaultItem);

    this.button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const restoreItem = new PopupMenu.PopupMenuItem('Restore Last Layout');
    restoreItem.connect('activate', () => {
      this.extension.restoreLayout();
      this.notify('Layout restored.');
    });
    this.button.menu.addMenuItem(restoreItem);

    const restoreDefaultItem = new PopupMenu.PopupMenuItem('Restore Default Layout');
    restoreDefaultItem.connect('activate', () => {
      this.extension.restoreDefaultLayout();
      this.notify('Default layout restored.');
    });
    this.button.menu.addMenuItem(restoreDefaultItem);

    this.button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const editDefaultItem = new PopupMenu.PopupMenuItem('Edit Default Layout');
    editDefaultItem.connect('activate', () => {
      this._openDefaultLayoutInEditor();
    });
    this.button.menu.addMenuItem(editDefaultItem);

    this.button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const autoSaveItem = new PopupMenu.PopupSwitchMenuItem(
      'Enable automatic save',
      this.extension.autoSaveEnabled
    );
    autoSaveItem.connect('toggled', (item, state) => {
      this.extension.setAutoSaveEnabled(state);
    });
    this.button.menu.addMenuItem(autoSaveItem);

    const autoRestoreItem = new PopupMenu.PopupSwitchMenuItem(
      'Restore automatically after suspend',
      this.extension.autoRestoreAfterSuspend
    );
    autoRestoreItem.connect('toggled', (item, state) => {
      this.extension.setAutoRestoreAfterSuspend(state);
    });
    this.button.menu.addMenuItem(autoRestoreItem);

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
