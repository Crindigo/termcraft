import { tagRegexp, itemMatchesTagSpec } from './utils';
import { Inventory } from './inventory';

/**
 * Manages recipes that have multiple inputs and one unique output.
 */
export class Crafting
{
    constructor(tf) {
        this.tf = tf;

        this.sets = {};
        this.allRecipes = {};
        this.unlockedRecipes = {};

        // Maps of item ID to a list of recipes that take the item as input or give it as output.
        // Used for cycling recipes in the tooltips. Tooltip will check if the recipe ID is unlocked.
        this.indexByInput = {};
        this.indexByOutput = {};

        const context = require.context('./data/recipes', true, /\.json$/);
        context.keys().forEach(key => this.addRecipes(key, context(key)));

        console.log(`[Recipes] ${Object.keys(this.allRecipes).length} total recipes`);
    }

    addRecipes(key, recipeMap) {
        let ids = Object.keys(recipeMap).filter(id => id !== '//');
        ids.forEach(id => {
            this.addRecipe(id, recipeMap[id]);
        });
        console.log(`[Recipes] Loaded ${ids.length} recipes from ${key.substr(2)}: ${ids.join(', ')}`);
    }

    addRecipe(id, recipeData) {
        const recipe = new Recipe(id, recipeData);
        const device = recipe.device;

        if ( this.sets[device] === undefined ) {
            this.sets[device] = new RecipeSet(device);
        }
        this.sets[device].addRecipe(recipe);
        this.allRecipes[id] = recipe;

        Object.keys(recipe.input).forEach(itemId => {
            // if the input item is a tag, we have to flatten it to include all items matching the tag.
            let itemIds = [];
            let m = itemId.startsWith("tag:") && itemId.match(tagRegexp);
            if ( m ) {
                itemIds = Object.values(this.tf.items.registry)
                    .filter(item => itemMatchesTagSpec(item, m, itemId))
                    .map(item => item.id)
            } else {
                itemIds = [itemId];
            }

            itemIds.forEach(iid => {
                if ( !this.indexByInput[iid] ) {
                    this.indexByInput[iid] = [];
                }
                this.indexByInput[iid].push(recipe);
            });
        });

        Object.keys(recipe.output).forEach(itemId => {
            if ( !this.indexByOutput[itemId] ) {
                this.indexByOutput[itemId] = [];
            }
            this.indexByOutput[itemId].push(recipe);
        });
    }

    findRecipe(device, id) {
        if ( device === null ) {
            return this.allRecipes[id] || null;
        }
        return this.sets[device] ? this.sets[device].find(id) : null;
    }

    unlock(id) {
        let device = this.allRecipes[id].device;
        this.unlockedRecipes[id] = this.allRecipes[id];
        this.sets[device].unlock(id);
    }

    isUnlocked(id) {
        return !!this.unlockedRecipes[id];
    }

    findRecipeByName(device, name) {
        const item = this.tf.items.find(name);
        if ( item ) {
            name = item.id;
        }
        return this.findRecipeByOutput(device, name);
    }

    findRecipeByOutput(device, id) {
        if ( device === null ) {
            let found = null;
            Object.values(this.sets).some(set => {
                found = set.findByOutput(id);
                return !!found;
            });
            return found;
        }
        return this.sets[device] ? this.sets[device].findByOutput(id) : null;
    }

    allByInput(itemId, unlockedOnly = false) {
        let all = this.indexByInput[itemId] || [];
        if ( !unlockedOnly ) {
            return all;
        }
        return all.filter(recipe => this.isUnlocked(recipe.id));
    }

    allByOutput(itemId, unlockedOnly = false) {
        let all = this.indexByOutput[itemId] || [];
        if ( !unlockedOnly ) {
            return all;
        }
        return all.filter(recipe => this.isUnlocked(recipe.id));
    }

    getAvailableRecipes(device, inventory) {
        if ( device === null ) {
            let avail = Object.values(this.unlockedRecipes);
            avail.sort((a, b) => a.outputName.localeCompare(b.outputName));
            return avail;
        }
        return this.sets[device] ? this.sets[device].getAvailableRecipes(inventory) : [];
    }
}

/**
 * A set of recipes. The crafting manager organizes recipes into multiple sets segmented by device.
 */
class RecipeSet
{
    constructor(device) {
        this.device = device;

        this.fullRegistry = {};

        // recipes indexed by id
        this.registry = {};

        // recipes indexed by output item id
        this.outputRegistry = {};
    }

    addRecipe(recipe) {
        this.fullRegistry[recipe.id] = recipe;
    }

    unlock(id) {
        const recipe = this.fullRegistry[id];
        this.registry[recipe.id] = recipe;
        this.outputRegistry[recipe.outputName] = recipe;
    }

    find(id) {
        return this.registry[id] || null;
    }

    findByOutput(id) {
        return this.outputRegistry[id] || null;
    }

    getAvailableRecipes(inventory) {
        //let avail = Object.values(this.registry).filter(r => r.canCraft(inventory.indexed));
        let avail = Object.values(this.registry);
        avail.sort((a, b) => a.outputName.localeCompare(b.outputName));
        return avail;
    }
}

class Recipe
{
    constructor(id, recipeData) {
        this.id = id;

        this.device = recipeData.device || 'hand';
        this.time = recipeData.time || 1;
        this.stamina = recipeData.stamina || 0;
        this.power = recipeData.power || 0;
        this.ether = recipeData.ether || 0;
        this.input = recipeData.input || {};
        this.output = recipeData.output || {};
        this.name = recipeData.name || '';
        
        // we should allow giving recipes a name and just falling back to the first output item name.
        // that way we could still use these classes for multi-output recipes.
        if ( recipeData.name ) {
            this.outputName = recipeData.name;
        } else {
            this.outputName = Object.keys(this.output)[0];
            if ( this.outputName.includes(':') ) {
                this.outputName = this.outputName.split(':')[1];
            }
        }
    }

    pullFromInventory(inventory, desiredQty = 1) {
        // if the recipe has an input with tags, get all qualifying stacks and pull from the one with the highest qty.
        // if the input item is tool === true, do NOT remove the item here. Finishing the recipe can remove it though
        // if it's breakable.

        return Object.entries(this.input).map(kv => {
            let key = kv[0];
            let qty = kv[1] * desiredQty;
            let stack = null;

            let m = key.startsWith("tag:") && key.match(tagRegexp);
            if ( m ) {
                let stacks = inventory.findMatchingTag(key);
                if ( stacks.length > 0 ) {
                    // highest first
                    stacks.sort((a, b) => b.qty - a.qty);
                    stack = stacks[0];
                }
            } else {
                // simple item id
                stack = inventory.findStackById(key);
            }
            
            if ( !stack ) {
                return null;
            } else {
                inventory.reduce(stack, qty);
                return stack;
            }
        });
    }

    canCraft(items, desiredQty = 1) {
        if ( items instanceof Inventory ) {
            items = items.indexed;
        }
        return Object.entries(this.input).every(kv => {
            let key = kv[0];
            let qty = kv[1];

            // key can be "item_id" or "tag:tag_name" or "tag:tag_name[x,y)"
            let m = key.startsWith("tag:") && key.match(tagRegexp);
            if ( m ) {
                // need to look for an item matching the spec. items is a map of id => stack.
                // hopefully this isn't slow. if it is we could theoretically get every tag spec in the
                // game for gathers, recipes, etc. and generate a list of matching item IDs in its place.
                return Object.values(items).some(st => itemMatchesTagSpec(st.item, m, key) && st.qty >= qty * desiredQty);
            } else {
                // key is just a plain item id. return true if it's in items and qty is good.
                return items[key] && items[key].qty >= qty * desiredQty;
            }
        });
    }
}
