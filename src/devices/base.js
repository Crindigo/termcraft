import { CommandProcessor, CommandRegistry, BaseCommand } from "../commands/base";
import { RecipeCommand } from "../commands/recipe";
import { RecipesCommand } from "../commands/recipes";
import { progressBar } from '../utils';
import an from 'indefinite';

/**
 * The device "class" which contains information applying to all instances of the device.
 */
export class BaseDeviceClass
{
    constructor(tf, id) {
        this.tf = tf;
        this.id = id;
        this.name = tf.items.get(id).name;

        // set up the custom command registry and processor. the use command will set tf.console.processor
        // to this.processor and quit/exit/leave will set it back to tf.console.rootProcessor.
        this.registry = new CommandRegistry();
        this.processor = new CommandProcessor(this.tf, this.registry);

        this.registry.add(new QuitCommand(), true);
        this.registry.alias('quit', ['exit', 'leave', 'bye', 'q']);

        // destroy this machine and collect any leftover resources.
        this.registry.add(new DismantleCommand(), true);
    }

    addRecipeSupport(deviceId, interactive) {
        this.registry.add(new RecipeCommand(deviceId), true);
        this.registry.add(new RecipesCommand(deviceId), true);
        this.registry.add(new DeviceMakeCommand(deviceId, interactive), true);
        this.registry.alias('make', ['build']);
    }

    /**
     * Create a fresh device instance after finishing construction.
     * 
     * @param {string} name 
     */
    newDevice(name) {
        return new BaseDevice(this, name);
    }

    /**
     * Load a device instance from save data.
     * 
     * @param {object} data 
     */
    loadDevice(data) {
        let device = this.newDevice(data.name);
        device.loadFromData(data);
        return device;
    }
}

/**
 * Creates a simple device class which only supports crafting operations. This is enough for a lot
 * of devices, so they don't all need dedicated classes. The device will automatically get
 * recipe, recipes, and make/build commands.
 *
 * @param tf
 * @param id Device ID
 * @param interactive If recipes require the player to be present
 * @returns BaseDeviceClass
 */
export function createSimpleDeviceClass(tf, id, interactive) {
    let klass = class extends BaseDeviceClass {
        constructor(tf) {
            super(tf, id);
            this.addRecipeSupport(id, interactive);
        }
    };
    return new klass(tf);
}

/**
 * Instance of a device.
 */
export class BaseDevice
{
    constructor(deviceClass, name) {
        this.deviceClass = deviceClass;
        this.name = name;
        this.tf = deviceClass.tf;

        this.craftOperation = null;
    }

    renderList() {
        let html = '{!item}' + this.name.substr(0, 34) + '{/}';
        if ( this.craftOperation ) {
            let co = this.craftOperation;
            html = '{!item bold}' + this.name.substr(0, 34) + '{/}';
            html += '{!crafting}&gt; ' + co.item.name + ' (' + co.desiredQty + '){/}';
            html += '{!progress}' + progressBar(co.progress, co.recipe.time * co.desiredQty, 34) + '{/}';
        }
        return html;
    }

    tick() {
        // If the device has a crafting operation active, tick it.
        if ( this.craftOperation ) {
            let keepGoing = this.craftOperation.tick(this);
            if ( !keepGoing ) {
                this.craftOperation = null;
            }
        }
    }

    stop() {
        if ( this.craftOperation ) {
            this.tf.console.appendLine('You stopped the crafting operation.', 'tip');
            this.craftOperation.receivedStop = true;
        }
    }

    getSaveData() {
        let data = {};
        data.id = this.deviceClass.id;
        data.name = this.name;
        if ( this.craftOperation && !this.craftOperation.interactive ) {
            let co = this.craftOperation;
            data.craftOperation = {
                itemProgress: co.itemProgress,
                progress: co.progress,
                recipeId: co.recipe.id,
                craftedQty: co.craftedQty,
                desiredQty: co.desiredQty,
                itemId: co.item.id
            };
        }

        // subclasses can add more
        return data;
    }

    loadFromData(data) {
        if ( data.craftOperation ) {
            let co = data.craftOperation;
            let recipe = this.tf.crafting.findRecipe(this.deviceClass.id, co.recipeId);
            let item = this.tf.items.get(co.itemId);
            if ( recipe && item ) {
                this.craftOperation = new CraftOperation(recipe, item, co.desiredQty);
                this.craftOperation.itemProgress = co.itemProgress;
                this.craftOperation.progress = co.progress;
                this.craftOperation.craftedQty = co.craftedQty;
            }
        }
    }
}

class CraftOperation
{
    constructor(recipe, item, qty) {
        this.receivedStop = false;
        
        this.itemProgress = 0;
        this.progress = 0;

        this.recipe = recipe;
        this.craftedQty = 0;
        this.desiredQty = qty;
        this.item = item;
        
        this.staminaDrain = recipe.stamina / recipe.time;
        this.powerDrain = recipe.power / recipe.time;

        this.interactive = false;
    }

    tick(device) {
        const tf = device.tf;

        if ( this.receivedStop ) {
            return false;
        }

        // check stamina
        if ( tf.player.stamina < this.staminaDrain ) {
            return true;
        }

        // check power
        if ( tf.power < this.powerDrain ) {
            return true;
        }

        // check for this tick's required items.
        // the desired qty is just 1 over the total ticks required.
        if ( !this.recipe.canCraft(tf.player.inventory, 1 / this.recipe.time) ) {
            return true;
        }

        // take from power and inventory
        tf.player.stamina -= this.staminaDrain;
        tf.power -= this.powerDrain;
        this.recipe.pullFromInventory(tf.player.inventory, 1 / this.recipe.time);

        // increment all progress types and update the UI
        this.itemProgress++;
        this.progress++;

        if ( this.item.category === 'support' ) {
            tf.support.incrementProgress(this.item.id);
        } else if ( this.item.category === 'device' ) {
            tf.devices.incrementProgress(this.item.id);
        }

        // For inventory recipe outputs, increment the output values.
        Object.keys(this.recipe.output).forEach(itemId => {
            const item = tf.items.get(itemId);
            const qty = this.recipe.output[itemId];
            if ( item.category === 'item' ) {
                tf.player.addItemStack(item.stack(qty / this.recipe.time));
            }
        });

        // Finished a single recipe
        if ( this.itemProgress >= this.recipe.time ) {
            // Inventory is updated incrementally, so this is just for finishing construction on supports/devices.
            Object.keys(this.recipe.output).forEach(itemId => {
                const item = tf.items.get(itemId);
                if ( item.category === 'support' ) {
                    tf.support.finishConstruction(item.id);
                } else if ( item.category === 'device' ) {
                    tf.devices.finishConstruction(item.id);
                }
            });

            // Increment the # of crafted recipes
            this.craftedQty++;

            // If we're done, return false.
            if ( this.craftedQty >= this.desiredQty ) {
                if ( this.interactive ) {
                    tf.console.appendLine(`You've finished building the ${this.item.name}!`, 'tip');
                }
                return false;
            } else {
                // Not done yet.
                // Start the next recipe. For devices and support, we need to check land and start new construction.
                this.itemProgress = 0;

                if ( this.item.category === 'support' ) {
                    tf.support.startConstruction(item.id);
                } else if ( this.item.category === 'device' ) {
                    // allocate the land for this. have to do this when each new item is being built since
                    // only one can be in progress at the same time.
                    if ( this.item.land > tf.freeLand() ) {
                        return false;
                    }
                    tf.land += this.item.land;
                    
                    tf.devices.startConstruction(this.item.id);
                }
            }
        }

        return true;
    }
}

class QuitCommand extends BaseCommand
{
    constructor() {
        super();
        this.name = 'quit';
        this.patterns = [true];
    }

    run(tf, args) {
        tf.devices.current = null;
        tf.console.appendLine('You stopped using the device.', 'tip');
        tf.console.processor = tf.console.rootProcessor;
        tf.console.setPs1('home$');
    }
}

class DismantleCommand extends BaseCommand
{
    constructor() {
        super();
        this.name = 'dismantle';
        this.patterns = [true];
    }

    run(tf, args) {
        let device = tf.devices.current;
        let deviceId = device.deviceClass.id;
        let drops = tf.items.get(deviceId).drops;

        tf.console.appendLine(`You destroyed this device.`);
        Object.entries(drops).forEach(kv => {
            let item = tf.items.get(kv[0]);
            tf.player.addItemStack(item.stack(kv[1]));
            tf.console.appendLine(`- Reclaimed ${item.name} (${kv[1]})`);
        });

        tf.devices.destroy(device);
    }
}

/**
 * Works similar to the build command, but is flexible enough to create items, support, and devices.
 * It can also create multiple items at a time.
 * Should include a status line saying "working" or "paused (reason)".
 * If it's used to make devices, and you run out of land, then it SHOULD stop, not just pause.
 * 
 * If the device consumes power and not stamina, the command does NOT lock the console, and also
 * needs to tell the device to start working on the recipe. tf.devices.current contains the device
 * instance we are currently using. Probably don't show a progress bar or status if it does not lock,
 * instead note that it's running in the background. In the future we can put status in the sidebar
 * in the devices tab via the device's renderList() method. The tick() method in the device will
 * be responsible for reducing power and input items, and creating output items.
 * 
 * The stop command when used in the device should stop any background crafting.
 * The console handler will try to find and call a stop() method on the device instance.
 * 
 * Note that it should run in the background if there is no stamina usage, even if no power is used.
 * Like brick forming is just waiting for it to dry.
 * 
 * BIG NOTE: Devices that can make other support/devices will likely have to be limited to 1.
 * Otherwise you could have more than one of a single device type in progress which isn't possible.
 * Either that or we have to update itemProgress in commands to always use the progress in the
 * devices/supports registry.
 */
export class DeviceMakeCommand extends BaseCommand
{
    constructor(deviceId, interactive) {
        super();

        this.name = 'make';
        this.patterns = [
            /^(?<qty>\d+)\s+(?<name>.+)$/,
            /^(an?\s+)?(?<name>.+)$/
        ];
        
        this.deviceId = deviceId;
        this.interactive = interactive;

        this.receivedStop = false;
        
        this.itemProgress = 0;
        this.progress = 0;
        this.progressLine = null;

        this.recipe = null;
        this.craftedQty = 0;
        this.desiredQty = 1;
        this.item = null;
        
        this.staminaDrain = 0;
        this.powerDrain = 0;

        this.operation = null;
    }

    help() {
        return [
            'make [qty] item name',
            'Uses the device to create an item or a structure. Unlike making things in your hand,',
            'all the items are not required up front, it will just consume a small amount per tick',
            'and will only proceed if all requirements are met.'
        ].join("\n");
    }

    run(tf, args) {
        this.recipe = null;

        let qty = args.qty || 1;
        let itemName = args.name;

        // make sure the item exists
        let item = tf.items.find(itemName);
        if ( !item ) {
            return [false, "You can't make " + an(itemName) + "."];
        }

        let recipe = tf.crafting.findRecipeByOutput(this.deviceId, item.id);
        if ( !recipe ) {
            return [false, "You can't make " + an(itemName) + "."];
        }

        // We need to check the registry of Support and Device to see if there's any partially completed
        // objects of this type. if so, resume that instead of making a totally new one.
        let makeNew = true;
        if ( item.category === 'support' ) {
            makeNew = !tf.support.hasIncomplete(item.id);
        } else if ( item.category === 'device' ) {
            makeNew = !tf.devices.hasIncomplete(item.id);
        }

        // check land requirements
        if ( makeNew && item.category === 'device' && (item.land * qty) > tf.freeLand() ) {
            return [false, "There's not enough room to build this."];
        }

        // no need to check for missing items

        // reset props
        this.receivedStop = false;
        this.progress = 0;
        this.itemProgress = 0;
        this.craftedQty = 0;
        this.desiredQty = qty;

        // create a progress bar, and update the UI for stamina regen
        this.recipe = recipe;
        this.item = item;

        if ( makeNew ) {
            if ( this.interactive ) {
                tf.console.appendLine(`You started building ${an(item.name)}.`);
            } else {
                tf.console.appendLine(`You set up the ${item.name} recipe in the device.`);
            }
        } else {
            tf.console.appendLine(`You resumed construction of the ${item.name}.`);
            if ( item.category === 'support' ) {
                this.itemProgress = tf.support.getProgress(item.id);
            } else if ( item.category === 'device' ) {
                this.itemProgress = tf.devices.getProgress(item.id);
            }
            this.progress = this.itemProgress;
        }

        if ( makeNew ) {
            if ( item.category === 'support' ) {
                tf.support.startConstruction(item.id);
            } else if ( item.category === 'device' ) {
                tf.devices.startConstruction(item.id);

                // allocate the land for this. have to do this when each new item is being built since
                // only one can be in progress at the same time.
                tf.land += this.item.land;
            }
        }

        if ( this.interactive ) {
            this.runInteractive(tf, args);
        } else {
            this.runBackground(tf, args);
        }

        if ( this.interactive ) {
            this.progressLine = tf.console.appendLine(progressBar(this.progress, recipe.time, 100));
        }
    }

    runInteractive(tf, args) {
        tf.console.lock(this);

        this.staminaDrain = this.recipe.stamina / this.recipe.time;
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

    runBackground(tf, args) {
        // The current device instance being used
        let device = tf.devices.current;

        // give the device a crafting operation. we COULD check to see if it's non-null and tell the
        // user to stop the current one. or even show a message saying it's stopping the old recipe.
        device.craftOperation = new CraftOperation(this.recipe, this.item, this.desiredQty);
        device.craftOperation.itemProgress = this.itemProgress;
        device.craftOperation.progress = this.progress;
    }

    stop(tf) {
        this.receivedStop = true;
        tf.console.appendLine("You decided to take a break for now.");
    }

    tick(tf) {
        if ( this.receivedStop ) {
            return false;
        }

        // check stamina
        if ( tf.player.stamina < this.staminaDrain ) {
            return true;
        }

        // check for this tick's required items.
        // the desired qty is just 1 over the total ticks required.
        if ( !this.recipe.canCraft(tf.player.inventory, 1 / this.recipe.time) ) {
            return true;
        }

        // take from stamina and inventory
        tf.player.stamina -= this.staminaDrain;
        this.recipe.pullFromInventory(tf.player.inventory, 1 / this.recipe.time);

        // increment all progress types and update the UI
        this.itemProgress++;
        this.progress++;
        this.updateProgress();

        if ( this.item.category === 'support' ) {
            tf.support.incrementProgress(this.item.id);
        } else if ( this.item.category === 'device' ) {
            tf.devices.incrementProgress(this.item.id);
        }

        // For inventory recipe outputs, increment the output values.
        Object.keys(this.recipe.output).forEach(itemId => {
            const item = tf.items.get(itemId);
            let qty = this.recipe.output[itemId];
            if ( item.tool ) {
                qty = Math.round(qty * tf.player.toolMakingMultiplier(itemId));
            }
            if ( item.category === 'item' ) {
                tf.player.addItemStack(item.stack(qty / this.recipe.time));
            }
        });

        // Finished a single recipe
        if ( this.itemProgress >= this.recipe.time ) {
            // Inventory is updated incrementally, so this is just for finishing construction on supports/devices.
            Object.keys(this.recipe.output).forEach(itemId => {
                const item = tf.items.get(itemId);
                if ( item.category === 'support' ) {
                    tf.support.finishConstruction(item.id);
                } else if ( item.category === 'device' ) {
                    tf.devices.finishConstruction(item.id);
                } else {
                    if ( item.tool ) {
                        tf.player.toolCrafted(itemId);
                    }
                }
            });

            // Increment the # of crafted recipes and update UI
            this.craftedQty++;
            this.updateProgress();

            // If we're done, return false.
            if ( this.craftedQty >= this.desiredQty ) {
                tf.console.appendLine(`You've finished building the ${this.item.name}!`, 'tip');
                return false;
            } else {
                // Not done yet.
                // Start the next recipe. For devices and support, we need to check land and start new construction.
                this.itemProgress = 0;

                if ( this.item.category === 'support' ) {
                    tf.support.startConstruction(item.id);
                } else if ( this.item.category === 'device' ) {
                    // allocate the land for this. have to do this when each new item is being built since
                    // only one can be in progress at the same time.
                    if ( this.item.land > tf.freeLand() ) {
                        return false;
                    }
                    tf.land += this.item.land;
                    
                    tf.devices.startConstruction(this.item.id);
                }
            }
        }

        return true;
    }

    updateProgress() {
        this.progressLine.text(progressBar(
            this.progress, this.recipe.time * this.desiredQty, 90) + ` ${this.craftedQty}/${this.desiredQty}`);
    }
}