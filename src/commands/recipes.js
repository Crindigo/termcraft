import { BaseCommand } from './base';
import padEnd from 'lodash/padEnd';
import repeat from 'lodash/repeat';

export class RecipesCommand extends BaseCommand
{
    constructor(device = null) {
        super();

        this.name = 'recipes';
        this.patterns = [
            /^(?<itemfilter>.+)$/,
            true
        ];
        
        this.device = device;
    }

    run(tf, args) {
        let recipes = tf.crafting.getAvailableRecipes(this.device, tf.player.inventory);
        if ( recipes.length === 0 ) {
            tf.console.appendLine("You don't know any recipes.");
            return;
        }

        let filter = args.itemfilter || '';

        let line = '';
        let count = 0;
        recipes.forEach(r => {
            let name = r.name || tf.items.get(Object.keys(r.output)[0]).name;
            if ( filter.length === 0 || name.includes(filter) ) {
                let pad = repeat( ' ', 32 - name.length);
                line += '{!itemtt clickable}' + name + '{/}' + pad;
                count++;
                if (count === 3) {
                    tf.console.appendLine(line);
                    line = '';
                    count = 0;
                }
            }
        });

        if ( line.length ) {
            tf.console.appendLine(line);
        }
    }
}