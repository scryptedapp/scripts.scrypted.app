# Privacy Mask Toggle

This script can be used to toggle Privacy Masks on a group of cameras that support video masking. For example, this can be used to black out interior cameras with a Home/Away automation.

```ts
class PrivacyMaskToggler extends ScryptedDeviceBase implements Settings, OnOff {
    constructor(nativeId: string) {
        super(nativeId);
        // make this device a switch so homekit can sync it.
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
        })
    }

    async getSettings(): Promise<Setting[]> {
        return [
            {
                key: 'devices',
                type: 'device',
                title: 'Devices',
                description: 'The cameras on which the privacy mode will be toggled.',
                multiple: true,
                deviceFilter: `interfaces.includes("${ScryptedInterface.VideoCameraMask}")`,
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
            const device = systemManager.getDeviceById<VideoCameraMask>(id);
            device.getPrivacyMasks().then(mask => {
                mask.masks = mask.masks?.filter(m => m.name !== 'Scrypted Privacy Mask');
                device.setPrivacyMasks(mask);
            });
        }
        this.on = false;
    }

    async turnOn(): Promise<void> {
        const ids = this.getJSON('devices') as string[];
        for (const id of ids) {
            const device = systemManager.getDeviceById<VideoCameraMask>(id);
            device.getPrivacyMasks().then(mask => {
                mask.masks = mask.masks?.filter(m => m.name === 'Scrypted Privacy Mask');
                mask.masks ||= [];
                mask.masks.push(
                    {
                        name: 'Scrypted Privacy Mask',
                        points: [[0, 0], [1, 0], [1, 1], [0, 1]]
                    }
                )
                device.setPrivacyMasks(mask);
            });
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

export default PrivacyMaskToggler;
```
