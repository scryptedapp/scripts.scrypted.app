# Discord Notifications

This script can be used to intercept and modify image notifications using an OpenAI (or compatible server) vision model.


```ts
function createMessageTemplate(systemPrompt: string, model: string, imageUrl: string, metadata: any) {
    const schema = "The response must be in JSON format with a message 'title', 'subtitle', and 'body'. The title and subtitle must not be more than 24 characters each. The body must not be more than 130 characters."
    return {
        model,
        messages: [
            {
                role: "system",
                content: systemPrompt + ' ' + schema,
            },
            {function createMessageTemplate(systemPrompt: string, model: string, imageUrl: string, metadata: any) {
    const schema = "The response must be in JSON format with a message 'title', 'subtitle', and 'body'. The title and subtitle must not be more than 24 characters each. The body must not be more than 130 characters."
    return {
        model,
        messages: [
            {
                role: "system",
                content: systemPrompt + ' ' + schema,
            },
            {
                role: "user",
                content: [
                    {
                        type: 'text',
                        text: `Original notification metadata: ${metadata ? JSON.stringify(metadata) : 'none available'}`,
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrl,
                            // url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
                            // url: "data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "notification_response",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string"
                        },
                        subtitle: {
                            type: "string"
                        },
                        body: {
                            type: "string"
                        }
                    },
                    required: ["title", "subtitle", "body"],
                    additionalProperties: false
                }
            }
        }
    }
}

class OpenAINotifier extends MixinDeviceBase<Notifier> implements Notifier {
    openaiProvider: OpenAIMixinProvider;

    async sendNotification(title: string, options?: NotifierOptions, media?: string | MediaObject, icon?: string | MediaObject) {
        if (!media)
            return this.mixinDevice.sendNotification(title, options, media, icon);

        let imageUrl: string;
        if (typeof media === 'string') {
            imageUrl = media;
        }
        else {
            const buffer = await mediaManager.convertMediaObjectToBuffer(media, 'image/jpeg');
            const b64 = buffer.toString('base64');
            imageUrl = `data:image/jpeg;base64,${b64}`;
        }

        this.console.log(options);

        const messageTemplate = createMessageTemplate(
            this.openaiProvider.storageSettings.values.systemPrompt,
            this.openaiProvider.storageSettings.values.model,
            imageUrl,
            {
                title,
                ...options,
            },
        );

        try {

            const response = await fetch(this.openaiProvider.storageSettings.values.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openaiProvider.storageSettings.values.apiKey}`
                },
                body: JSON.stringify(messageTemplate),
            });
            const data = await response.json();
            const content = data.choices[0].message.content;
            const json = JSON.parse(content);
            this.console.log(json);
            const { title, subtitle, body } = json;

            if (typeof title !== 'string' || typeof subtitle !== 'string' || typeof body !== 'string')
                throw new Error('title or body was not string');

            options ||= {};
            options.body = body;
            options.subtitle = subtitle;

            return await this.mixinDevice.sendNotification(title, options, media, icon);
        }
        catch (e) {
            this.console.warn('OpenAI API call failed. Falling back to standard notification', e);
            return await this.mixinDevice.sendNotification(title, options, media, icon);
        }
    }
}

export default class OpenAIMixinProvider extends ScryptedDeviceBase implements MixinProvider {
    storageSettings = new StorageSettings(this, {
        apiKey: {
            title: 'API Key',
            description: 'The API Key or token.',
        },
        apiUrl: {
            title: 'API URL',
            description: 'The API URL of the OpenAI compatible server.',
            defaultValue: 'https://api.openai.com/v1/chat/completions',
        },
        model: {
            title: 'Model',
            description: 'The model to use to generate the image description. Must be vision capable.',
            defaultValue: 'gpt-4o',
        },
        systemPrompt: {
            title: 'System Prompt',
            type: 'textarea',
            description: 'The system prompt used to generate the notification.',
            defaultValue: 'Create a notification suitable description of the image provided by the user. Describe the people, animals, or vehicles in the image. Do not describe scenery or static objects. The original notification metadata may be provided and can be used to provide additional context for the new notification, but should not be used verbatim.',
        }
    });


    getSettings() {
        return this.storageSettings.getSettings();
    }

    putSetting(key: string, value: SettingValue): Promise<void> {
        return this.storageSettings.putSetting(key, value);
    }


    async canMixin(type: ScryptedDeviceType, interfaces: string[]) {
        if (type === ScryptedDeviceType.Notifier && interfaces?.includes(ScryptedInterface.Notifier))
            return [ScryptedInterface.Notifier];
    }

    async getMixin(mixinDevice: any, mixinDeviceInterfaces: ScryptedInterface[], mixinDeviceState: WritableDeviceState): Promise<any> {
        const ret = new OpenAINotifier({
            mixinDevice,
            mixinDeviceInterfaces,
            mixinDeviceState,
            mixinProviderNativeId: this.nativeId,
        });
        ret.openaiProvider = this;
        return ret;
    }

    async releaseMixin(id: string, mixinDevice: any): Promise<void> {
    }
}
```