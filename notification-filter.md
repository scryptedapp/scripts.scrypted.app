# Notification Filter

This script can be used to intercept and then modify/filter notifications sent out from Scrypted. Common notifier plugins include `Pushover`, `Scrypted NVR`, etc.

```ts
class NotifierFilterMixin extends MixinDeviceBase<Notifier> implements Notifier {
    constructor(options: MixinDeviceOptions<Notifier>) {
        super(options);
    }

    async sendNotification(title: string, options?: NotifierOptions, media?: string | MediaObject, icon?: string | MediaObject): Promise<void> {
        const lock = systemManager.getDeviceByName<Lock>("Front Door Lock");
        // don't send notifications from the front door camera if the front door is unlocked
        if (lock.lockState === "Unlocked" && title.includes('Front Door'))
            return;
        return this.mixinDevice.sendNotification(title, options, media, icon);
    }
}

export default class NotificationFilter extends ScryptedDeviceBase implements MixinProvider {
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
        });
    }

    async releaseMixin(id: string, mixinDevice: any): Promise<void> {
    }
}
```
