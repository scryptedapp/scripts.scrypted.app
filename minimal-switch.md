# Minimal Switch

This script provides a minimal example of a script with a switch and console logging.

```ts
export default class ConsoleDemo extends ScryptedDeviceBase implements OnOff {
    constructor(nativeId: ScryptedNativeId) {
        super(nativeId);
        // make this device a switch so it can be synced.
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
            if (device.on === undefined) {
                device.on = false;
            }
        }, 1000);
    }
    
    async turnOff(): Promise<void> {
        this.on = false;
        this.console.info("The switch is Off");
    }
    async turnOn(): Promise<void> {
        this.on = true;
        this.console.info("The switch is On");
    }    
}
```
