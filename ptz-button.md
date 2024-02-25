# PTZ Button

This script can be used to Pan or Tilt a camera.

```ts
const ptzCamera = systemManager.getDeviceByName<PanTiltZoom>('REPLACE_WITH_YOUR_CAMERA_NAME');

let timeout: any;

class PTZButton extends ScryptedDeviceBase implements OnOff {
    constructor(nativeId: string) {
        super(nativeId);
        // make this device a switch so homekit can sync it.
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
        })
    }

    async turnOn() {
        this.on = true;
        clearTimeout(timeout);
        // reset the switch after a second so you can press it again!
        timeout = setTimeout(() => {
            this.turnOff()
        }, 1000);

        // when the button is pressed, spin 90 degrees.
        // range is between -1 (-180 degrees) and 1 (180 degrees)
        await ptzCamera.ptzCommand({
            pan: -.2,
            // to tilt instead of panning, use this
            //tilt: .2,
        });
    }

    async turnOff() {
        this.on = false;
    }
}

export default PTZButton;
```