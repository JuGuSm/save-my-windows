import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {LayoutStorage, SettingsStorage} from './modules/storage.js';
import {WindowCollector, WindowRestorer} from './modules/windows.js';
import {SuspendMonitor} from './modules/suspend.js';
import {UIManager} from './modules/ui.js';

const EXTENSION_NAME = "DejaVu";
const AUTO_SAVE_INTERVAL_MINS = 5;

export default class DejaVuExtension {
  constructor() {
    this.dbusImpl = null;
    this.autoSaveTimeoutId = null;
    this.ui = null;
    this.suspendMonitor = null;
    this.autoRestoreAfterSuspend = false;
    this.autoSaveEnabled = true;
    this.autoSaveIntervalMins = AUTO_SAVE_INTERVAL_MINS;

    // Method names below must match the D-Bus interface method names
    // declared here, so the D-Bus-facing methods stay PascalCase while
    // everything else in this class uses camelCase.
    this.xml = `
      <node>
        <interface name="org.gnome.Shell.Extensions.DejaVu">
          <method name="ListWindows">
            <arg type="s" name="result" direction="out"/>
          </method>
          <method name="SaveLayout">
            <arg type="s" name="result" direction="out"/>
          </method>
          <method name="RestoreLayout">
            <arg type="s" name="result" direction="out"/>
          </method>
          <method name="SaveDefaultLayout">
            <arg type="s" name="result" direction="out"/>
          </method>
          <method name="RestoreDefaultLayout">
            <arg type="s" name="result" direction="out"/>
          </method>
        </interface>
      </node>`;
  }

  // --- D-Bus interface (thin wrappers around the methods below) ---

  ListWindows() {
    return JSON.stringify(WindowCollector.collect());
  }

  SaveLayout() {
    this.saveLayout();
    return 'Layout saved';
  }

  RestoreLayout() {
    this.restoreLayout();
    return 'Restore started';
  }

  SaveDefaultLayout() {
    this.saveDefaultLayout();
    return 'Default layout saved';
  }

  RestoreDefaultLayout() {
    this.restoreDefaultLayout();
    return 'Restore default started';
  }

  // --- Save/restore, shared by the D-Bus interface, the panel menu and
  // the post-suspend hook ---

  saveLayout() {
    LayoutStorage.save(WindowCollector.collect());
  }

  saveDefaultLayout() {
    LayoutStorage.saveDefault(WindowCollector.collect());
  }

  async restoreLayout() {
    await this._restore(() => LayoutStorage.load(), 'No saved layout found', '');
  }

  async restoreDefaultLayout() {
    await this._restore(() => LayoutStorage.loadDefault(), 'No default layout found', ' from default layout');
  }

  async _restore(loadLayout, notFoundMessage, restoredSuffix) {
    try {
      const savedLayout = await loadLayout();
      if (!savedLayout) {
        this.ui.notify(notFoundMessage);
        return;
      }

      const count = await WindowRestorer.restore(savedLayout);
      this.ui.notify(`Restored ${count} windows${restoredSuffix}`);
    } catch (error) {
      console.error(`[${EXTENSION_NAME}] Restore failed: ${error}`);
      this.ui.notify(`Restore failed: ${error.message}`);
    }
  }

  // --- Settings toggles, called from the panel menu ---

  setAutoSaveEnabled(enabled) {
    this.autoSaveEnabled = enabled;
    this._updateSetting('autoSaveEnabled', enabled);

    if (enabled) {
      this._startAutoSave();
      this.ui.notify('Automatic save enabled.');
    } else {
      this._stopAutoSave();
      this.ui.notify('Automatic save disabled.');
    }
  }

  setAutoRestoreAfterSuspend(enabled) {
    this.autoRestoreAfterSuspend = enabled;
    this._updateSetting('autoRestoreAfterSuspend', enabled);

    if (enabled) {
      this.suspendMonitor.start();
      this.ui.notify('Auto-restore after suspend enabled.');
    } else {
      this.suspendMonitor.stop();
      this.ui.notify('Auto-restore after suspend disabled.');
    }
  }

  _updateSetting(key, value) {
    SettingsStorage.load((settings) => {
      settings[key] = value;
      SettingsStorage.save(settings);
    });
  }

  _startAutoSave() {
    if (this.autoSaveTimeoutId) {
      GLib.source_remove(this.autoSaveTimeoutId);
    }

    this.autoSaveTimeoutId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      AUTO_SAVE_INTERVAL_MINS * 60,
      () => {
        this.saveLayout();
        console.log(`[${EXTENSION_NAME}] Auto-saved layout`);
        return GLib.SOURCE_CONTINUE;
      }
    );
  }

  _stopAutoSave() {
    if (this.autoSaveTimeoutId) {
      GLib.source_remove(this.autoSaveTimeoutId);
      this.autoSaveTimeoutId = null;
    }
  }

  _loadAutoRestoreSetting() {
    SettingsStorage.load((settings) => {
      this.autoRestoreAfterSuspend = settings.autoRestoreAfterSuspend || false;
      if (this.autoRestoreAfterSuspend) {
        this.suspendMonitor.start();
      }
    });
  }

  _loadAutoSaveSetting() {
    SettingsStorage.load((settings) => {
      this.autoSaveEnabled = settings.autoSaveEnabled ?? true;
      if (this.autoSaveEnabled) {
        this._startAutoSave();
      }
    });
  }

  enable() {
    const ifaceInfo = Gio.DBusNodeInfo.new_for_xml(this.xml).interfaces[0];
    this.dbusImpl = Gio.DBusExportedObject.wrapJSObject(ifaceInfo, this);
    this.dbusImpl.export(Gio.DBus.session, `/org/gnome/Shell/Extensions/${EXTENSION_NAME}`);

    this.ui = new UIManager(this);
    this.ui.createPanelMenu();

    this.suspendMonitor = new SuspendMonitor(() => {
      this.restoreLayout();
      this.ui.notify('Layout restored after suspend.');
    });

    this._loadAutoRestoreSetting();
    this._loadAutoSaveSetting();
  }

  disable() {
    if (this.dbusImpl) {
      this.dbusImpl.unexport();
      this.dbusImpl = null;
    }

    if (this.ui) {
      this.ui.destroy();
      this.ui = null;
    }

    if (this.suspendMonitor) {
      this.suspendMonitor.stop();
      this.suspendMonitor = null;
    }

    this._stopAutoSave();
  }
}
