# Scrypted Scripts

Scripts are a lightweight user editable way to add powerful automations, devices, and features to Scrypted. The sidebar contains a variety of popular scripts.

## Script Installation

Scripts can be added to a Scrypted server by visiting the Management Console and clicking the `Scripts` sidebar item, then clicking `Add New`. Select `Empty Script` when prompted. Then replace the contents with the code found on this site and press the `Save` icon.

::: tip
The same script can be added multiple times!
:::

## Script Settings

Scripts can be made configurable, for example, to select and deselect cameras that form part of a script.  These settings will become visible in the `General` section of the `Settings` panel.  If settings are added or changed, use the `Save` button followed by the `Run` button above the script.  This will trigger an update of the device settings.

For an example, see `getSettings` and `putSettings` in [Extension Toggle](./extension-toggle.md).

## Script Log

To see output from a script in the device `Log` panel, use `this.console` or just `console` within the script.  See the [Minimal Switch](./minimal-switch.md) example for more details.
