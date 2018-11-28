import { BaseCommand } from "./base";

export class NameCommand extends BaseCommand
{
    constructor() {
        super();

        this.name = 'name';
        this.patterns = [
            /^([A-Za-z0-9_-]+)\s+([A-Za-z0-9_-]+)$/
        ];
    }

    help() {
        return [
            'name old_device_name new_device_name',
            'Device names can have letters, numbers, dashes, and underscores.',
        ].join('\n');
    }

    run(tf, args) {
        let oldName = args[1];
        let newName = args[2];

        if ( tf.devices.activeRegistry[newName] ) {
            return [false, 'A device with the new name already exists.'];
        }

        if ( !tf.devices.activeRegistry[oldName] ) {
            return [false, 'No device with that name exists.'];
        }

        tf.devices.rename(oldName, newName);

        return [true, `Device {!b}${oldName}{/} was renamed to {!b}${newName}{/}.`];
    }
}