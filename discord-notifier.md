# Discord Notifications

This script can be used to deliver notifications to Discord.

The script must be configured with the Discord Webhook URL which can be created in the Channel's Integration settings.

```ts
export default class DiscordWebhook extends ScryptedDeviceBase implements Notifier, Settings {
    constructor(nativeId: ScryptedNativeId) {
        super(nativeId);
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Notifier);
        });
    }
    async getSettings(): Promise<Setting[]> {
        return [
            {
                key: 'webhook',
                title: 'Webhook URL',
                description: 'The Webhook URL created in the Channel\'s Integration list.',
                value: this.storage.getItem('webhook'),
            }
        ]
    }

    async putSetting(key: any, value: any): Promise<void> {
        this.storage.setItem(key, value.toString());
        this.onDeviceEvent(ScryptedInterface.Settings, undefined);
    }

    async sendNotification(title: string, options?: NotifierOptions, media?: string | MediaObject, icon?: string | MediaObject): Promise<void> {
        const webhook = this.storage.getItem('webhook');
        if (!webhook) {
            this.console.error('webhook is not configured');
            throw new Error('webhook is not configured');
        }

        let image: string;
        const formData = new FormData();

        try {
            let m: MediaObject;
            if (typeof media === 'string') {
                if (media.startsWith('http')) {
                    image = media;
                    m = undefined;
                }
                else {
                    m = await sdk.mediaManager.createMediaObjectFromUrl(media);
                }
            }
            else {
                m = media;
            }

            if (m) {
                const buffer = await mediaManager.convertMediaObjectToBuffer(m, 'image/jpeg');
                formData.set('image.jpg', new Blob([buffer], {type: 'image/jpeg'}), 'image.jpg');
                image = 'attachment://image.jpg"';
                this.console.log('blobber');
            }
        }
        catch (e) {
            this.console.warn('error creating image url. sending without image.', e);
            image = undefined;
        }

        const payload = {
            content: options?.body || title,
            embeds: !image ? undefined : [
                {
                    image: {
                        url: image,
                    },
                }
            ]
        };

        this.console.log(payload);

        formData.set('payload_json', JSON.stringify(payload));

        const result = await fetch(webhook, {
            method: 'POST',
            headers: {
                // "Content-Type": "multipart/form-data",
            },
            body: formData,
        });

        console.log(result.status);
    }
}

```
