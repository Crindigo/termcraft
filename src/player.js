import { Inventory } from './inventory';
import { clamp } from './utils';

export class Player
{
    constructor() {
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

        this.inventory = new Inventory();
    }

    tick(tf) {
        this.stamina = clamp(this.stamina + this.staminaRegen, 0, this.maxStamina);    
    }

    giveStamina(value) {
        this.stamina = clamp(this.stamina + value, 0, this.maxStamina);
    }

    addItemStack(stack) {
        this.inventory.add(stack);
    }

    findItemStack(item) {
        return this.inventory.findStack(item);
    }
}