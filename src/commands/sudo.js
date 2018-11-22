import { BaseCommand } from './base';

export class SudoCommand extends BaseCommand
{
    constructor() {
        super();

        this.name = 'sudo';
        this.patterns = [
            true
        ];
    }

    help() {
        return 'Nothing to see here.';
    }

    run(tf, args) {
        tf.console.appendLine('Oh look, an easter egg. Nobody saw THAT one coming.');
        tf.console.appendLine('The REAL admin tool is the {!b}tf{/} variable in your browser\'s dev console :)');

        tf.console.setPs1('home#');
    }
}