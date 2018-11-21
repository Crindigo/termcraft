import { BaseCommand } from './base';

/**
 * Like make, but for building structures like support and devices. Unlike make, you can
 * stop building a structure and resume it where you left off.
 * 
 * Also, we can allow construction to start even if all items are not available, by dividing
 * item requirements by time and taking X per tick. Fractional item quantities are A-OK. The
 * tick just won't do anything if all requirements aren't met, but it won't quit the process.
 */
export class BuildCommand extends BaseCommand
{
    constructor() {
        super();

        this.name = 'build';
        this.patterns = [

        ];
    }
}