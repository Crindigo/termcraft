import { BaseCommand } from './base';
import { progressBar, numberFormatAbbr } from '../utils';
import an from 'indefinite';

export class EatCommand extends BaseCommand
{
    constructor() {
        super();

        this.name = 'eat';
        this.patterns = [
            /^(?:an?\s+)?(.+)$/
        ];

        this.receivedStop = false;
        this.food = null;
        this.eatProgress = 0;
        this.eatRegen = 0;
        this.progressLine = null;
    }

    help() {
        return [
            'eat item name',
            'Eat/drink food and beverages to recover stamina and increase your stamina cap.',
            'Eating will take some time to finish, during which stamina regenerates much faster.',
            'You can stop the eating process at any time, but the food item will be discarded and',
            'your stamina cap will NOT increase. Lower-tier foods generate less stamina and barely',
            'increase the cap, but can be consumed quickly.'
        ].join('\n');
    }

    run(tf, args) {
        this.food = null;
        let food = args[1];

        // make sure the item exists
        let item = tf.items.find(food);
        if ( !item ) {
            return [false, "You don't have " + an(food) + "."];
        }

        // ordering this way because the messages make more sense.
        let stack = tf.player.findItemStack(item);
        if ( !stack || stack.qty < 1 ) {
            return [false, "You don't have " + an(food) + "."];
        }
        if ( !item.edible ) {
            return [false, "You can't eat " + an(food) + "!"];
        }

        // reset props
        this.receivedStop = false;
        this.eatProgress = 0;
        tf.console.lock(this);

        // create a progress bar, and update the UI for stamina regen
        this.food = stack;
        tf.console.appendLine(`You started eating ${an(food)}.`);
        this.progressLine = tf.console.appendLine(progressBar(0, item.time, 100));

        this.eatRegen = item.stamina * tf.player.staminaMultiplier() / item.time;
        tf.player.staminaChange += this.eatRegen;

        // remove the item
        tf.player.inventory.reduce(this.food);

        let fn = () => {
            let keepGoing = this.tick(tf);
            if ( keepGoing ) {
                setTimeout(fn, 1000);
            } else {
                tf.player.staminaChange -= this.eatRegen;
                tf.console.unlock();
            }
        };
        setTimeout(fn, 1000);
    }

    stop(tf) {
        tf.console.appendLine('You stopped eating and threw out the rest. What a waste.');
        this.receivedStop = true;
    }

    tick(tf) {
        if ( this.receivedStop ) {
            return false;
        }

        // increment eating progress, regen stamina, and update progress bar
        this.eatProgress++;
        tf.player.giveStamina(this.eatRegen);
        this.progressLine.text(progressBar(this.eatProgress, this.food.item.time, 100));

        if ( this.eatProgress >= this.food.item.time ) {
            let increase = this.food.item.staminaCap * tf.player.staminaMultiplier();
            tf.player.maxStamina += increase;
            tf.player.updateNutrition(this.food.item);
            tf.console.append(
                `Delicious. Your stamina cap increased by ${numberFormatAbbr(increase)}. ` +
                `Your nutrition bonus is ${numberFormatAbbr(tf.player.nutritionBonus())}%.`);

            for ( let id in this.food.item.leftovers ) {
                let qty = this.food.item.leftovers[id];
                let leftover = tf.items.get(id);
                tf.player.addItemStack(leftover.stack(qty));
                tf.console.appendLine(`${leftover.name} (${qty}) was left over.`);
            }
            return false;
        }

        return true;
    }
}