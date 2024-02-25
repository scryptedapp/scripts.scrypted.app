# Notification Filter - Device Linked

This script configures a toggle device (switch or lock) and a list of cameras. If a notification is going to be sent about one of the cameras and the toggle device is locked/on then the notification is discarded.

This allows for disabling notiications for all users for events based on the toggle device status. Useful to keep logging events but not send notifications. That way you have the events and go easily go back to them but they aren't going to contribute to notification fatigue.

Example would be a inside garage camera. You want the notifications when you aren't home but not when you are. You also don't want to annoy the spouse so want the notifications filtered for them at the same time. But since the events are logged you can easily go back and refer to see that yes someone left the door open and your dog came in and left a gift now you can point the finger at yourself for leaving the door open. :)

```ts
class NotifierFilterMixin extends MixinDeviceBase<Notifier> implements Notifier {
    cameraDeviceNames: string[];
    toggleDevice: ScryptedDevice;

    constructor(options: MixinDeviceOptions<Notifier>, toggleDeviceId: string, cameraDeviceIds: string[]) {
        super(options);

        // ensure normal flow happens if custom settings are bad
        try {
            this.toggleDevice = systemManager.getDeviceById(toggleDeviceId) as ScryptedDevice;
            this.cameraDeviceNames = [];
            for (const id of cameraDeviceIds) {
                this.cameraDeviceNames.push(systemManager.getDeviceById(id).providedName as string);
            }
        } catch (e) {
            console.log(e);
        }
    }

    async sendNotification(title: string, options?: NotifierOptions, media?: string | MediaObject, icon?: string | MediaObject): Promise<void> {
        // ensure normal flow happens if custom settings are bad
        try {
            const isFilteredCamera = this.cameraDeviceNames.includes(title);
            switch (this.toggleDevice.type) {
                case 'Switch':
                    const onoff = this.toggleDevice as (ScryptedDevice & OnOff);
                    if (onoff.on && isFilteredCamera) 
                        return;
                    break;
                case 'Lock':
                    const lock = this.toggleDevice as (ScryptedDevice & Lock);
                    if (lock.lockState === "Unlocked" && isFilteredCamera)
                        return;
                    break;
            }
        } catch (e) {}
        return this.mixinDevice.sendNotification(title, options, media, icon);
    }
}

export default class NotificationFilter extends ScryptedDeviceBase implements MixinProvider, Settings { 
    async getSettings(): Promise<Setting[]> {
        const cameras = this.getJSON('cameras') as string[];
        let settings = [
            {
                key: 'toggleDevice',
                type: 'device',
                title: 'Toggle Device',
                description: 'The lock/switch that will toggle notifications.',
                multiple: false,
                deviceFilter: `type === \"${ScryptedDeviceType.Lock}\" || type === \"${ScryptedDeviceType.Switch}\"`,
                value: this.getJSON('toggleDevice'),
            },
            {
                key: 'cameras',
                type: 'device',
                title: 'Cameras',
                description: 'The cameras on which the notifications will be toggled.',
                multiple: true,
                deviceFilter: `type === \"${ScryptedDeviceType.Camera}\" || type === \"${ScryptedDeviceType.Doorbell}\"`,
                value: cameras,
            },
        ];

        return settings as Setting[];
    }

    async putSetting(key: string, value: SettingValue): Promise<void> {
        this.storage.setItem(key, JSON.stringify(value));
        this.onDeviceEvent(ScryptedInterface.Settings, undefined);
    }

    getJSON(key: string): SettingValue {
        try {
            return JSON.parse(this.storage.getItem(key));
        }
        catch (e) {
            return [];
        }
    }

    async canMixin(type: ScryptedDeviceType, interfaces: string[]): Promise<string[]> {
        if (!interfaces.includes(ScryptedInterface.Notifier))
            return;
        return [ScryptedInterface.Notifier];
    }
    

    async getMixin(mixinDevice: any, mixinDeviceInterfaces: ScryptedInterface[], mixinDeviceState: DeviceState): Promise<any> {
        return new NotifierFilterMixin({
                mixinDevice,
                mixinDeviceInterfaces,
                mixinDeviceState,
                mixinProviderNativeId: this.nativeId,
            },
            this.getJSON('toggleDevice') as string,
            this.getJSON('cameras') as string[],
        );
    }

    async releaseMixin(id: string, mixinDevice: any): Promise<void> {
    }
}
```
