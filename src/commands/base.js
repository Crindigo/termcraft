export class CommandHistory
{
    constructor() {
        this.list = [''];
        this.index = 0;
    }

    add(value) {
        if ( value != '' && (this.list.length < 2 || this.list[this.list.length - 2] != value) ) {
            this.list[this.list.length - 1] = value;
        }
        if ( this.list[this.list.length - 1] != '' ) {
            this.list.push(''); // current new line
        }
        this.index = this.list.length - 1;
    }

    navigate(value, isUp) {
        this.list[this.index] = value;
        if ( isUp ) {
            this.index--;
        } else {
            this.index++;
        }

        if ( this.index < 0 ) {
            this.index = 0;
        }
        if ( this.index >= this.list.length ) {
            this.index = this.list.length - 1;
        }

        return this.list[this.index];
    }
}

export class CommandProcessor
{
    constructor(tf, registry) {
        this.tf = tf;
        this.registry = registry;
    }

    splitCmdLine(cmdline) {
        cmdline = cmdline.trim().replace(/\s{2,}/g, ' ');
        const parts = cmdline.split(' ');
        const progName = parts[0];
        const args = parts.length > 1 ? parts.slice(1).join(' ') : '';
        return [progName, args];
    }

    parseCommand(cmd, args) {
        let parseResult = [];
        let found = cmd.patterns.some(reg => {
            if ( reg === true ) {
                return true;
            }

            const result = args.match(reg);
            if ( result ) {
                if ( result.groups ) {
                    parseResult = result.groups;
                } else {
                    parseResult = Array.from(result);
                }
                return true;
            }
            return false;
        });

        return found ? parseResult : false;
    }

    run(cmdline) {
        // collapse to single space
        let [progName, args] = this.splitCmdLine(cmdline);
        console.log(progName, args);

        // Find the command by name/alias
        let cmd = this.registry.find(progName);
        if ( !cmd ) {
            return [false, 'Unknown command'];
        }

        // Look for a matching pattern that the command can handle, and send the parsed command line
        // to the run method.
        let parseResult = this.parseCommand(cmd, args);

        // Show help if the pattern is not found or the args is -h or --help
        if ( parseResult === false || args.match(/^-h|--help$/) ) {
            this.tf.console.appendLine(cmd.help());
            return;
        }

        return cmd.run(this.tf, parseResult);
    }
}

export class CommandRegistry
{
    constructor() {
        this.allCommands = {};
        this.commands = {};
        this.aliases = {};
        this.aliasList = {};
    }

    // Make the command usable, presumably after research is completed
    unlock(name) {
        this.commands[name] = this.allCommands[name];
    }

    add(command, unlocked = false) {
        this.allCommands[command.name] = command;
        if ( unlocked ) {
            this.unlock(command.name);
        }
    }

    find(prog) {
        if ( this.aliases[prog] ) {
            prog = this.aliases[prog];
        }
        return this.commands[prog] || null;
    }

    alias(command, alias) {
        if ( !(alias instanceof Array) ) {
            alias = [alias];
        }
        this.aliasList[command] = this.aliasList[command] || [];

        alias.forEach(a => {
            this.aliasList[command].push(a);
            this.aliases[a] = command;
        });
    }
}

export class BaseCommand
{
    constructor() {
        this.name = '';
        this.patterns = [];
    }

    run(tf, args) {

    }

    help() {
        return "";
    }
}