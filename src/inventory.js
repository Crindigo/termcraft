/**
 * Structure for an item.
 */
export class Item
{
    constructor(id, info) {
        // base
        this.id = id;
        this.name = info.name;
        this.tags = info.tags || [];

        // tools
        this.tool = info.tool || false;
        this.breakChance = info.breakChance || 0;
        this.level = info.level || 0;

        // food
        this.edible = info.edible || false;
        this.time = info.time || 1;
        this.stamina = info.stamina || 0;
        this.staminaCap = info.staminaCap || 0;

        // support
        this.support = info.support || false;
        this.regen = info.regen || 0;
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
        let foundStack = null;
        this.items.some(s => {
            if ( s.itemsEqual(stack) ) {
                foundStack = s;
                return true;
            }
        });

        if ( foundStack ) {
            foundStack.qty += stack.qty;
        } else {
            this.items.push(stack);
            this.items.sort((a, b) => a.item.name.localeCompare(b.item.name));
            this.indexed[stack.item.id] = stack;
        }
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
}