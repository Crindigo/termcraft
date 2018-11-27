import { tagRegexp, itemMatchesTagSpec } from './utils';
import sortedIndexBy from 'lodash/sortedIndexBy';

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
        this.flavor = info.flavor || 'Who needs flavor text anyway?';
        this.alphaIndex = 0;
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
        this.landBonus = info.landBonus || 0;
        this.researchBonus = info.researchBonus || 0;
        this.logBase = info.logBase || Math.E;

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
        return other && this.item.id === other.item.id;
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

    round() {
        // round it off to 6 digits past the decimal.
        // we get 15 significant digits of precision with doubles, and we have a hard-coded
        // maximum quantity of 999,999,999.
        this.qty = Math.round(this.qty * 1000000) / 1000000;

        // if the qty is within 0.0005 of a whole number, round to it.
        const whole = Math.round(this.qty);
        if ( Math.abs(this.qty - whole) < 0.0005 ) {
            this.qty = whole;
        }
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

        // Enables change tracking for optimized UI updates instead of full list renders
        this.enableTracking = false;
        this.changes = [];
    }

    add(stack) {
        let foundStack = this.indexed[stack.item.id] || null;

        if ( foundStack ) {
            if ( this.enableTracking ) {
                let pos = sortedIndexBy(this.items, foundStack, s => s.item.alphaIndex);
                this.changes.push(['update', pos, foundStack]);
            }

            foundStack.qty += stack.qty;
            if ( foundStack.qty > 999999999 ) {
                foundStack.qty = 999999999;
            }
            foundStack.round();
            return foundStack;
        } else {
            // instead of pushing to the end and sorting, find the insert position and splice it in.
            let pos = sortedIndexBy(this.items, stack, s => s.item.alphaIndex);
            this.items.splice(pos, 0, stack);

            if ( this.enableTracking ) {
                this.changes.push(['insert', pos, stack]);
            }

            //this.items.push(stack);
            //this.items.sort((a, b) => a.item.alphaIndex - b.item.alphaIndex);
            this.indexed[stack.item.id] = stack;
            stack.round();
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
        //let index = this.items.indexOf(stack);
        let pos = sortedIndexBy(this.items, stack, s => s.item.alphaIndex);

        // if that position exists in the list and it matches the given item
        if ( this.items[pos] && this.items[pos].item.alphaIndex === stack.item.alphaIndex ) {
            this.items.splice(pos, 1);
            delete this.indexed[stack.item.id];
            if ( this.enableTracking ) {
                this.changes.push(['delete', pos]);
            }
        }
    }

    reduce(stack, amount = 1, simulate = false) {
        let foundStack = this.indexed[stack.item.id];
        if ( !foundStack || foundStack.qty < amount ) {
            return false;
        }

        if ( !simulate ) {
            foundStack.qty -= amount;
            if ( foundStack.qty <= 0.000001 ) {
                foundStack.qty = 0;
            } else {
                foundStack.round();
            }

            if ( this.enableTracking ) {
                let pos = sortedIndexBy(this.items, foundStack, s => s.item.alphaIndex);
                this.changes.push(['update', pos, foundStack]);
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

    // Optimized syncing test

    getChanges() {
        let changes = this.changes;
        this.changes = [];
        return changes;
    }
}