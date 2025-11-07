# Text To Speech Button

This script creates a button that speaks a given line of text on cameras with two way audio or Chromecast devices. This can be used to create announcements.

::: tip
This script requires the Kokoro TTS (Text To Speech) or Google TTS Plugin.
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

        this.on = true;

        const ids = this.getJSON('speakers') as string[];
        for (const id of ids) {
            // media players will play back the audio file in real time
            const speaker = systemManager.getDeviceById<MediaPlayer & Intercom & StartStop>(id);

            const mo = await mediaManager.createMediaObject(audioBuffer, 'audio/mpeg');

            if (speaker.interfaces.includes(ScryptedInterface.MediaPlayer)) {
                speaker.load(mo, {
                    mimeType: 'audio/mpeg',
                });
            }
            else {
                // intercoms need an ffmpeg flag to force realtime
                const filename = require('crypto').createHash('sha256').update(str).digest('hex');
                const tmp = require('os').tmpdir();
                const dst = require('path').join(tmp, filename + '.mp3');
                require('fs').writeFileSync(dst, audioBuffer);

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
