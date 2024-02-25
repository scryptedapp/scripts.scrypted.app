# Scrypted NVR Privacy Mode Toggle

This script can be used to toggle Privacy Mode on a group of cameras that are recording with Scrypted NVR. For example, this can be used to toggle recording interior cameras with a Home/Away automation.

```ts
class PrivacyToggler extends ScryptedDeviceBase implements Settings, OnOff {
    async getSettings(): Promise<Setting[]> {
        return [
            {
                key: 'devices',
                type: 'device',
                title: 'Devices',
                description: 'The cameras on which the privacy mode will be toggled.',
                multiple: true,
                deviceFilter: `type === "${ScryptedDeviceType.Camera}" || type === "${ScryptedDeviceType.Doorbell}"`,
                value: this.getJSON('devices'),
            },
        ]
    }

    async putSetting(key: string, value: SettingValue): Promise<void> {
        this.storage.setItem(key, JSON.stringify(value));
        this.onDeviceEvent(ScryptedInterface.Settings, undefined);
    }

    async turnOff(): Promise<void> {
        const ids = this.getJSON('devices') as string[];
        for (const id of ids) {
            const device = systemManager.getDeviceById<Settings>(id);
            device.putSetting('recording:privacyMode', false);
        }
        this.on = false;
    }

    async turnOn(): Promise<void> {
        const ids = this.getJSON('devices') as string[];
        for (const id of ids) {
            const device = systemManager.getDeviceById<Settings>(id);
            device.putSetting('recording:privacyMode', true);
        }
        this.on = true;
    }

    getJSON(key: string): SettingValue {
        try {
            return JSON.parse(this.storage.getItem(key));
        }
        catch (e) {
            return [];
        }
    }
}

export default PrivacyToggler;
```