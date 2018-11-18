import { BaseCommand } from './base';

export class HelpCommand extends BaseCommand
{
    constructor() {
        super();
        this.name = 'help';
        this.patterns = [
            /^(?<cmd>[A-Za-z0-9?]+)$/,
            true
        ];
    }

    help() {
        return "help [command]";
    }

    run(tf, args) {
        console.log(args);
        if ( args.cmd ) {
            let cmd = tf.console.registry.find(args.cmd);
            if ( !cmd ) {
                return [false, 'Command ' + args.cmd + ' not found.'];
            }
            return [true, cmd.help()];
        } else {
            let lines = ["Available commands:"];
            let cmds = Object.values(tf.console.registry.commands);
            cmds.sort((a, b) => a.name.localeCompare(b.name));
            cmds.forEach(cmd => {
                let aliases = tf.console.registry.aliasList[cmd.name] || [];
                lines.push("- " + cmd.name + (aliases ? (' (aliases: ' + aliases.join(', ') + ')') : ''));
            });
            return [true, lines];
        }
    }
}