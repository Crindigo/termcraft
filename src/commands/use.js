import { BaseCommand } from './base';

export class UseCommand extends BaseCommand
{
    constructor() {
        super();

        this.name = 'use';
        this.patterns = [
            /^(?:the\s+)?(.+)$/
        ];
    }

    run(tf, args) {
        // Look up a device by its name (either auto generated or named)
        // Needs to change the command processor to the device's command processor and update PS1.
        let name = args[1];
        
        let device = tf.devices.find(name);
        if ( !device ) {
            return [false, 'No device named {!b}' + name + '{/} was found.'];
        }

        let deviceClass = device.deviceClass;
        tf.devices.current = device;
        tf.console.processor = deviceClass.processor;
        tf.console.setPs1(name + '$');
        tf.console.appendLine('You started using {!b}' + name + '{/}. Leave with {!b}quit{/}.');
    }
}