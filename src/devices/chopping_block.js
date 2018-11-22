import { BaseDeviceClass, BaseDevice } from "./base";

export class ChoppingBlockClass extends BaseDeviceClass
{
    newDevice(name) {
        return new ChoppingBlock(this, name);
    }

    loadDevice(data) {
        let device = this.newDevice(data.name);
        return device;
    }
}

export class ChoppingBlock extends BaseDevice
{
    constructor(deviceClass, name) {
        super(deviceClass, name);
    }

    tick(tf) {

    }
}