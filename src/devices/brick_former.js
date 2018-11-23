import { BaseDeviceClass, BaseDevice } from "./base";

export class BrickFormerClass extends BaseDeviceClass
{
    constructor(tf) {
        super(tf);

        this.id = 'brick_former';
        this.addRecipeSupport('brick_former', false);
    }

    newDevice(name) {
        return new BrickFormer(this, name);
    }

    loadDevice(data) {
        let device = this.newDevice(data.name);
        return device;
    }
}

export class BrickFormer extends BaseDevice
{
    constructor(deviceClass, name) {
        super(deviceClass, name);
    }

    tick() {
        super.tick();
    }
}