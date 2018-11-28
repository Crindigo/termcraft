import { BaseCommand } from './base';
import { progressBar } from '../utils';

export class ResearchCommand extends BaseCommand
{
    constructor() {
        super();

        this.name = 'research';
        this.patterns = [
            /^(?:the\s+)?(.+)/,
            true
        ];

        this.receivedStop = false;
        this.tech = null;
        this.progress = 0;
        this.drain = 0;
        this.progressLine = null;
    }

    help() {
        return [
            'research [name]',
            'Research the technology given by name, or else list all available research if no name is given.',
            'Completing research takes time, stamina, and items. You can stop research early, but progress will',
            'not be saved and you will need to start over. Certain support items can improve research speed.',
        ].join("\n");
    }

    researchList(tf) {
        tf.research.allAvailable().forEach(r => {
            tf.console.appendLine('{!b}[' + r.name + ']{/}');
            tf.console.appendLine(`Time: ${r.time}s / Stamina: ${r.stamina}`);
            Object.entries(r.items).forEach(kv => {
                //console.log(kv[0]);
                let itemName = tf.items.get(kv[0]).name;
                let qty = kv[1];
                tf.console.appendLine(` - ${itemName} (${qty})`);
            });
        });
    }

    run(tf, args) {
        if ( !args[1] ) {
            this.researchList(tf);
            return;
        }

        this.tech = null;
        let name = args[1];

        // make sure the item exists
        let tech = tf.research.findByName(name);
        if ( !tech ) {
            return [false, "You can't research that."];
        }

        if ( !tf.research.canResearch(tech) ) {
            return [false, "You don't have enough materials."];
        }

        // reset props
        this.receivedStop = false;
        this.progress = 0;
        tf.console.lock(this);

        // create a progress bar, and update the UI for stamina regen
        this.tech = tech;
        tf.console.appendLine(`You started researching ${name}.`);
        this.progressLine = tf.console.appendLine(progressBar(0, tech.time, 100));

        this.drain = tech.stamina / tech.time;
        tf.player.staminaChange -= this.drain;

        // remove the items
        tf.research.pullItems(tech);

        let fn = () => {
            let keepGoing = this.tick(tf);
            if ( keepGoing ) {
                setTimeout(fn, 1000);
            } else {
                tf.player.staminaChange += this.drain;
                tf.console.unlock();
            }
        };
        setTimeout(fn, 1000);
    }

    stop() {
        tf.console.appendLine('You stopped your research. All used items were discarded.', 'tip');
        this.receivedStop = true;
    }

    tick(tf) {
        if ( this.receivedStop ) {
            return false;
        }

        if ( tf.player.stamina < this.drain ) {
            tf.console.appendLine('Stopped research because you ran out of stamina.', 'error');
            return false;
        }
        tf.player.stamina -= this.drain;

        this.progress++;
        this.progressLine.text(progressBar(this.progress, this.tech.time, 100));

        if ( this.progress >= this.tech.time ) {
            tf.console.appendLine(`You've completed your research on ${this.tech.name}!`, 'tip');
            const unlocks = tf.research.complete(this.tech.id);
            
            // unlocked commands
            if ( unlocks.commands.length ) {
                unlocks.commands.forEach(cmd => {
                    tf.console.appendLine('Unlocked the ' + cmd + ' command!', 'tip');
                });
            }
    
            // unlocked recipes
            if ( unlocks.recipes.length ) {
                unlocks.recipes.forEach(re => {
                    let recipe = tf.crafting.findRecipe(null, re);
                    let name = recipe.name || tf.items.get(Object.keys(recipe.output)[0]).name;
                    tf.console.appendLine('Unlocked recipe for ' + name + '!', 'tip');
                });
            }

            // unlocked research
            if ( unlocks.research.length ) {
                unlocks.research.forEach(rid => {
                    let r = tf.research.get(rid);
                    tf.console.appendLine('Unlocked research on ' + r.name + '!', 'tip');
                });
            }

            return false;
        }

        return true;
    }
}