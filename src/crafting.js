import { tagRegexp, itemMatchesTagSpec } from './utils';

/**
 * Manages recipes that have multiple inputs and one unique output.
 */
export class Crafting
{
    constructor(tf) {
        this.tf = tf;

        this.sets = {};
        const context = require.context('./data/recipes', true, /\.json$/);
        context.keys().forEach(key => this.addRecipes(key, context(key)));
    }

    addRecipes(key, recipeMap) {
        for ( let id in recipeMap ) {
            if ( id === '//' ) {
                continue;
            }
            
            this.addRecipe(id, recipeMap[id]);
            console.log('[Recipes] Loaded ' + key + '|' + id);
        }
    }

    addRecipe(id, recipeData) {
        const recipe = new Recipe(id, recipeData);
        const device = recipe.device;

        if ( this.sets[device] === undefined ) {
            this.sets[device] = new RecipeSet();
        }
        this.sets[device].addRecipe(recipe);
    }

    findRecipe(device, id) {
        return this.sets[device] ? this.sets[device].find(id) : null;
    }

    findRecipeByName(device, name) {
        const item = this.tf.items.find(name);
        console.log(item);
        if ( item ) {
            name = item.id;
        }
        return this.sets[device] ? this.sets[device].findByName(name) : null;
    }

    getAvailableRecipes(device, inventory) {
        return this.sets[device] ? this.sets[device].getAvailableRecipes(inventory) : [];
    }
}

/**
 * A set of recipes. The crafting manager organizes recipes into multiple sets segmented by device.
 */
class RecipeSet
{
    constructor() {
        // recipes indexed by id
        this.registry = {};

        // recipes indexed by output item name
        this.nameRegistry = {};
    }

    addRecipe(recipe) {
        this.registry[recipe.id] = recipe;
        this.nameRegistry[recipe.outputName] = recipe;
    }

    find(id) {
        return this.registry[id] || null;
    }

    findByName(name) {
        console.log(this.nameRegistry, name);
        return this.nameRegistry[name] || null;
    }

    getAvailableRecipes(inventory) {
        let avail = Object.values(this.registry).filter(r => r.canCraft(inventory.indexed));
        avail.sort((a, b) => a.outputName.localeCompare(b.outputName));
        return avail;
    }
}

class Recipe
{
    constructor(id, recipeData) {
        this.id = id;

        this.device = recipeData.device;
        this.time = recipeData.time;
        this.stamina = recipeData.stamina;
        this.input = recipeData.input;
        this.output = recipeData.output;
        
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

    canCraft(items, desiredQty = 1) {
        return Object.entries(this.input).every(kv => {
            let key = kv[0];
            let qty = kv[1];

            // key can be "item_id" or "tag:tag_name" or "tag:tag_name[x,y)"
            let m = key.startsWith("tag:") && key.match(tagRegexp);
            if ( m ) {
                // need to look for an item matching the spec. items is a map of id => stack.
                // hopefully this isn't slow. if it is we could theoretically get every tag spec in the
                // game for gathers, recipes, etc. and generate a list of matching item IDs in its place.
                return Object.values(items).some(st => itemMatchesTagSpec(st.item, m.groups, key) && st.qty >= qty * desiredQty);
            } else {
                // key is just a plain item id. return true if it's in items and qty is good.
                return items[key] && items[key].qty >= qty * desiredQty;
            }
        });
    }
}
