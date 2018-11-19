import { BaseCommand } from './base';

export class HelpCommand extends BaseCommand
{
    constructor(registry) {
        super();
        this.name = 'help';
        this.patterns = [
            /^(?<cmd>[A-Za-z0-9?]+)$/,
            true
        ];

        this.registry = registry;
    }

    help() {
        return "help [command]";
    }

    run(tf, args) {
        console.log(args);
        if ( args.cmd ) {
            let cmd = this.registry.find(args.cmd);
            if ( !cmd ) {
                return [false, 'Command ' + args.cmd + ' not found.'];
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