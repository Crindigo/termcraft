import { BaseCommand } from './base';

export class RecipesCommand extends BaseCommand
{
    constructor(device = 'hand') {
        super();

        this.name = 'recipes';
        this.patterns = [true];
        
        this.device = device;
    }

    run(tf, args) {
        let recipes = tf.crafting.getAvailableRecipes(this.device, tf.player.inventory);
        if ( recipes.length === 0 ) {
            tf.console.appendLine("Nothing is craftable right now.");
            return;
        }
        
        recipes.forEach(r => {
            let name = r.name || tf.items.get(Object.keys(r.output)[0]).name;
            tf.console.appendLine(' - ' + name);
        });
    }
}