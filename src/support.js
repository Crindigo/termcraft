/**
 * Manages support structures that give bonuses to stamina regen, combat strength,
 * research speed, building speed, and maybe others.
 */
export class Support
{
    constructor(tf) {
        this.tf = tf;
        
        // we need a registry to keep track of all completed and partial structures.
        // when using the build command it will check partial structures and resume if necessary.
        // this data will be persisted in the save file.
        // support entries can stack, but devices (not stored here) are all unique.

        // completed support entries, id -> qty.
        this.activeRegistry = {};
        this.activeCache = [];

        // incomplete support entries. id -> progress.
        this.partialRegistry = {};
        this.partialCache = [];

        this.totalStaminaRegen = 0;
        this.totalResearchBonus = 0;
        this.totalLandBonus = 0;
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

        if ( !this.activeRegistry[id] ) {
            this.activeRegistry[id] = 0;
        }
        this.activeRegistry[id]++;

        this.recalcBonuses();
        this.rebuildCache();
    }

    hasIncomplete(id) {
        return this.partialRegistry.hasOwnProperty(id);
    }

    recalcBonuses() {
        this.tf.player.staminaChange -= this.totalStaminaRegen;
        this.tf.maxLand -= this.totalLandBonus;

        this.totalStaminaRegen = 0;
        this.totalResearchBonus = 0;
        this.totalLandBonus = 0;

        Object.entries(this.activeRegistry).forEach(kv => {
            let data = this.tf.items.get(kv[0]);
            if ( kv[1] >= 1 ) {
                let multiplier = 1 + this.logBase(data.logBase, kv[1]);

                this.totalStaminaRegen += data.staminaRegen * multiplier;
                this.totalResearchBonus += data.researchBonus * multiplier;
                this.totalLandBonus += data.landBonus * multiplier;
            }
        });

        this.tf.player.staminaChange += this.totalStaminaRegen;
        this.tf.maxLand += this.totalLandBonus;

        this.tf.events.checkAll(); // handles support check and land check.
    }

    rebuildCache() {
        let cache = Object.entries(this.activeRegistry).map(kv => {
            return {"name": this.tf.items.get(kv[0]).name, "qty": kv[1]};
        });
        cache.sort((a, b) => a.name.localeCompare(b.name));
        this.activeCache = cache;

        let inactive = Object.keys(this.partialRegistry).map(id => this.tf.items.get(id).name);
        inactive.sort((a, b) => a.localeCompare(b));
        this.partialCache = inactive;
    }

    logBase(base, value) {
        return Math.log(value) / Math.log(base);
    }

    tick() {
        this.tf.player.giveStamina(this.totalStaminaRegen);
    }
}
