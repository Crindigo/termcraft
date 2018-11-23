export class SaveManager
{
    constructor(tf) {
        this.tf = tf;
    }

    save(file = 'main') {
        let data = {};
        data.version = 1;

        data.unlockedResearch = tf.research.completedResearch;

        data.playerStamina = this.tf.player.stamina;
        data.playerMaxStamina = this.tf.player.maxStamina;

        // just store item id and quantity
        data.inventory = this.tf.player.inventory.items.map(stack => {
            return {"itemId": stack.item.id, "qty": stack.qty};
        });

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