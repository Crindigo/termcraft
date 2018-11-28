import { BaseCommand } from './base';

export class HelpCommand extends BaseCommand
{
    constructor(registry) {
        super();
        this.name = 'help';
        this.patterns = [
            /^([A-Za-z0-9?]+)$/,
            true
        ];

        this.registry = registry;
    }

    help() {
        return "help [command]";
    }

    run(tf, args) {
        if ( args[1] ) {
            let cmd = this.registry.find(args[1]);
            if ( !cmd ) {
                return [false, 'Command ' + args[1] + ' not found.'];
            }
            return [true, cmd.help()];
        } else {
            let lines = ["Available commands:"];
            let cmds = Object.values(this.registry.commands);
            cmds.sort((a, b) => a.name.localeCompare(b.name));
            cmds.forEach(cmd => {
                if ( cmd ) {
                    let aliases = this.registry.aliasList[cmd.name] || [];
                    lines.push("- " + cmd.name + (aliases.length ? (' (aliases: ' + aliases.join(', ') + ')') : ''));
                }
            });
            return [true, lines];
        }
    }
}