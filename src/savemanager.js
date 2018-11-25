export class SaveManager
{
    constructor(tf) {
        this.tf = tf;
    }

    save(file = 'main') {
        let data = {};
        data.version = 1;

        data.unlockedResearch = tf.research.completedResearch;
        data.completedEvents = tf.events.completedEvents;

        data.playerStamina = this.tf.player.stamina;
        data.playerMaxStamina = this.tf.player.maxStamina;

        // just store item id and quantity
        data.inventory = this.tf.player.inventory.items.map(stack => {
            return {"itemId": stack.item.id, "qty": stack.qty};
        }).filter(entry => entry.qty > 0.000001);

        data.partialSupport = this.tf.support.partialRegistry;
        data.activeSupport  = this.tf.support.activeRegistry;
        data.partialDevices = this.tf.devices.partialRegistry;
        data.deviceBuildCounts = this.tf.devices.buildCounts;

        data.activeDevices = [];
        Object.values(this.tf.devices.activeRegistry).forEach(d => {
            data.activeDevices.push(d.getSaveData());
        });

        window.localStorage.setItem(file, JSON.stringify(data));
    }

    load(file = 'main') {
        let saveData = window.localStorage.getItem(file);
        if ( !saveData ) {
            console.log('No save data in ' + file);
            return;
        }

        let data = JSON.parse(saveData);

        // Later on this should probably work so that you can load mid-game and it replaces all state with the 
        // saved state, instead of relying on a blank state.

        (data.completedEvents || []).forEach(eventId => this.tf.events.complete(eventId, true));

        data.unlockedResearch.forEach(rid => {
            if ( rid !== '_default_' ) {
                this.tf.research.complete(rid);
            }
        });

        this.tf.player.stamina = data.playerStamina;
        this.tf.player.maxStamina = data.playerMaxStamina;

        data.inventory.forEach(inv => {
            let item = this.tf.items.get(inv.itemId);
            if ( item && inv.qty > 0.000001 ) {
                this.tf.player.addItemStack(item.stack(inv.qty));
            }
        });

        this.tf.support.partialRegistry = data.partialSupport;
        this.tf.support.activeRegistry = data.activeSupport;
        this.tf.support.recalcBonuses();
        this.tf.support.rebuildCache();

        this.tf.devices.partialRegistry = data.partialDevices;
        this.tf.devices.buildCounts = data.deviceBuildCounts;

        this.tf.land = 0;

        data.activeDevices.forEach(d => {
            let dinfo = this.tf.items.get(d.id);
            let dclass = this.tf.devices.deviceClasses[d.id];
            if ( dclass && dinfo ) {
                let device = dclass.loadDevice(d);
                if ( device ) {
                    this.tf.devices.activeRegistry[device.name] = device;
                }

                this.tf.land += dinfo.land;
            }
        });

        this.tf.devices.rebuildCache();
    }
}
/*
For upgrades, store the save file version in the JSON data. Then an upgrade can migrate the save data to a new
version, auto unlocking new research, etc. If this happens, store the un-migrated JSON in a backup key in
local storage so if something went wrong it could be recovered and attempted again.

Save file needs to contain a list of unlocked research, player stamina & max stamina, player inventory,
the list of incomplete and complete support and device structures, and the build counts for devices so
unique names can still function. Persisted device instances need to include an ID so it knows how to 
recreate the proper instance on load. Land/exploration persistence TBD.
*/