# Face/Fingerprint Recognition Unlock

This script/process allows a face or fingerprint detection to unlock a door.

## Smart Motion Sensor

1. Create a `Smart Motion Sensor` inside the Video Analysis Plugin.
2. When creating the `Smart Motion Sensor` select your doorbell camera as the `Object Detector`.
3. Set the `Detection` type to `face` ([Scrypted NVR](https://docs.scrypted.app/scrypted-nvr/)) or `fingerprintIdentified` (Unifi Protect).
4. Set the `Object Detection Timeout` to `15` to reset the automation after 15 seconds.
5. In the `Recognition` settings on the `Smart Motion Sensor`: 
  * If recognizing faces, enter the name of the person(s) to match. These names must match the names labelled within Scrypted NVR.
  * If recognizing fingerprints, any known fingerprint will trigger the sensor. Specific fingerprints can be filtered by entering the `Unifi` user UUID which is captured in the logs for the sensor.
6. Sync this new `Smart Motion Sensor` with `HomeKit` or `Home Assistant`.
7. Set up an automation in `HomeKit` or `Home Assistant` to unlock the door when the sensor detects motion.

## Confirmation Chime Automation

This step is optional/recommended as it provides the person positive audio feedback when recognized.

1. Create a new `Automation` in Scrypted.
2. Set the `Trigger` to the new `Smart Motion Sensor`.
3. Set the `Trigger Condition` to `eventData === true` so it only triggers when motion detection starts.
4. Create an `Action` of type `Script`, replacing the `Doorbell` device name with the one matching your doorbell:

```ts
const doorbell = systemManager.getDeviceByName<Intercom>('Doorbell');
const mo = await mediaManager.createFFmpegMediaObject({
    inputArguments: [
        '-re',
        '-i',
        'https://cdn.pixabay.com/download/audio/2023/06/01/audio_77fe776ce5.mp3?filename=simple-notification-152054.mp3',
    ]
});
await doorbell.startIntercom(mo);
```
