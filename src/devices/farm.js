import { BaseDeviceClass, BaseDevice } from "./base";

export class FarmClass extends BaseDeviceClass
{
    constructor(tf) {
        super(tf, 'farm');
    }

    newDevice(name) {
        return new Farm(this, name);
    }
}

export class Farm extends BaseDevice
{
    constructor(deviceClass, name) {
        super(deviceClass, name);
    }

    tick() {
        super.tick();
    }
}