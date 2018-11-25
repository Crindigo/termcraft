//import Food from './data/items/food.json';
import { Item } from './inventory';
const isString = require('lodash/isString');

export class Items
{
    constructor(tf) {
        this.tf = tf;

        const context = require.context('./data/items', true, /\.json$/);
        this.registry = {};
        this.nameRegistry = {};
        
        this.searchRegistries = [];
        this.animalList = this.makeSearchRegistry(item => item.animal === true);
        this.fluidList = this.makeSearchRegistry(item => item.fluid === true);
        this.toolList = this.makeSearchRegistry(item => item.tool === true);
        this.edibleList = this.makeSearchRegistry(item => item.edible === true);
        this.deviceList = this.makeSearchRegistry(item => item.category === "device");
        this.supportList = this.makeSearchRegistry(item => item.category === "support");

        context.keys().forEach(key => this.addItems(key, context(key)));
        console.log(`[Items] ${Object.keys(this.registry).length} total items`);
    }

    addItems(key, itemMap) {
        let ids = Object.keys(itemMap).filter(id => id !== '//');
        ids.forEach(id => {
            this.register(id, itemMap[id]);
        });

        console.log(`[Items] Loaded ${ids.length} items from ${key.substr(2)}: ${ids.join(', ')}`);
    }

    register(id, itemData) {
        // allow simple material definitions of "item_id": "item name"
        if ( isString(itemData) ) {
            itemData = {"name": itemData};
        }

        const item = new Item(id, itemData);
        if ( this.registry[id] ) {
            console.error('[Items] WARNING: Item ID "' + id + '" already exists.');
        }
        this.registry[id] = item;

        if ( this.nameRegistry[item.name] ) {
            console.error('[Items] WARNING: Item name "' + item.name + '" already exists.');
        }
        this.nameRegistry[item.name] = item;

        this.searchRegistries.forEach(reg => reg.add(item));
    }

    get(id) {
        return this.registry[id];
    }

    find(idOrName) {
        return this.registry[idOrName] || this.nameRegistry[idOrName] || null;
    }

    exists(idOrName) {
        return this.registry[idOrName] !== undefined || this.nameRegistry[idOrName] !== undefined;
    }

    stack(id, qty = 1) {
        return this.registry[id].stack(qty);
    }

    makeSearchRegistry(matchFn) {
        let reg = new class extends SearchRegistry {
            matches(item) {
                return matchFn(item);
            }
        }
        this.searchRegistries.push(reg);
        return reg;
    }
}

class SearchRegistry
{
    constructor() {
        this.items = [];
    }

    add(item) {
        if ( this.matches(item) ) {
            this.items.push(item);
        }
    }

    matches(item) {
        return false;
    }
}