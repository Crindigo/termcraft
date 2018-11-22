import { BaseCommand } from './base';
import padEnd from 'lodash/padEnd';

export class RecipesCommand extends BaseCommand
{
    constructor(device = null) {
        super();

        this.name = 'recipes';
        this.patterns = [true];
        
        this.device = device;
    }

    run(tf, args) {
        let recipes = tf.crafting.getAvailableRecipes(this.device, tf.player.inventory);
        if ( recipes.length === 0 ) {
            tf.console.appendLine("You don't know any recipes.");
            return;
        }

        let line = '';
        let count = 0;
        recipes.forEach(r => {
            let name = r.name || tf.items.get(Object.keys(r.output)[0]).name;
    
            line += '{!itemtt}' + padEnd(name, 32) + '{/}';
            count++;
            if ( count === 3 ) {
                tf.console.appendLine(line);
                line = '';
                count = 0;
            }
        });

        if ( line.length ) {
            tf.console.appendLine(line);
        }
    }
}