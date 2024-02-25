# Camera Chromecast Button

This script will create a button that can stream a camera on a Chromecast compatible device (Google Hubs, Chromecast, etc).

```ts
class ChromecastCameraButton extends ScryptedDeviceBase implements OnOff, Settings {
    timeout: any;

    async turnOn() {
        const chromecast = systemManager.getDeviceById<MediaPlayer & StartStop>(this.storage.getItem('chromecast'));
        const camera = systemManager.getDeviceById<VideoCamera>(this.storage.getItem('camera'));

        this.on = true;
        // stream medium resolution because the device may not handle 4K
        const video = await camera.getVideoStream({ destination: 'medium-resolution' });
        await chromecast.load(video);
        clearTimeout(this.timeout);
        const duration = this.storage.getItem('duration');
        if (duration !== '0')
            this.timeout = setTimeout(() => this.turnOff(), (parseFloat(duration) || 60) * 1000);
    }

    async turnOff() {
        const chromecast = systemManager.getDeviceById<MediaPlayer & StartStop>(this.storage.getItem('chromecast'));
        this.on = false;
        await chromecast.stop();
    }

    async getSettings(): Promise<Setting[]> {
        return [
            {
                title: 'Camera',
                key: 'camera',
                value: this.storage.getItem('camera'),
                type: 'device',
                deviceFilter: `interfaces.includes("${ScryptedInterface.RTCSignalingChannel}")`,
            },
            {
                title: 'Chromecast',
                key: 'chromecast',
                value: this.storage.getItem('chromecast'),
                type: 'device',
                deviceFilter: `interfaces.includes("${ScryptedInterface.RTCSignalingClient}")`,
            },
            {
                title: 'Duration',
                key: 'duration',
                value: this.storage.getItem('duration') || 60,
                type: 'number',
                description: 'Duration in seconds to stream the camera on the Chromecast.',
            }
        ]
    }

    async putSetting(key: string, value: SettingValue) {
        this.storage.setItem(key, value?.toString());
        deviceManager.onDeviceEvent(this.nativeId, ScryptedInterface.Settings, undefined);
    }
}

export default ChromecastCameraButton;
```
