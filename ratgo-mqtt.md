# RATGO MQTT

::: warning
This script must be added through the MQTT Plugin.
:::

This MQTT Script adds a RATGO to Scrypted, which cn then be synced to other platforms like HomeKit, Alexa, and Google Home. The RATGO and this script will need to be configured to use an MQTT broker. The Scrypted MQTT plugin has a broker built in.

```ts
let obstructed = false;
let door: string;

function updateStatus() {
    if (obstructed) {
        device.entryOpen = 'jammed';
    }
    else {
        device.entryOpen = door !== 'closed';
    }
}

mqtt.subscribe({
    'status/light': value => {
        device.on = value.text !== 'off';
    },
    'status/door': value => {
        door = value.text;
        updateStatus();
    },
    'status/obstruction': value => {
        obstructed = value.text !== 'clear';
        updateStatus();
    }
});

export default {
    turnOff: () => mqtt.publish('command/light', 'off', {
        retain: false,
    }),
    turnOn: () => mqtt.publish('command/light', 'on', {
        retain: false,
    }),
    openEntry: () => mqtt.publish('command/door', 'open'),
    closeEntry: () => mqtt.publish('command/door', 'close'),
} as OnOff & Entry & EntrySensor;

mqtt.handleTypes(ScryptedInterface.EntrySensor);

systemManager.getDeviceById(device.id).setType(ScryptedDeviceType.Garage);
```
