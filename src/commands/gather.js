import { BaseCommand } from './base';

class GatherCommand extends BaseCommand
{
    constructor() {
        this.name = 'gather';
        this.patterns = [
            /^with\s+(?<tool>.+)$/,
            /^(?<tool>.+)$/,
            true
        ];

        this.foundSomething = false;
        this.line = null;
        this.tool = null;
    }

    help() {
        return [
            'gather [with tool name]',
            'Start gathering materials, optionally using a tool. Each second there is a chance',
            'to collect an item. Tools can change the types of items you can collect.',
        ].join('\n');
    }

    run(tf, args) {
        this.tool = null;

        if ( args.tool ) {
            let tool = args.tool;

            // make sure the item exists
            let item = tf.items.find(tool);
            if ( !item ) {
                return [false, "You don't have that item."];
            }

            // ordering this way because the messages make more sense.
            let stack = termcraft.player.findItemStack(item);
            if ( !stack ) {
                return [false, "You don't have that item."];
            }
            if ( !item.tool ) {
                return [false, "That item is not a tool."];
            }

            this.tool = stack;

            // damage the item (if damageable) for every found item
            // destroy the item if health is 0
            // if item is destroyed, check to see if the player has another of them. if so switch to that,
            // otherwise end the gathering.
        }

        this.foundSomething = false;
        termcraft.console.lock();

        if ( this.tool ) {
            let dur = this.tool.item.hasTrait('damageable') ? this.tool.data['durability'] : -1;
            let durStr = dur == -1 ? 'inf' : (dur + '/' + this.tool.data['maxDurability']);
            this.line = termcraft.console.appendLine(
                `Gathering materials with "${this.tool.item.name}" ({!ticker}${time}{/}) [{!dur}${durStr}{/}]`)
        } else {
            this.line = termcraft.console.appendLine(`Gathering materials with bare hands ({!ticker}${time}{/})...`);
        }

        let fn = () => {
            let keepGoing = this.tick(termcraft);
            if ( keepGoing && --time > 0 ) {
                setTimeout(fn, 1000);
            } else {
                termcraft.console.unlock();
            }
            this.line.find('.ticker').text(time == 0 || !keepGoing ? 'done' : time);

            if ( this.tool ) {
                let dur = this.tool.item.hasTrait('damageable') ? this.tool.data['durability'] : -1;
                let durStr = dur == -1 ? 'inf' : (dur + '/' + this.tool.data['maxDurability']);
                this.line.find('.dur').text(durStr);
            }
        };

        setTimeout(fn, 1000);
    }

    tick(tf) {
        let tool = '';
        if ( this.tool ) {
            let trait: Tool = <Tool> this.tool.item.getTrait('tool');
            tool = trait.type + ':' + trait.level;
        }

        let gatherItems = termcraft.gathering.gathers[tool];
        if ( !gatherItems ) {
            gatherItems = termcraft.gathering.gathers[''];
        }

        let itemName = weightedRandom(gatherItems);
        if ( itemName == '' ) {
            return true;
        }

        let stack = termcraft.items.get(itemName).stack(1);
        termcraft.player.addItemStack(stack);

        if ( !this.foundSomething ) {
            termcraft.console.appendLine('Found:');
            this.foundSomething = true;
        }
        termcraft.console.appendLine('  ' + stack.item.name);

        // damage the item if damageable
        if ( this.tool && this.tool.item.hasTrait('damageable') && this.tool.data['durability'] > 0 ) {
            this.tool.data['durability']--;
            if ( this.tool.data['durability'] <= 0 ) {
                // destroy it
                termcraft.player.inventory.remove(this.tool);

                // find a replacement
                let newStack = termcraft.player.findItemStack(this.tool.item);
                if ( newStack ) {
                    termcraft.console.appendLine('Tool broke, using a replacement.', 'tip');
                    this.tool = newStack;
                } else {
                    termcraft.console.appendLine('Tool broke, no replacements, stopping gather.', 'tip');
                    return false;
                }
            }
        }

        return true;
    }
}