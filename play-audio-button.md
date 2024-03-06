# Play Audio Button

This script creates a button that will play an audio file from a path or URL on a cameras with two way audio or Chromecast devices. This can be used to create announcements.

::: tip
For Docker installations, the audio file must be mounted into the container.
:::


```ts
class PlayAudioButton extends ScryptedDeviceBase implements OnOff, Settings {
    timeout: any;

    async turnOn() {
        const audio = this.getJSON('audio') as string;
        this.on = true;

        const ids = this.getJSON('speakers') as string[];
        for (const id of ids) {
            const speaker = systemManager.getDeviceById<MediaPlayer & Intercom & StartStop>(id);

            if (speaker.interfaces.includes(ScryptedInterface.MediaPlayer)) {
                speaker.load(audio, {
                    mimeType: 'audio/mp3',
                });
            }
            else {

                const mo = await mediaManager.createFFmpegMediaObject({
                    inputArguments: [
                        '-analyzeduration', '0',
                        '-re',
                        '-i', audio,
                    ]
                });
                
                speaker.startIntercom(mo)
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
                title: 'Audio File',
                description: 'The path or URL of the audio to play back.',
                key: 'audio',
                value: this.getJSON('audio'),
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

export default PlayAudioButton;
```