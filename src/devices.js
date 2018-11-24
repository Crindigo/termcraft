import { BaseDevice } from './devices/base';
import { ChoppingBlockClass } from './devices/chopping_block';
import { BrickFormerClass } from './devices/brick_former';

export class Devices
{
    constructor(tf) {
        this.tf = tf;
        
        // we need a registry to keep track of all completed and partial structures.
        // when using the build command it will check partial structures and resume if necessary.
        // this data will be persisted in the save file.
        // support entries can stack, but devices are all unique.

        this.deviceClasses = {
            'chopping_block': new ChoppingBlockClass(this.tf),
            'brick_former': new BrickFormerClass(this.tf)
        };

        // completed device entries, unique name -> BaseDevice
        this.activeRegistry = {};

        // flat array of BaseDevice sorted by name, for the UI
        this.activeCache = [];

        // incomplete device entries. device id -> progress.
        // only one of each device type can be in construction at a time so this is fine.
        this.partialRegistry = {};
        this.partialCache = [];

        // Map of device id to the # of times it's been built. for initial name gen.
        // needs to be in the save file.
        this.buildCounts = {};

        this.currentCounts = {};

        // Reference to the current device being used via use command.
        this.current = null;
    }

    find(name) {
        return this.activeRegistry[name] || null;
    }

    startConstruction(id) {        
        this.partialRegistry[id] = 0;
        this.rebuildCache();
    }

    incrementProgress(id) {
        this.partialRegistry[id]++;
    }

    getProgress(id) {
        return this.partialRegistry[id];
    }

    finishConstruction(id) {
        delete this.partialRegistry[id];

        if ( !this.buildCounts[id] ) {
            this.buildCounts[id] = 0;
        }
        this.buildCounts[id]++;

        // we need to make a new device instance and give it a unique name.
        let name = this.makeName(id);
        
        let device = this.deviceClasses[id].newDevice(name);
        this.activeRegistry[name] = device;

        this.rebuildCache();
        return name;
    }

    makeName(id) {
        return id + '_' + this.buildCounts[id];
    }

    rename(oldName, newName) {
        // new name already exists or old name does not exist
        if ( this.activeRegistry[newName] || !this.activeRegistry[oldName] ) {
            return false;
        }

        let device = this.activeRegistry[oldName];
        // don't let it be named device_id_1234 to avoid collision. probably better ways to do this.
        if ( newName.startsWith(device.id + '_') && newName.match(/\d+$/) ) {
            return false;
        }

        delete this.activeRegistry[oldName];
        this.activeRegistry[newName] = device;
        this.rebuildCache();
    }

    destroy(device) {
        delete this.activeRegistry[device.name];
        this.rebuildCache();
    }

    hasIncomplete(id) {
        return this.partialRegistry.hasOwnProperty(id);
    }

    rebuildCache() {
        // simply get the device instances and sort by name.
        let cache = Object.values(this.activeRegistry);
        cache.sort((a, b) => a.name.localeCompare(b.name));
        this.activeCache = cache;

        let inactive = Object.keys(this.partialRegistry).map(id => this.tf.items.get(id).name);
        inactive.sort((a, b) => a.localeCompare(b));
        this.partialCache = inactive;

        this.currentCounts = {};
        cache.forEach(d => {
            if ( !this.currentCounts[d.id] ) {
                this.currentCounts[d.id] = 0;
            }
            this.currentCounts[d.id]++;
        });

        this.tf.events.checkAll(); // handle device events
    }

    tick() {
        // tick in order of name... maybe this allows creative solutions?
        this.activeCache.forEach(device => device.tick());
    }
}