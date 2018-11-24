import { tagRegexp, itemMatchesTagSpec } from './utils';

/**
 * Structure for an item.
 * 
 * Technically with all the shit I'm making into items, a better name would be Object. It's just
 * easier to have one registry of data, than be forced to lookup IDs in an item list, device list,
 * animal list, etc.
 */
export class Item
{
    constructor(id, info) {
        // base
        this.id = id;
        this.name = info.name;
        this.tags = info.tags || [];
        this.category = info.category || 'item';

        // tools
        this.tool = info.tool || false;
        this.level = info.level || 0;

        // food
        this.edible = info.edible || false;
        this.time = info.time || 1;
        this.stamina = info.stamina || 0;
        this.staminaCap = info.staminaCap || 0;
        this.leftovers = info.leftovers || {}; // items gained after eating.

        // fluid
        this.fluid = info.fluid || false;

        // animal
        this.animal = info.animal || false;
        this.size = info.size || 0;
        this.sheds = info.sheds || {};
        this.butchers = info.butchers || {};

        // support
        this.staminaRegen = info.staminaRegen || 0;
        this.land = info.land || 0;
        this.logBase = info.logBase || Math.E;
        this.researchBonus = info.researchBonus || 0;

        // devices
        this.land = info.land || 0;
        this.drops = info.drops || {};
    }

    stack(qty) {
        return new Stack(this, qty);
    }
}

/**
 * Structure for a stack of an item including its quantity. Like an inventory entry.
 */
class Stack
{
    constructor(item, qty) {
        this.item = item;
        this.qty = qty;
    }

    itemsEqual(other) {
        return other && this.item.id == other.item.id;
    }

    merge(other) {
        if ( !this.itemsEqual(other) ) {
            return null;
        }
        return this.uncheckedMerge(other);
    }

    uncheckedMerge(other) {
        return new Stack(this.item, this.qty + other.qty);
    }
}

/**
 * Class to manage a list of item stacks.
 */
export class Inventory
{
    constructor() {
        this.items = [];
        this.indexed = {};
    }

    add(stack) {
        let foundStack = this.indexed[stack.item.id] || null;

        if ( foundStack ) {
            foundStack.qty += stack.qty;
            return foundStack;
        } else {
            this.items.push(stack);
            this.items.sort((a, b) => a.item.name.localeCompare(b.item.name));
            this.indexed[stack.item.id] = stack;
            return stack;
        }
    }

    // tf.player.inventory.search(tf.items.animalList);
    search(searchRegistry) {
        return searchRegistry.items
            .map(item => this.findStack(item))
            .filter(stack => stack !== null);
    }

    findStackById(id) {
        return this.indexed[id] || null;
    }

    findQtyById(id) {
        let stack = this.findStackById(id);
        return stack ? stack.qty : 0;
    }

    findStack(item) {
        return this.indexed[item.id] || null;
        /*
        let foundStack = null;
        this.items.some(s => {
            if ( s.item.id == item.id ) {
                foundStack = s;
                return true;
            }
        });

        return foundStack;
        */
    }

    remove(stack) {
        let index = this.items.indexOf(stack);
        if ( index !== -1 ) {
            this.items.splice(index, 1);
            delete this.indexed[stack.item.id];
        }
    }

    reduce(stack, amount = 1, simulate = false) {
        if ( stack.qty < amount ) {
            return false;
        }

        if ( !simulate ) {
            stack.qty -= amount;
            if ( stack.qty <= 0 ) {
                this.remove(stack);
            }
        }
        return true;
    }

    accepts(stack) {
        return true;
    }

    /**
     * Finds all stacks matching the given tag and level range.
     * 
     * @param {string} tag 
     */
    findMatchingTag(tagSpec) {
        let m = tagSpec.match(tagRegexp);
        if ( !m ) {
            return [];
        }

        return this.items.filter(st => {
            return itemMatchesTagSpec(st.item, m.groups, tagSpec);
        });
    }
}