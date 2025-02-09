# Camera Sensor Overlay

The [OSD Manager](https://github.com/apocaliss92/scrypted-osd-manager) plugin works with the [Home Assistant](https://github.com/scryptedapp/homeassistant) plugin to display sensor data, such as temperature, humidity, and locks, directly on a camera’s on-screen display.

In the `Home Assistant` plugin, select the entities you’d like to add as devices to Scrypted  (e.g., `sensor.living_room_temperature`). Then, enable the `OSD Manager` plugin on the desired camera and set the 'Overlay Type' to Device

Once configured, sensor values update automatically, providing a live feed of environmental conditions directly on the camera’s display.

# Temperature Overlay

This script can display the current outside temperature on cameras that support on screen overlays. Enable and position the overlay on the camera's web portal. Then use this script to select and update the overlay with the current temperature.

::: tip
The overlay must first be enabled in the cameras's web potral before the overlay. Then select the camera in the script and `Save` to see the enabled overlays in the `Log`. Then enter the desired overlay id into the scripts's Settings. If the camera is not configured first, no overlay ids will be logged by the script.
:::


```ts
export default class CameraTemperatureOverlay extends ScryptedDeviceBase implements Settings {
    storageSettings = new StorageSettings(this, {
        temperatureUnit: {
            title: 'Temperature Unit',
            choices: ['C', 'F'],
            defaultValue: 'C',
            onPut: () => this.refreshTemperature(),
        },
        linkedPositionSensor: {
            title: 'Linked PositionSensor',
            description: 'A PositionSensor to provide geolocation data.',
            value: this.storage.getItem('linkedPositionSensor'),
            deviceFilter: `interfaces.includes('${ScryptedInterface.PositionSensor}')`,
            type: 'device',
            onPut: () => {
                this.forecastUrl = undefined;
                this.refreshTemperature();
            },
        },
        latitude: {
            type: 'number',
            title: 'Latitude',
            description: 'Takes precedence over the linked PositionSensor.',
            onPut: () => {
                this.forecastUrl = undefined;
                this.refreshTemperature();
            },
        },
        longitude: {
            type: 'number',
            title: 'Longitude',
            description: 'Takes precedence over the linked PositionSensor.',
            onPut: () => {
                this.forecastUrl = undefined;
                this.refreshTemperature();
            },
        },
        cameras: {
            title: 'Cameras',
            type: 'device',
            deviceFilter: d => {
                return d.interfaces.includes(ScryptedInterface.VideoTextOverlays);
            },
            multiple: true,
            onPut: () => this.refreshTemperature(),
        },
        overlayIds: {
            title: 'Overlay IDs',
            description: 'The overlay ids to display the temperature. The camera overlays will be searched in order for a match. If there is no match, available overlay ids will be printed to the Log.',
            multiple: true,
            choices: [],
            combobox: true,
            defaultValue: [],
            onPut: () => this.refreshTemperature(),
        },
    });
    forecastUrl: Promise<string>;
    overlayIds = new Map<string, Promise<string>>();

    constructor(nativeId: ScryptedNativeId) {
        super(nativeId);

        this.refreshTemperature();
        setInterval(() => this.refreshTemperature(), 5 * 60 * 1000);
    }

    async getSettings() {
        return this.storageSettings.getSettings();
    }

    async putSetting(key: string, value: SettingValue) {
        return this.storageSettings.putSetting(key, value);
    }

    async refreshTemperature() {
        if (
            (
                !this.storageSettings.values.linkedPositionSensor && (!this.storageSettings.values.latitude || !this.storageSettings.values.longitude)
            )
            || !this.storageSettings.values.cameras.length
        ) {
            this.console.warn('Camera temperature overlay is not configured');
            return;
        }

        const cameras = (this.storageSettings.values.cameras as string[])
            .map(id => systemManager.getDeviceById<VideoTextOverlays>(id));

        if (!cameras.length) {
            this.console.warn('Camera temperature overlay is not configured with valid cameras');
            return;
        }

        if (!this.forecastUrl) {
            this.forecastUrl = (async () => {
                const positionSensor = this.storageSettings.values.linkedPositionSensor as ScryptedDevice & PositionSensor;
                const latitude = this.storageSettings.values.latitude || positionSensor.position.latitude;
                const longitude = this.storageSettings.values.longitude || positionSensor.position.longitude;
                const url = new URL(`https://api.weather.gov/points/${latitude},${longitude}`);
                const response = await fetch(url);
                const json = await response.json();
                return json.properties.forecastGridData;
            })()
                .catch(e => {
                    this.console.error('forecast url error', e);
                    this.forecastUrl = undefined;
                });
        }

        const forecastUrl = await this.forecastUrl;
        const response = await fetch(forecastUrl);
        const json = await response.json();
        let celsiusValue: number = json.properties.temperature.values[0].value;
        let displayValue: string;
        if (this.storageSettings.values.temperatureUnit === 'F') {
            displayValue = Math.round((celsiusValue * (9 / 5))) + 32 + 'F';
        }
        else {
            displayValue = Math.round(celsiusValue * 10) / 10 + 'C';
        }

        cameras.forEach(async camera => {
            let overlayId = this.overlayIds.get(camera.id);
            if (!overlayId) {
                overlayId = (async () => {
                    const overlays = await camera.getVideoTextOverlays();
                    for (const check of this.storageSettings.values.overlayIds) {
                        if (overlays[check])
                            return check;
                    }
                    this.console.warn(camera.name, 'overlay id not found. Available ids:', overlays);
                    throw new Error('overlay id not found.');
                })()
                    .catch(e => {
                        this.console.warn('Overlay ID error for', camera.name, e);
                        this.overlayIds.delete(camera.id);
                    });
                this.overlayIds.set(camera.id, overlayId);
            }

            const oid = await overlayId;
            camera.setVideoTextOverlay(oid, {
                text: displayValue,
            });
        });
    }
}
```
