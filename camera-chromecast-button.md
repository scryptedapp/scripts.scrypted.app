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
        clearTimeout(this.timeout);

        try {
            await new Promise<void>((resolve, reject) => {
                const total = ids.length;
                let completed = 0;
                if (total === 0) resolve();

                ids.forEach(async (id) => {
                    try {
                        const chromecast = systemManager.getDeviceById<RTCSignalingClient & StartStop>(id);
                        if (!chromecast) {
                            this.console.log('Device is missing:', id);
                        } else {
                            await camera.startRTCSignalingSession(await chromecast.createRTCSignalingSession());
                        }
                    } catch (error) {
                        reject(new Error(`Error starting Camera (${camera.id}) or Chromecast (${id}): ${error.message}`));
                    } finally {
                        completed++;
                        if (completed === total) {
                            resolve();
                        }
                    }
                });
            });

            let duration = parseFloat(this.getJSON('duration') as string);
            if (isNaN(duration)) {
                duration = this.DEFAULT_TIMEOUT_SECS;
            }

            this.timeout = setTimeout(() => this.turnOff(), duration * 1000);
            this.on = true;
        } catch (error) {
            this.console.error('turnOn error:', error);
        }
    }

    async turnOff() {
        const ids = this.getJSON('chromecasts') as string[];

        try {
            await new Promise<void>((resolve, reject) => {
                const total = ids.length;
                let completed = 0;
                if (total === 0) resolve();

                ids.forEach(async (id) => {
                    try {
                        const chromecast = systemManager.getDeviceById<RTCSignalingClient & StartStop>(id);
                        if (!chromecast) {
                            this.console.log('Device is missing:', id);
                        } else {
                            await chromecast.stop();
                        }
                    } catch (error) {
                        reject(new Error(`Error stopping Chromecast (${id}): ${error.message}`));
                    } finally {
                        completed++;
                        if (completed === total) {
                            resolve();
                        }
                    }
                });
            });

            this.on = false;
        } catch (error) {
            this.console.error('turnOff error:', error);
        }
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
