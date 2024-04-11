# Notification Toggle

This script exposes a switch toggles notifications delivery from Scrypted. Common notifier plugins include `Pushover`, `Scrypted NVR`, etc. Sync this switch to your home automation platform of choice such as HomeKit or Home Assistant (using MQTT) to control notification delivery.

```ts
class NotifierToggleMixin extends MixinDeviceBase<Notifier> implements Notifier {
    constructor(public mixinProvider: NotificationToggle, options: MixinDeviceOptions<Notifier>) {
        super(options);
    }

    async sendNotification(title: string, options?: NotifierOptions, media?: string | MediaObject, icon?: string | MediaObject): Promise<void> {
        if (!this.mixinProvider.on) {
            this.console.warn('Notification suppressed by', this.mixinProvider.name, title, options);
            return;
        }
        return this.mixinDevice.sendNotification(title, options, media, icon);
    }
}

export default class NotificationToggle extends ScryptedDeviceBase implements MixinProvider, OnOff {
    constructor(nativeId: ScryptedNativeId) {
        super(nativeId);
        // make this device a switch so it can be synced.
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
            if (device.on === undefined) {
                device.on = true;
            }
        }, 1000);
    }

    async turnOff(): Promise<void> {
        this.on = false
    }
    async turnOn(): Promise<void> {
        this.on = true;
    }
    async canMixin(type: ScryptedDeviceType, interfaces: string[]): Promise<string[]> {
        if (!interfaces.includes(ScryptedInterface.Notifier))
            return;
        return [ScryptedInterface.Notifier];
    }

    async getMixin(mixinDevice: any, mixinDeviceInterfaces: ScryptedInterface[], mixinDeviceState: WritableDeviceState): Promise<any> {
        return new NotifierToggleMixin(this, {
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
