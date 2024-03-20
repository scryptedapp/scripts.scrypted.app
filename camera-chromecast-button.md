# Camera Chromecast Button

This script will create a button that can stream a camera on a Chromecast compatible device (Google Hubs, Chromecast, etc).

::: warning
Casting to Chromecast requires the Chromecast and Scrypted Cloud plugins.
:::


```ts
class ChromecastCameraButton extends ScryptedDeviceBase implements OnOff, Settings {
    timeout: any;
    readonly DEFAULT_TIMEOUT_SECS = 60;

    constructor(nativeId: string) {
        super(nativeId);
        // make this device a switch so it can be synced.
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
        });
    }

    async turnOn() {
        const ids = this.getJSON('chromecasts') as string[];
        const camera = systemManager.getDeviceById<RTCSignalingChannel>(this.getJSON('camera') as string);
        clearTimeout(this.timeout);

        const promises = ids.map(async id => {
            const chromecast = systemManager.getDeviceById<RTCSignalingClient & StartStop>(id);
            try {
                if (!chromecast) {
                    throw new Error(`Device is missing: ${id}`);
                } else {
                    await camera.startRTCSignalingSession(await chromecast.createRTCSignalingSession());
                    return;
                }
            } catch (error) {
                console.warn('Failed to start', id, chromecast?.name, error);
            }
        });

        await Promise.allSettled(promises);

        const duration = parseFloat(this.getJSON('duration') as string) || DEFAULT_TIMEOUT_SECS;
        this.timeout = setTimeout(() => this.turnOff(), duration * 1000);
        this.on = true;
    }

    async turnOff() {
        const ids = this.getJSON('chromecasts') as string[];
        const promises = ids.map(async id => {
            const chromecast = systemManager.getDeviceById<RTCSignalingClient & StartStop>(id);
            try {
                if (!chromecast) {
                    throw new Error(`Device is missing: ${id}`);
                } else {
                    await chromecast.stop();
                    return;
                }
            } catch (error) {
                console.warn('Failed to stop', id, chromecast?.name, error);
            }
        });

        await Promise.allSettled(promises);
        this.on = false;
    }

    async getSettings(): Promise<Setting[]> {
        return [
            {
                title: 'Camera',
                key: 'camera',
                value: this.getJSON('camera'),
                type: 'device',
                deviceFilter: `interfaces.includes("${ScryptedInterface.RTCSignalingChannel}")`,
            },
            {
                title: 'Chromecasts',
                key: 'chromecasts',
                value: this.getJSON('chromecasts'),
                type: 'device',
                deviceFilter: `interfaces.includes("${ScryptedInterface.RTCSignalingClient}")`,
                multiple: true,
            },
            {
                title: 'Duration',
                key: 'duration',
                value: this.getJSON('duration') || this.DEFAULT_TIMEOUT_SECS,
                type: 'number',
                description: 'Duration in seconds to stream the camera on the Chromecast.',
            }
        ]
    }

    async putSetting(key: string, value: SettingValue) {
        this.storage.setItem(key, JSON.stringify(value));
        deviceManager.onDeviceEvent(this.nativeId, ScryptedInterface.Settings, undefined);
    }

    getJSON(key: string): SettingValue {
        try {
            return JSON.parse(this.storage.getItem(key));
        } catch (e) {
            return [];
        }
    }
}

export default ChromecastCameraButton;
```
