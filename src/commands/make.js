import { BaseCommand } from './base';
import an from 'indefinite';
import { progressBar } from '../utils';

export class MakeCommand extends BaseCommand
{
    constructor(device = 'hand') {
        super();

        this.device = device;
        this.name = 'make';

        // make 10 item
        // make a/an item
        // make item
        this.patterns = [
            /^(?<qty>\d+)\s+(?<item>.+)$/,
            /^(an?\s+)?(?<item>.+)$/,
        ];

        this.receivedStop = false;
        this.recipe = null;
        this.progress = 0; // total progress
        this.itemProgress = 0; // single item progress
        this.progressLine = null;
        this.desiredQty = 1;
        this.craftedQty = 0;
        this.staminaDrain = 0;
        this.inputStacks = [];
    }

    help() {
        return [
            'make [qty] item name',
            'Attempts to craft a quantity of the given item, default 1 if qty is not given.',
            'Crafting items can take time and stamina. If stamina runs out, the crafting process',
            'stops. To check the time and stamina requirements, use the {!b}recipe{/} command.',
            'To view all craftable recipes, use the {!b}recipes{/} command.'
        ].join('\n');
    }

    run(tf, args) {
        this.recipe = null;
        this.desiredQty = args.qty || 1;

        let itemName = args.item;

        // make sure the item exists
        let item = tf.items.find(itemName);
        if ( !item ) {
            return [false, "You can't make " + an(itemName) + "."];
        }

        let recipe = tf.crafting.findRecipeByOutput(this.device, item.id);
        if ( !recipe ) {
            return [false, "You can't make " + an(itemName) + "."];
        }

        // only check for 1 in case you're getting items in the background via other means.
        // we'll just stop the operation if we run out.
        let canCraft = recipe.canCraft(tf.player.inventory, 1);
        if ( !canCraft ) {
            return [false, "You don't have all the required items."];
            // probably should show missing items
        }

        // reset props
        this.receivedStop = false;
        this.progress = 0;
        this.craftedQty = 0;
        this.itemProgress = 0;
        this.inputStacks = [];
        tf.console.lock(this);

        // create a progress bar, and update the UI for stamina regen
        this.recipe = recipe;
        tf.console.appendLine(`You started making ${this.desiredQty} of ${item.name}.`);
        this.progressLine = tf.console.appendLine(progressBar(0, recipe.time * this.desiredQty, 90) + ` 0/${this.desiredQty}`);

        this.staminaDrain = recipe.stamina / recipe.time;
        tf.player.staminaChange -= this.staminaDrain;

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
        tf.console.appendLine('You stopped crafting. Any unfinished items were discarded.');
        this.receivedStop = true;
    }

    tick(tf) {
        if ( this.receivedStop ) {
            return false;
        }

        // Check if we have at least staminaDrain stamina. If not, stop.

        // If itemProgress is 0, meaning nothing is currently started:
        // Check if we have the required items in our inventory. If not, stop.
        // Pull out the items required for ONE crafting operation.

        // When an item is complete, increment craftedQty and if it's >= desiredQty then stop.
        // If it's under desiredQty, reset itemProgress to 0 so the next tick starts over.

        if ( tf.player.stamina < this.staminaDrain ) {
            tf.console.appendLine('Stopped crafting because you ran out of stamina.', 'tip');
            return false;
        }
        tf.player.stamina -= this.staminaDrain;

        if ( this.itemProgress === 0 ) {
            let canCraft = this.recipe.canCraft(tf.player.inventory, 1);
            if ( !canCraft ) {
                tf.console.appendLine('Stopped crafting because you ran out of ingredients.', 'tip');
                return false;
            }

            // need to store a reference to the input stacks so we can check and break the proper tool
            // when the recipe is finished.
            this.inputStacks = this.recipe.pullFromInventory(tf.player.inventory, 1);
        }

        this.itemProgress++;
        this.progress++;
        this.updateProgress();

        // finished a single item
        if ( this.itemProgress >= this.recipe.time ) {
            // Need to check if one of the input items was breakable, and if so run the break chance test.
            // If we've run out of that item it will just catch it above before the next craft.
            // technically could be simplified by breaking in recipe.pullFromInventory, but it just seems
            // weird to break the tool before you used it lol.
            this.inputStacks.forEach(st => {
                if ( st.item.tool && Math.random() < st.item.breakChance ) {
                    tf.player.inventory.reduce(st, 1);
                    tf.console.appendLine(`You broke your ${st.item.name}.`);
                }
            });

            Object.keys(this.recipe.output).forEach(itemId => {
                const item = tf.items.get(itemId);
                const qty = this.recipe.output[itemId];
                if ( item.category === 'item' ) {
                    // add to the player inventory
                    tf.player.addItemStack(item.stack(qty));
                } else if ( item.category === 'support' ) {
                    // add to the support list
                } else if ( item.category === 'device' ) {
                    // add to the device list
                }
            });

            this.craftedQty++;
            this.updateProgress();
            if ( this.craftedQty >= this.desiredQty ) {
                tf.console.appendLine(`You've finished crafting all the items.`);
                return false;
            } else {
                this.itemProgress = 0;
            }
        }

        return true;
    }

    updateProgress() {
        this.progressLine.text(progressBar(
            this.progress, this.recipe.time * this.desiredQty, 90) + ` ${this.craftedQty}/${this.desiredQty}`);
    }
}