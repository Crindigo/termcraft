import ResearchData from './data/research.json';
const intersection = require('lodash/intersection');

export class Research
{
    constructor(tf) {
        this.tf = tf;

        this.researchData = ResearchData;
        this.completedResearch = [];
        this.completedIndex = {};
        this.availableResearch = [];

        this.complete("_default_");
    }

    findByName(name) {
        let rid = null;
        this.availableResearch.some(id => {
            if ( this.researchData[id].name.toLowerCase() === name.toLowerCase() ) {
                rid = id;
                return true;
            }
            return false;
        });
        return this.create(rid);
    }

    get(id) {
        return this.create(id) || null;
    }

    create(id) {
        // really should have instances for each research item
        if ( !id || !this.researchData[id] ) {
            return null;
        }
        let tech = this.researchData[id];
        tech.id = id;
        return tech;
    }

    allAvailable() {
        let avail = this.availableResearch.map(id => this.researchData[id]);
        avail.sort((a, b) => a.name.localeCompare(b.name));
        return avail;
    }

    canResearch(research) {
        let items = this.tf.player.inventory.indexed;
        
        return Object.entries(research.items).every(kv => {
            let itemId = kv[0];
            let qty = kv[1];   
            return items[itemId] && items[itemId].qty >= qty;
        });
    }

    pullItems(research) {
        let inv = this.tf.player.inventory;
        
        return Object.entries(research.items).every(kv => {
            let itemId = kv[0];
            let qty = kv[1];   
            
            let stack = inv.findStackById(itemId);
            return stack && inv.reduce(stack, qty);
        });
    }

    complete(id) {
        const research = this.researchData[id];
        console.log('[Research] Completed ' + id);

        const unlocks = research.unlocks;
        let unlockedCmds = [];
        let unlockedRecipes = [];

        // unlock commands
        if ( unlocks.commands ) {
            unlocks.commands.forEach(cmd => {
                if ( !this.tf.console.registry.commands[cmd] ) {
                    console.log('[Research] Unlocked command ' + cmd);
                    this.tf.console.registry.unlock(cmd);
                    unlockedCmds.push(cmd);
                }
            });
        }

        // unlock recipes
        if ( unlocks.recipes ) {
            unlocks.recipes.forEach(re => {
                console.log('[Research] Unlocked recipe ' + re);
                this.tf.crafting.unlock(re);
                unlockedRecipes.push(re);
            });
        }

        // remove from available research list as it's finished
        let availIndex = this.availableResearch.indexOf(id);
        if ( availIndex >= 0 ) {
            this.availableResearch.splice(availIndex, 1);
        }

        // add it to completed research
        if ( !this.completedIndex[id] ) {
            this.completedResearch.push(id);
            this.completedIndex[id] = true;
            if ( id !== '_default_' ) {
                this.tf.events.checkAll();
            }
        }

        // recalculate available research
        return {
            research: this.refreshAvailable(),
            commands: unlockedCmds,
            recipes: unlockedRecipes
        };
    }

    refreshAvailable() {
        let unlocked = [];

        // go through all research and unlock everything that has all requirements met, and hasn't already been unlocked
        for ( let id in this.researchData ) {
            if ( !this.availableResearch.includes(id) && !this.completedResearch.includes(id) ) {
                let requirements = this.researchData[id].requires || [];
                if ( requirements.length === 0 ) {
                    // if the research has no requirements, it is special and is unlocked via other means.
                    continue;
                }

                // if the intersection of requirements and completed research is the same length as requirements,
                // then completed research has all the requirements already.
                if ( intersection(requirements, this.completedResearch).length === requirements.length ) {
                    console.log("[Research] Unlocked research " + id);
                    this.availableResearch.push(id);
                    unlocked.push(id);
                }
            }
        }
        
        return unlocked;
    }

    unlock(id) {
        if ( !this.availableResearch.includes(id) && !this.completedResearch.includes(id) ) {
            this.availableResearch.push(id);
        }
    }
}