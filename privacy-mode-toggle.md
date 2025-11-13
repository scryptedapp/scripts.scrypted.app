# Privacy Mode Toggle

This script can be used to toggle Privacy Mode on a group of cameras. For example, this can be used to toggle recording interior cameras with a Home/Away automation.

```ts
class PrivacyToggler extends ScryptedDeviceBase implements Settings, OnOff {
    storageSettings = new StorageSettings(this, {
        devices: {
            type: 'device',
            title: 'Devices',
            description: 'The cameras on which the privacy mode will be toggled.',
            multiple: true,
            deviceFilter: `type === "${ScryptedDeviceType.Camera}" || type === "${ScryptedDeviceType.Doorbell}"`,
            defaultValue: [],
        },
        disable: {
            title: 'Privacy Type',
            choices: [
                'Disable Streaming',
                'Disable Recording Only',
            ],
            defaultValue: 'Disable Streaming',
        }
    });

    constructor(nativeId: string) {
        super(nativeId);
        // make this device a switch so it can be synced.
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
        });
    }

    async getSettings(): Promise<Setting[]> {
        return this.storageSettings.getSettings();
    }

    async putSetting(key: string, value: SettingValue): Promise<void> {
        return this.storageSettings.putSetting(key, value);
    }

    async turnOff(): Promise<void> {
        const ids = this.storageSettings.values.devices;
        for (const id of ids) {
            const device = systemManager.getDeviceById<Settings>(id);
            device.putSetting('recording:privacyMode', false);
            device.putSetting('prebuffer:privacyMode', false);
            device.putSetting('snapshot:privacyMode', false);

        }
        this.on = false;
    }

    async turnOn(): Promise<void> {
        const ids = this.storageSettings.values.devices;
        for (const id of ids) {
            const device = systemManager.getDeviceById<Settings>(id);
            device.putSetting('recording:privacyMode', true);
            if (this.storageSettings.values.disable !== 'Disable Recording Only') {
                device.putSetting('prebuffer:privacyMode', true);
                device.putSetting('snapshot:privacyMode', true);
            }

        }
        this.on = true;
    }
}

export default PrivacyToggler;
```
