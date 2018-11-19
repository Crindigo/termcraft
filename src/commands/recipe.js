import { BaseCommand } from './base';
import { tagRegexp, formatTagSpec } from '../utils';

export class RecipeCommand extends BaseCommand
{
    constructor(device = 'hand') {
        super();

        this.name = 'recipe';
        this.patterns = [
            /^(for )?(?<name>.+)$/
        ];

        this.device = device;
    }

    run(tf, args) {
        const recipe = tf.crafting.findRecipeByName(this.device, args.name);
        if ( !recipe ) {
            return [false, 'No recipe found for ' + args.name + '.'];
        }

        // need to handle tags and levels properly eventually
        tf.console.appendLine(`[Time: ${recipe.time}s] [Stamina: ${recipe.stamina}]`);
        tf.console.appendLine('Input:');
        Object.entries(recipe.input).forEach(kv => {
            // need to get names from id
            let itemName = '';
            if ( kv[0].startsWith('tag:') ) {
                let stacks = tf.player.inventory.findMatchingTag(kv[0]);
                if ( stacks.length === 0 ) {
                    itemName = formatTagSpec(kv[0]);
                } else {
                    itemName = stacks.map(s => s.item.name).join('/');
                }
            } else {
                itemName = tf.items.get(kv[0]).name;
            }
            console.log(kv[0], itemName);
            tf.console.appendLine(' - ' + itemName + (kv[1] > 1 ? ` (${kv[1]})` : ''));
        });
        tf.console.appendLine('Output:');
        Object.entries(recipe.output).forEach(kv => {
            // need to get names from id
            let itemName = tf.items.get(kv[0]).name;
            tf.console.appendLine(' - ' + itemName + (kv[1] > 1 ? ` (${kv[1]})` : ''));
        });
    }
}