# Pan/Tilt/Zoom Button

This script creates a button that can move to a preset position on a PTZ camera. This button can then be synced to platforms like HomeKit, which do not natively support PTZ commands.

```ts
class PTZButton extends ScryptedDeviceBase implements OnOff, Settings {
    timeout: any;
    storageSettings = new StorageSettings(this, {
        ptzCamera: {
            immediate: true,
            title: 'PTZ Camera',
            type: 'device',
            deviceFilter: `interfaces.includes("${ScryptedInterface.PanTiltZoom}")`,
        },
        preset: {
            title: 'Preset',
        },
    })

    constructor(nativeId: string) {
        super(nativeId);
        // make this device a switch so it can be synced.
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
        });

        this.storageSettings.settings.preset.onGet = async () => {
            const ptzCamera: ScryptedDevice & PanTiltZoom = this.storageSettings.values.ptzCamera;
            const choices = Object.values(ptzCamera.ptzCapabilities?.presets || {});
            return {
                choices,
            }
        };
    }

    async turnOn() {
        this.on = true;
        clearTimeout(this.timeout);
        // reset the switch after a second so you can press it again!
        this.timeout = setTimeout(() => this.on = false, 1000);

        const ptzCamera: ScryptedDevice & PanTiltZoom = this.storageSettings.values.ptzCamera;
        const found = Object.entries(ptzCamera.ptzCapabilities?.presets || {}).find(([k, v]) => v === this.storageSettings.values.preset);

        await ptzCamera.ptzCommand({
            movement: PanTiltZoomMovement.Preset,
            preset: found[0],
        });
    }

    async turnOff() {
        this.on = false;
    }

    async getSettings(): Promise<Setting[]> {
        return this.storageSettings.getSettings();
    }

    async putSetting(key: string, value: SettingValue) {
        return this.storageSettings.putSetting(key, value);
    }
}

export default PTZButton;
```
