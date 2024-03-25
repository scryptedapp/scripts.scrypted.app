# Play Audio Button

This script creates a button that speak a given line of text on cameras with two way audio or Chromecast devices. This can be used to create announcements.

::: tip
This script requires the Google Text To Speech Plugin.
:::

```ts
class TextToSpeechAudioButton extends ScryptedDeviceBase implements OnOff, Settings {
    timeout: any;

    constructor(nativeId: string) {
        super(nativeId);
        // make this device a switch so it can be synced.
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
        });
    }

    async turnOn() {
        const str = this.getJSON('audio') as string || 'Hello World';
        const text = await mediaManager.createMediaObject(str, 'text/plain');
        const audioBuffer = await mediaManager.convertMediaObjectToBuffer(text, 'audio/*');
        const filename = require('crypto').createHash('sha256').update(str).digest('hex');
        const tmp = require('os').tmpdir();
        const dst = require('path').join(tmp, filename + '.mp3');
        require('fs').writeFileSync(dst, audioBuffer);

        this.on = true;

        const ids = this.getJSON('speakers') as string[];
        for (const id of ids) {
            const speaker = systemManager.getDeviceById<MediaPlayer & Intercom & StartStop>(id);

            if (speaker.interfaces.includes(ScryptedInterface.MediaPlayer)) {
                speaker.load(dst, {
                    mimeType: 'audio/mpeg',
                });
            }
            else {
                const ffmpegInput: FFmpegInput = {
                    inputArguments: [
                        '-re',
                        '-i', dst,
                    ]
                };
                const mo = await mediaManager.createFFmpegMediaObject(ffmpegInput);
                speaker.startIntercom(mo);
            }
        }

        clearTimeout(this.timeout);
        const duration = this.getJSON('duration') as any;
        if (duration !== '0')
            this.timeout = setTimeout(() => this.turnOff(), (parseFloat(duration) || 10) * 1000);
    }

    async turnOff() {
        this.on = false;
        const ids = this.getJSON('speakers') as string[];
        for (const id of ids) {
            const speaker = systemManager.getDeviceById<MediaPlayer & Intercom & StartStop>(id);

            if (speaker.interfaces.includes(ScryptedInterface.MediaPlayer)) {
                await speaker.stop();
            }
            else {
                await speaker.stopIntercom();
            }
        }
    }

    async getSettings(): Promise<Setting[]> {
        return [
            {
                title: 'Audio Text',
                description: 'The path or URL of the audio to play back.',
                key: 'audio',
                value: this.getJSON('audio') || "Hello World",
            },
            {
                title: 'Speakers',
                key: 'speakers',
                value: this.getJSON('speakers') || [],
                type: 'device',
                multiple: true,
                deviceFilter: `interfaces.includes("${ScryptedInterface.Intercom}") || interfaces.includes("${ScryptedInterface.MediaPlayer}")`,
            },
            {
                title: 'Duration',
                key: 'duration',
                value: this.getJSON('duration') || 10,
                type: 'number',
                description: 'Duration in seconds to play the sound on the speaker.',
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
            return;
        }
    }
}

export default TextToSpeechAudioButton;
```
