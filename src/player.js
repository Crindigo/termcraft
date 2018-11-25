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

        // the regen that gets modified by support structures.
        // this will be added to stamina every second.
        this.staminaRegen = this.baseStaminaRegen;
        this.staminaChange = this.staminaRegen;

        this.nutrition = {
            meat: 0,
            fruit: 0,
            vegetable: 0,
            dairy: 0,
            grain: 0
        };

        this.inventory = new Inventory();
    }

    updateNutrition(item) {
        Object.keys(this.nutrition).forEach(key => {
            if ( item.tags.includes(key) ) {
                this.nutrition[key] += item.staminaCap;
            } else {
                this.nutrition[key] -= item.staminaCap / 10;
            }
            // allow up to 10x
            this.nutrition[key] = clamp(this.nutrition[key], 0, 900);
        });
    }

    staminaMultiplier() {
        return 1 + this.nutritionBonus() / 100;
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