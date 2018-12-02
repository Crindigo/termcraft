import {BaseDevice, BaseDeviceClass} from "./base";
import {BaseCommand} from "../commands/base";
import {clamp} from "../utils";

export class HandCrankClass extends BaseDeviceClass
{
    constructor(tf) {
        super(tf, 'hand_crank');

        this.registry.add(new TurnCommand(), true);
    }

    newDevice(name) {
        return new HandCrank(this, name);
    }
}

export class HandCrank extends BaseDevice
{
    constructor(deviceClass, name) {
        super(deviceClass, name);
    }

    tick() {
        super.tick();
    }
}

class TurnCommand extends BaseCommand
{
    constructor() {
        super();

        this.name = 'turn';
        this.patterns = [
            /^(\d+)/,
            true
        ];

        this.times = 1;
        this.current = 0;
        this.staminaDrain = 3;
        this.powerGen = 2;
        this.receivedStop = false;
    }

    run(tf, args) {
        if ( args[1] ) {
            this.times = clamp(parseInt(args[1]), 1, 900);
        } else {
            this.times = 1;
        }

        // use 3 stamina and generate 2 power per second
        if ( tf.player.stamina < this.staminaDrain ) {
            return [false, 'Not enough stamina.'];
        }

        tf.console.appendLine('You started turning the crank.');
        this.current = 0;
        this.receivedStop = false;
        tf.console.lock(this);
        tf.player.staminaChange -= this.staminaDrain;
        tf.powerChange += this.powerGen;

        let fn = () => {
            let keepGoing = this.tick(tf);
            if ( keepGoing ) {
                setTimeout(fn, 1000);
            } else {
                tf.player.staminaChange += this.staminaDrain;
                tf.powerChange -= this.powerGen;
                tf.console.unlock();
            }
        };
        setTimeout(fn, 1000);
    }

    stop(tf) {
        tf.console.appendLine('You stopped turning the crank.', 'tip');
        this.receivedStop = true;
    }

    tick(tf) {
        if ( this.receivedStop ) {
            return false;
        }

        if ( tf.player.stamina < this.staminaDrain ) {
            tf.console.appendLine('You ran out of stamina.', 'error');
            return false;
        }

        this.current++;
        tf.modifyPower(this.powerGen);

        if ( this.current >= this.times ) {
            tf.console.appendLine('You stopped turning the crank after some time.', 'tip');
            return false;
        }

        return true;
    }
}