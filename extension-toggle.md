# Extension Toggle

This script can be used automate toggling Extensions (`HomeKit`, `Scrypted NVR`, etc) on devices.

```ts
class ExtensionToggler extends ScryptedDeviceBase implements Settings, OnOff {
    async getSettings(): Promise<Setting[]> {
        return [
            {
                key: 'devices',
                type: 'device',
                title: 'Devices',
                description: 'The devices on which the extension will be toggled.',
                multiple: true,
                value: this.getJSON('devices'),
            },
            {
                key: 'extension',
                type: 'device',
                title: 'Extension',
                description: 'The extension to toggle.',
                deviceFilter: `interfaces.includes('${ScryptedInterface.MixinProvider}')`,
                value: this.getJSON('extension'),
            },
        ]
    }

    async putSetting(key: string, value: SettingValue): Promise<void> {
        this.storage.setItem(key, JSON.stringify(value));
        this.onDeviceEvent(ScryptedInterface.Settings, undefined);
    }

    async turnOff(): Promise<void> {
        const ids = this.getJSON('devices') as string[];
        const extension = this.getJSON('extension');
        for (const id of ids) {
            const device = systemManager.getDeviceById(id);
            if (!device) {
                this.console.log('Device is missing:', id);
                continue;
            }
            device.setMixins(device.mixins.filter(m => m !== extension));
        }
        this.on = false;
    }

    async turnOn(): Promise<void> {
        const ids = this.getJSON('devices') as string[];
        const extension = this.getJSON('extension') as string;
        for (const id of ids) {
            const device = systemManager.getDeviceById(id);
            if (!device) {
                this.console.log('Device is missing:', id);
                continue;
            }
            device.setMixins([...device.mixins, extension]);
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

export default ExtensionToggler;
```