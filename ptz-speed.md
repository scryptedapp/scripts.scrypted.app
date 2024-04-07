# Pan/Tilt/Zoom Speed

This script is an extension for PTZ cameras that allows modification of the PTZ speed.

::: tip
Use negative values like `-1` to reverse the direction of the Pan, Tilt, and Zoom
:::

```ts
class PTZSpeedMixin extends SettingsMixinDeviceBase<PanTiltZoom> implements Settings, PanTiltZoom {
    storageSettings = new StorageSettings(this, {
        panSpeed: {
            group: 'PTZ Speed',
            title: 'Pan Speed',
            description: 'The amount to scale the speed. Use negative numbers to reverse the direction.',
            type: 'number',
            defaultValue: 1,
        },
        tiltSpeed: {
            group: 'PTZ Speed',
            title: 'Tilt Speed',
            description: 'The amount to scale the speed. Use negative numbers to reverse the direction.',
            type: 'number',
            defaultValue: 1,
        },
        zoomSpeed: {
            group: 'PTZ Speed',
            title: 'Zoom Speed',
            description: 'The amount to scale the speed. Use negative numbers to reverse the direction.',
            type: 'number',
            defaultValue: 1,
        },
    });

    constructor(options: SettingsMixinDeviceOptions<PanTiltZoom>) {
        super(options)
    }

    ptzCommand(command: PanTiltZoomCommand): Promise<void> {
        if (command.pan !== undefined)
            command.pan *= this.storageSettings.values.panSpeed;
        if (command.tilt !== undefined)
            command.tilt *= this.storageSettings.values.tiltSpeed;
        if (command.zoom !== undefined)
            command.zoom *= this.storageSettings.values.zoomSpeed;
        return this.mixinDevice.ptzCommand(command);
    }

    getMixinSettings(): Promise<Setting[]> {
        return this.storageSettings.getSettings();
    }

    putMixinSetting(key: string, value: SettingValue): Promise<void> {
        return this.storageSettings.putSetting(key, value);
    }
}

export default class PTZSpeed extends ScryptedDeviceBase implements MixinProvider {
    async canMixin(type: ScryptedDeviceType, interfaces: string[]): Promise<void | string[]> {
        if (interfaces.includes(ScryptedInterface.PanTiltZoom))
            return [ScryptedInterface.PanTiltZoom, ScryptedInterface.Settings];
    }

    async getMixin(mixinDevice: any, mixinDeviceInterfaces: ScryptedInterface[], mixinDeviceState: WritableDeviceState): Promise<any> {
        return new PTZSpeedMixin({
            groupKey: 'ptzSpeed',
            group: 'PTZ Speed',
            mixinDevice,
            mixinDeviceInterfaces,
            mixinDeviceState,
            mixinProviderNativeId: this.nativeId,
        })
    }

    async releaseMixin(id: string, mixinDevice: any): Promise<void> {

    }
}
```
