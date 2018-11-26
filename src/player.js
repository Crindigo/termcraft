import { Inventory } from './inventory';
import { clamp } from './utils';
import mean from 'lodash/mean';

export class Player
{
    constructor(tf) {
        this.tf = tf;

        this.stamina = 100;
        this.maxStamina = 100;

        // Just a visual representation of the regen/loss
        this.staminaChange = 0;

        // the base regen, probably constant.
        this.baseStaminaRegen = 0.1;

        this.nutrition = {
            meat: 0,
            fruit: 0,
            vegetable: 0,
            dairy: 0,
            grain: 0
        };

        // Map of tool item ID to the # of times it was crafted
        this.toolMakingSkill = {};

        // the regen that gets modified by support structures.
        // this will be added to stamina every second.
        // technically this is never modified by support structures, it has a separate function that
        // adds stamina and modifies staminaChange.
        this.staminaRegen = this.baseStaminaRegen;
        this.staminaChange = this.staminaRegen * this.staminaMultiplier();

        this.inventory = new Inventory();
        this.inventory.enableTracking = true;
    }

    updateNutrition(item) {
        // subtract stamina change with old multiplier
        this.staminaChange -= this.staminaRegen * this.staminaMultiplier();

        Object.keys(this.nutrition).forEach(key => {
            if ( item.tags.includes(key) ) {
                this.nutrition[key] += item.staminaCap;
            } else {
                this.nutrition[key] -= item.staminaCap / 10;
            }
            // allow up to 10x
            this.nutrition[key] = clamp(this.nutrition[key], 0, 900);
        });

        // add stamina change with new multiplier
        this.staminaChange += this.staminaRegen * this.staminaMultiplier();
    }

    staminaMultiplier() {
        return 1 + this.nutritionBonus() / 100;
    }

    toolMakingMultiplier(itemId) {
        let bonus = this.toolMakingSkill[itemId] || 0;
        return clamp(1 + bonus / 100, 1, 2);
    }

    toolCrafted(itemId) {
        let skill = this.toolMakingSkill[itemId] || 0;
        this.toolMakingSkill[itemId] = skill + 1;
    }

    nutritionBonus() {
        return mean(Object.values(this.nutrition));
    }

    tick() {
        this.giveStamina(this.staminaRegen * this.staminaMultiplier());
    }

    giveStamina(value) {
        this.stamina = clamp(this.stamina + value, 0, this.maxStamina);
    }

    addItemStack(stack) {
        let st = this.inventory.add(stack);
        this.tf.events.onItemAdded(st);
    }

    findItemStack(item) {
        return this.inventory.findStack(item);
    }
}