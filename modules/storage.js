import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const CONFIG_DIR = GLib.build_filenamev([GLib.get_user_config_dir(), 'save-my-windows-jugusm']);
const LAYOUT_FILE = GLib.build_filenamev([CONFIG_DIR, 'layout.json']);
const DEFAULT_LAYOUT_FILE = GLib.build_filenamev([CONFIG_DIR, 'layout_default.json']);
const SETTINGS_FILE = GLib.build_filenamev([CONFIG_DIR, 'settings.json']);

function ensureConfigDir() {
  if (!GLib.file_test(CONFIG_DIR, GLib.FileTest.IS_DIR)) {
    Gio.File.new_for_path(CONFIG_DIR).make_directory_with_parents(null);
  }
}

export class LayoutStorage {
  static async load(path = LAYOUT_FILE) {
    return new Promise((resolve) => {
      ensureConfigDir();
      const file = Gio.File.new_for_path(path);
      file.load_contents_async(null, (file, result) => {
        try {
          const [ok, contents] = file.load_contents_finish(result);
          if (!ok) {
            resolve(null);
            return;
          }
          const decoder = new TextDecoder();
          resolve(JSON.parse(decoder.decode(contents)));
        } catch (e) {
          resolve(null);
        }
      });
    });
  }

  static save(layout, path = LAYOUT_FILE) {
    try {
      ensureConfigDir();
      const data = JSON.stringify(layout, null, 2);
      GLib.file_set_contents(path, data);
      return true;
    } catch (e) {
      console.error(`[SaveMyWindows] Failed to save layout: ${String(e)}`);
      return false;
    }
  }

  static loadDefault() {
    return this.load(DEFAULT_LAYOUT_FILE);
  }

  static saveDefault(layout) {
    return this.save(layout, DEFAULT_LAYOUT_FILE);
  }

  // Used by "Edit Default Layout" so the file always exists before it's
  // opened in the user's text editor.
  static ensureDefaultExists() {
    ensureConfigDir();
    if (!GLib.file_test(DEFAULT_LAYOUT_FILE, GLib.FileTest.EXISTS)) {
      GLib.file_set_contents(DEFAULT_LAYOUT_FILE, '[]');
    }
  }

  static getDefaultLayoutPath() {
    return DEFAULT_LAYOUT_FILE;
  }
}

export class SettingsStorage {
  static load(callback) {
    ensureConfigDir();
    const file = Gio.File.new_for_path(SETTINGS_FILE);
    file.load_contents_async(null, (file, result) => {
      try {
        const [ok, contents] = file.load_contents_finish(result);
        if (!ok) {
          callback({});
          return;
        }
        const decoder = new TextDecoder();
        callback(JSON.parse(decoder.decode(contents)));
      } catch (e) {
        callback({});
      }
    });
  }

  static save(settings) {
    try {
      ensureConfigDir();
      const data = JSON.stringify(settings, null, 2);
      GLib.file_set_contents(SETTINGS_FILE, data);
    } catch (e) {
      console.error(`[SaveMyWindows] Failed to save settings: ${String(e)}`);
    }
  }
}
