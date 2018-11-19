//import Food from './data/items/food.json';
import { Item } from './inventory';

export class Items
{
    constructor(tf) {
        this.tf = tf;

        const context = require.context('./data/items', true, /\.json$/);
        this.registry = {};
        this.nameRegistry = {};

        context.keys().forEach(key => this.addItems(key, context(key)));
    }

    addItems(key, itemMap) {
        let count = 0;
        for ( let id in itemMap ) {
            if ( id === '//' ) {
                continue;
            }
            
            this.register(id, itemMap[id]);
            console.log('[Items] Loaded ' + key + '|' + id);
            count++;
        }
    }

    register(id, itemData) {
        const item = new Item(id, itemData);
        this.registry[id] = item;
        this.nameRegistry[item.name] = item;
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
}