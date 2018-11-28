import { BaseCommand } from './base';

export class TestCommand extends BaseCommand
{
    constructor() {
        super();
        this.name = 'test';
        this.patterns = [
            /^(\d+)\s+(.+)$/,
            /^(.+)/
        ];
    }

    help() {
        return "hello this is help\nsecond line?";
    }

    run(tf, args) {
        return [true, "Qty: " + (args[1] || 1) + " Item: " + args[2]];
    }
}