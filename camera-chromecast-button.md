# Camera Chromecast Button

This script will create a button that can stream a camera on a Chromecast compatible device (Google Hubs, Chromecast, etc).

::: warning
Casting to Chromecast requires the Chromecast and Scrypted Cloud plugins.
:::


```ts
class ChromecastCameraButton extends ScryptedDeviceBase implements OnOff, Settings {
    timeout: any;
    readonly DEFAULT_TIMEOUT_SECS = 60;

    async turnOn() {
        const ids = this.getJSON('chromecasts') as string[];
        const camera = systemManager.getDeviceById<RTCSignalingChannel>(this.getJSON('camera') as string);

        for (const id of ids) {
            const chromecast = systemManager.getDeviceById<RTCSignalingClient & StartStop>(id);
            if (!chromecast) {
                this.console.log('Device is missing:', id);
                continue;
            }

            await camera.startRTCSignalingSession(await chromecast.createRTCSignalingSession());
        }

        this.on = true;

        clearTimeout(this.timeout);
        const duration = this.getJSON('duration') as string;
        if (duration !== '0') {
            this.timeout = setTimeout(() => this.turnOff(), (parseFloat(duration) || this.DEFAULT_TIMEOUT_SECS) * 1000);
        }
    }

    async turnOff() {
        const ids = this.getJSON('chromecasts') as string[];

        for (const id of ids) {
            const chromecast = systemManager.getDeviceById<RTCSignalingClient & StartStop>(id);
            if (!chromecast) {
                this.console.log('Device is missing:', id);
                continue;
            }

            await chromecast.stop();
        }

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
