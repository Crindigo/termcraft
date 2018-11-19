import { BaseCommand } from './base';

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
            return [false, 'No recipe found for ' + args.name];
        }

        // need to handle tags and levels properly eventually
        tf.console.appendLine(`[Time: ${recipe.time}s] [Stamina: ${recipe.stamina}]`);
        tf.console.appendLine('Input:');
        Object.entries(recipe.input).forEach(kv => {
            // need to get names from id
            tf.console.appendLine(' - ' + kv[0] + (kv[1] > 1 ? ` (${kv[1]})` : ''));
        });
        tf.console.appendLine('Output:');
        Object.entries(recipe.output).forEach(kv => {
            // need to get names from id
            tf.console.appendLine(' - ' + kv[0] + (kv[1] > 1 ? ` (${kv[1]})` : ''));
        });
    }
}