import { BaseCommand } from './base';
import { progressBar } from '../utils';
import an from 'indefinite';

/**
 * Like make, but for building structures like support and devices. Unlike make, you can
 * stop building a structure and resume it where you left off.
 * 
 * Also, we can allow construction to start even if all items are not available, by dividing
 * item requirements by time and taking X per tick. Fractional item quantities are A-OK. The
 * tick just won't do anything if all requirements aren't met, but it won't quit the process.
 */
export class BuildCommand extends BaseCommand
{
    constructor() {
        super();

        this.name = 'build';
        this.patterns = [
            /^(an?\s+)?(?<name>.+)$/
        ];

        this.receivedStop = false;
        this.progress = 0;
        this.progressLine = null;
        this.recipe = null;
        this.item = null;
        this.staminaDrain = 0;
    }

    help() {
        return [
            'build [structure]',
            'Builds a structure. Similar to the make command, but structures can be stopped and resumed',
            'without loss of progress. Also, all the items are not required up front, it will just consume',
            'a small amount per tick and will only proceed if all requirements are met.'
        ].join("\n");
    }

    run(tf, args) {
        this.recipe = null;

        let itemName = args.name;

        // make sure the item exists
        let item = tf.items.find(itemName);
        if ( !item ) {
            return [false, "You can't build " + an(itemName) + "."];
        }

        let recipe = tf.crafting.findRecipeByOutput('structure', item.id);
        if ( !recipe ) {
            return [false, "You can't build " + an(itemName) + "."];
        }

        if ( recipe.device !== 'structure' ) {
            return [false, "You can't use the build command for that."];
        }

        // We need to check the registry of Support and Device to see if there's any partially completed
        // objects of this type. if so, resume that instead of making a totally new one.
        let makeNew = true;
        if ( item.category === 'support' ) {
            makeNew = !tf.support.hasIncomplete(item.id);
        } else if ( item.category === 'device' ) {
            makeNew = !tf.devices.hasIncomplete(item.id);
        }

        // check land requirements
        if ( makeNew && item.category === 'device' && item.land > tf.freeLand() ) {
            return [false, "There's not enough room to build this."];
        }

        // no need to check for missing items

        // reset props
        this.receivedStop = false;
        this.progress = 0;
        tf.console.lock(this);

        // create a progress bar, and update the UI for stamina regen
        this.recipe = recipe;
        this.item = item;

        if ( makeNew ) {
            tf.console.appendLine(`You started building ${an(item.name)}.`);
        } else {
            tf.console.appendLine(`You resumed construction of the ${item.name}.`);
            if ( item.category === 'support' ) {
                this.progress = tf.support.getProgress(item.id);
            } else if ( item.category === 'device' ) {
                this.progress = tf.devices.getProgress(item.id);
            }
        }
        this.progressLine = tf.console.appendLine(progressBar(this.progress, recipe.time, 100));

        this.staminaDrain = recipe.stamina / recipe.time;
        tf.player.staminaChange -= this.staminaDrain;

        // allocate the land for this.
        if ( item.category === 'device' && makeNew ) {
            tf.land += item.land;
        }

        if ( makeNew ) {
            if ( item.category === 'support' ) {
                tf.support.startConstruction(item.id);
            } else if ( item.category === 'device' ) {
                tf.devices.startConstruction(item.id);
            }
        }

        let fn = () => {
            let keepGoing = this.tick(tf);
            if ( keepGoing ) {
                setTimeout(fn, 1000);
            } else {
                tf.player.staminaChange += this.staminaDrain;
                tf.console.unlock();
            }
        };
        setTimeout(fn, 1000);
    }

    stop(tf) {
        this.receivedStop = true;
        tf.console.appendLine("You decided to take a break for now.");
    }

    tick(tf) {
        if ( this.receivedStop ) {
            return false;
        }

        // check stamina
        if ( tf.player.stamina < this.staminaDrain ) {
            return true;
        }

        // check for this tick's required items.
        // the desired qty is just 1 over the total ticks required.
        if ( !this.recipe.canCraft(tf.player.inventory, 1 / this.recipe.time) ) {
            return true;
        }

        // take from stamina and inventory
        tf.player.stamina -= this.staminaDrain;
        this.recipe.pullFromInventory(tf.player.inventory, 1 / this.recipe.time);

        this.progress++;
        this.progressLine.text(progressBar(this.progress, this.recipe.time, 100));

        if ( this.item.category === 'support' ) {
            tf.support.incrementProgress(this.item.id);
        } else if ( this.item.category === 'device' ) {
            tf.devices.incrementProgress(this.item.id);
        }

        if ( this.progress >= this.recipe.time ) {
            tf.console.appendLine(`You've finished building the ${this.item.name}!`, 'tip');

            if ( this.item.category === 'support' ) {
                tf.support.finishConstruction(this.item.id);
            } else if ( this.item.category === 'device' ) {
                let deviceName = tf.devices.finishConstruction(this.item.id);
                tf.console.appendLine(`Access it with {!b}use ${deviceName}{/}.`)
                tf.console.appendLine(`Rename it with {!b}name ${deviceName} new_name{/}.`)
            }
            return false;
        }

        return true;
    }
}