import { BaseCommand } from './base';

export class TestCommand extends BaseCommand
{
    constructor() {
        super();
        this.name = 'test';
        this.patterns = [
            /^(?<qty>\d+)\s+(?<item>.+)$/,
            /^(?<item>.+)/
        ];
    }

    help() {
        return "hello this is help\nsecond line?";
    }

    run(tf, args) {
        return [true, "Qty: " + (args.qty || 1) + " Item: " + args.item];
    }
}