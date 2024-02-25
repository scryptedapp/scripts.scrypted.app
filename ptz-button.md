# Pan/Tilt/Zoom Button

This script creates a button that can pan, tilt, or zoom a PTZ camera. This button can then be synced to platforms like HomeKit, which do not natively support PTZ commands.

```ts
class PTZButton extends ScryptedDeviceBase implements OnOff, Settings {
    timeout: any;

    constructor(nativeId: string) {
        super(nativeId);
        // make this device a switch so homekit can sync it.
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
        })
    }

    async turnOn() {
        this.on = true;
        clearTimeout(this.timeout);
        // reset the switch after a second so you can press it again!
        this.timeout = setTimeout(() => this.on = false, 1000);

        const ptzCamera = systemManager.getDeviceById<PanTiltZoom>(this.storage.getItem('ptzCamera'));

        // when the button is pressed, spin 90 degrees.
        // range is between -1 (-180 degrees) and 1 (180 degrees)
        await ptzCamera.ptzCommand({
            [this.storage.getItem('comand') || 'pan']: parseFloat(this.storage.getItem('distance')) || .5,
        });
    }

    async turnOff() {
        this.on = false;
    }

    async getSettings(): Promise<Setting[]> {
        return [
            {
                title: 'PTZ Camera',
                key: 'ptzCamera',
                value: this.storage.getItem('ptzCamera'),
                type: 'device',
                deviceFilter: `interfaces.includes("${ScryptedInterface.PanTiltZoom}")`,
            },
            {
                title: 'Command',
                key: 'command',
                value: this.storage.getItem('command') || 'pan',
                choices: [
                    'pan',
                    'tilt',
                    'zoom',
                ],
            },
            {
                title: 'Distance',
                description: 'The distance to move. Between 0 and 1.',
                key: 'distance',
                type: 'number',
                value: this.storage.getItem('amount') || .5,
            }
        ]
    }

    async putSetting(key: string, value: SettingValue) {
        this.storage.setItem(key, value?.toString());
        deviceManager.onDeviceEvent(this.nativeId, ScryptedInterface.Settings, undefined);
    }
}

export default PTZButton;
```
