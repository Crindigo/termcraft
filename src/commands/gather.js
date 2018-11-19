import { BaseCommand } from './base';
import { pickRandomKeys, numberFormatAbbr } from '../utils';
import an from 'indefinite';
import GatherData from '../data/gathers.json';

export class GatherCommand extends BaseCommand
{
    constructor() {
        super();

        this.name = 'gather';
        this.patterns = [
            /^with\s+(a|an)\s+(?<tool>.+)$/,
            /^with\s+(?<tool>.+)$/,
            /^(?<tool>.+)$/,
            true
        ];

        this.foundSomething = false;
        this.logLines = {};
        this.foundQty = {};
        this.tool = null;
        this.receivedStop = false;

        // map of toolspec -> { itemid -> chance }
        this.gatherData = GatherData;

        // cached data of item chances generated at command init
        this.gatherItems = {};
    }

    help() {
        return [
            'gather [with tool name]',
            'Start gathering materials, optionally using a tool. Each second there is a chance',
            'to collect an item. Tools can change the types of items you can collect.',
            'Gathering uses 1 stamina per second, and you will stop gathering if you run out.'
        ].join('\n');
    }

    run(tf, args) {
        this.tool = null;

        if ( args.tool ) {
            let tool = args.tool;

            // make sure the item exists
            let item = tf.items.find(tool);
            if ( !item ) {
                return [false, "You don't have " + an(tool) + "."];
            }

            // ordering this way because the messages make more sense.
            let stack = tf.player.findItemStack(item);
            if ( !stack ) {
                return [false, "You don't have " + an(tool) + "."];
            }
            if ( !item.tool ) {
                return [false, "The " + tool + " is not a tool."];
            }

            this.tool = stack;

            // damage the item (if damageable) for every found item
            // destroy the item if health is 0
            // if item is destroyed, check to see if the player has another of them. if so switch to that,
            // otherwise end the gathering.
        }

        // reset these
        this.foundQty = {};
        this.logLines = {};
        this.foundSomething = false;
        this.receivedStop = false;

        tf.console.lock(this);

        if ( this.tool ) {
            tf.console.appendLine(`Gathering materials with ${an(this.tool.item.name)}. Type {!b}stop{/} to finish.`)
        } else {
            tf.console.appendLine(`Gathering materials with your bare hands. Type {!b}stop{/} to finish.`);
        }

        this.cacheGatherItems();

        let fn = () => {
            let keepGoing = this.tick(tf);
            if ( keepGoing ) {
                setTimeout(fn, 1000);
            } else {
                tf.player.staminaChange += 1;
                tf.console.unlock();
            }
        };

        tf.player.staminaChange -= 1;
        setTimeout(fn, 1000);
    }

    stop(tf) {
        tf.console.appendLine('You stopped gathering items.');
        this.receivedStop = true;
    }

    cacheGatherItems() {
        let toolTags = [];
        let toolLevel = 0;
        if ( this.tool ) {
            toolTags = this.tool.item.tags;
            toolLevel = this.tool.item.level;
        }

        this.gatherItems = {};
        if ( !this.tool ) {
            this.gatherItems = this.gatherData["hand"];
        } else {
            for ( toolSpec in this.gatherData ) {
                // toolSpec = "hand" or "item_id" or "tag:item_tag" or "tag:item_tag[1,)"
                if ( toolSpec === 'hand' ) {
                    continue;
                }

                // try a full match with tag + level bounds
                let m = toolSpec.match(/^tag:(?<tag>[a-z0-9_]+)(\s*(\[(?<low>\d+),(?<high>\d+)?(?<close>\]|\))))?$/);
                if ( m ) {
                    let tagMatches = toolTags.includes(m.groups.tag);
                    if ( !tagMatches ) {
                        continue;
                    }

                    let levelMatches = true;
                    if ( m.groups.low ) {
                        levelMatches = levelMatches && toolLevel >= parseInt(m.groups.low);
                        if ( m.groups.high ) {
                            if ( m.groups.close === ']' ) {
                                levelMatches = levelMatches && toolLevel <= parseInt(m.groups.high);
                            } else if ( m.groups.close === ')' ) {
                                levelMatches = levelMatches && toolLevel < parseInt(m.groups.high);
                            }
                        }
                    }

                    if ( !levelMatches ) {
                        continue;
                    }
                } else if ( toolSpec !== this.tool.item.id ) {
                    continue;
                }
                
                // go through the list of items and add it to gatherItems.
                // if it already exists in gatherItems, use the highest value.
                let itemList = this.gatherData[toolSpec];
                for ( itemId in itemList ) {
                    if ( itemId === '//' ) {
                        continue;
                    }
                    let chance = itemList[itemId];
                    if ( this.gatherItems[itemId] ) {
                        this.gatherItems[itemId] = Math.max(chance, this.gatherItems[itemId]);
                    } else {
                        this.gatherItems[itemId] = chance;
                    }
                }
            }
        }

        if ( Object.keys(this.gatherItems).length === 0 ) {
            this.gatherItems = this.gatherData["hand"];
        }

        if ( this.gatherItems["//"] ) {
            delete this.gatherItems["//"];
        }
    }

    tick(tf) {
        if ( this.receivedStop ) {
            return false;
        }

        if ( tf.player.stamina < 1 ) {
            tf.console.appendLine('Stopped gathering items because you ran out of stamina.', 'tip');
            return false;
        }
        tf.player.stamina -= 1;

        // there exists the potential for the tool to run out due to usage in a device, so check the qty here.
        // we need to have this up here as well because we can't find an item with a missing tool!
        if ( this.tool && this.tool.qty <= 0 ) {
            tf.console.appendLine('No more tools found, stopped gathering items.', 'tip');
            return false;
        }

        const breakChance = this.tool ? this.tool.item.breakChance : 0;

        let foundItems = pickRandomKeys(this.gatherItems);
        if ( foundItems.length === 0 ) {
            return true;
        }

        if ( !this.foundSomething ) {
            tf.console.appendLine('Found:');
            this.foundSomething = true;
        }

        // loop thru found item ids. there can be multiple of the same item id.
        foundItems.forEach(itemId => {
            let stack = tf.items.get(itemId).stack(1);
            tf.player.addItemStack(stack);

            if ( this.logLines[itemId] ) {
                this.foundQty[itemId]++;
                this.logLines[itemId].find('.qty').text(numberFormatAbbr(this.foundQty[itemId]));
            } else {
                this.foundQty[itemId] = 1;
                this.logLines[itemId] = tf.console.appendLine('  ' + stack.item.name + ' ({!qty}1{/})');
            }
        });

        // possibly break the item if it's breakable
        if ( this.tool && breakChance > 0 ) {
            let broken = Math.random() < breakChance;
            if ( broken ) {
                // destroy it by reducing the stack size by 1.
                tf.player.inventory.reduce(this.tool);
                if ( this.tool.qty > 0 ) {
                    tf.console.appendLine('Tool broke, using a replacement.', 'tip');
                }
            }
        }

        //tf.syncInventory();

        // there exists the potential for the tool to run out due to usage in a device, so check the qty here.
        // this also handles the case where qty is <= 0 after it breaks above.
        if ( this.tool && this.tool.qty <= 0 ) {
            tf.console.appendLine('No more tools found, stopped gathering items.', 'tip');
            return false;
        }

        return true;
    }
}