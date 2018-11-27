import $ from 'jquery';
import Vue from 'vue';
import './assets/style.css';
import { numberFormatFull, numberFormatAbbr, progressBar, textFormat } from './utils';

import { TFConsole } from './console';
import { Player } from './player';
import { Items } from './items';
import { Crafting } from './crafting';
import { Research } from './research';
import { Support } from './support';
import { Devices } from './devices';
import { SaveManager } from './savemanager';
import { Events } from './events';

window.jQuery = $;
window.$ = $;

class TermFactory
{
    constructor() {
        this.vue = null;

        this.land = 0;
        this.maxLand = 10;

        this.power = 0;
        this.maxPower = 0;
        this.powerChange = 0;

        this.ether = 0;
        this.maxEther = 0;
        this.etherChange = 0;

        this.events = new Events(this);

        this.player = new Player(this);
        this.console = new TFConsole(this);
        this.items = new Items(this);
        this.crafting = new Crafting(this);

        this.support = new Support(this);
        this.devices = new Devices(this);

        // research needs to come after console and crafting as it can unlock commands/recipes
        this.research = new Research(this);

        this.saveManager = new SaveManager(this);
        this.saveManager.load('_autosave');
        this.saveTicker = setInterval(() => this.saveManager.save('_autosave'), 60000);

        this.ticker = setInterval(() => this.tick(), 1000);

        setTimeout(() => this.sync(), 0);
    }

    freeLand() {
        return this.maxLand - this.land;
    }

    tick() {
        this.player.tick(this);
        this.support.tick();
        this.devices.tick();
        this.sync();
    }

    sync() {
        this.syncStatus();
        this.syncInventory();
    }

    syncStatus() {
        this.vue.stamina.current = this.player.stamina;
        this.vue.stamina.maximum = this.player.maxStamina;
        this.vue.stamina.change = this.player.staminaChange;

        this.vue.researchBonus = this.support.totalResearchBonus;
        this.vue.supports = this.support.activeCache;
        this.vue.incompleteSupports = this.support.partialCache;
        this.vue.devices = this.devices.activeCache;
        this.vue.incompleteDevices = this.devices.partialCache;

        this.vue.land = this.land;
        this.vue.maxLand = this.maxLand;

        this.vue.power.current = this.power;
        this.vue.power.maximum = this.maxPower;
        this.vue.power.change = this.powerChange;

        this.vue.ether.current = this.ether;
        this.vue.ether.maximum = this.maxEther;
        this.vue.ether.change = this.etherChange;
    }

    syncInventory() {
        // this.vue.inventory = this.player.inventory.items.map(stack => {
        //     return {"name": stack.item.name, "qty": stack.qty};
        // });
        // this.inventorySyncedOnce = true;

        this.player.inventory.getChanges().forEach(change => {
            console.log('[CHANGE] ', change[0], change[1], change[2].item.name, change[2].qty);
            switch ( change[0] ) {
                case 'insert':
                    this.vue.inventory.splice(change[1], 0, {"name": change[2].item.name, "qty": change[2].qty});
                    break;

                case 'update':
                    this.vue.inventory[change[1]].name = change[2].item.name;
                    this.vue.inventory[change[1]].qty = change[2].qty;
                    break;

                case 'delete':
                    this.vue.inventory.splice(change[1], 1);
                    break;
            }
        });
    }
}

const tf = window.tf = new TermFactory();

function updateHeights() {
    $('.leftcontent').height($('.left').height() - $('.left h1').height() - $('.left nav').height() - 22);
    tf.console.el().height($('.right').height() - $('.right .input').height() - 6);
}

$(window).on('resize', () => updateHeights());
updateHeights();

setTimeout(() => tf.console.scrollToEnd(true), 200);

tf.console.focus();

let ttTimeout = null;
// possible todo - make clicking itemtt change pages in the tooltip? first page is flavor + stats,
// further pages are recipes and usages of the item?
$('body').on('mouseenter', 'span.itemtt', function(e) {
    let itemname = $(this).text().trim();
    let isDevice = $(this).closest('ul.devices-contents').length > 0;

    if ( isDevice ) {
        itemname = tf.devices.activeRegistry[itemname].deviceClass.id;
    }
    let item = tf.items.find(itemname);
    itemname = item.name;

    let body = '';
    if ( item.flavor.length ) {
        body += `<br><i>${item.flavor}</i>`
    }

    if ( item.category === 'support' ) {
        if ( item.staminaRegen > 0 ) {
            body += `<br><b>Stamina Regen:</b> +${item.staminaRegen}/s`;
        }
        if ( item.landBonus > 0 ) {
            body += `<br><b>Land Bonus:</b> ${item.landBonus}`;
        }
        if ( item.researchBonus > 0 ) {
            body += `<br><b>Research Bonus:</b> ${item.researchBonus}`;
        }
    } else if ( item.category === 'device' ) {
        if ( item.land > 0 ) {
            body += `<br><b>Land Used:</b> ${item.land}`;
        }
    } else {
        if ( item.edible ) {
            itemname += ' [edible]';
            let stamina = numberFormatAbbr(item.stamina * tf.player.staminaMultiplier());
            let staminaCap = numberFormatAbbr(item.staminaCap *  tf.player.staminaMultiplier());

            body += `<br><b>Stamina Regen:</b> +${stamina} / ${item.time}s`;
            body += `<br><b>Stamina Cap:</b> +${staminaCap}`;

            let allGroups = Object.keys(tf.player.nutrition);
            let groups = item.tags.filter(t => allGroups.includes(t));
            if ( groups.length === 5 ) {
                groups = ['a truly balanced meal!'];
            }
            body += `<br><b>Food Groups:</b> ${groups.join(', ')}`;
        }
        if ( item.tool ) {
            let skill = tf.player.toolMakingSkill[item.id] || 0;
            body += `<br><b>Tool:</b> Lv${item.level} ${item.tags[0]}`;
            body += `<br><b>Toolmaking Skill:</b> ${skill}/100`;
        }
        if ( item.animal ) {
            itemname += ' [animal]';
            body += `<br><b>Size:</b> ${item.size}kg`;
            // sheds/drops on other pages probably
        }
    }

    if ( ttTimeout ) {
        clearTimeout(ttTimeout);
    }

    ttTimeout = setTimeout(() => {
        let off = $(this).offset();
        let winHeight = $(window).height();
        let winWidth = $(window).width();
        let tt = $('.tooltip')
            .html(`<b>${itemname}</b>${body}`)
            .show();

        let position = {left: off.left, top: off.top + 18};
        let ttHeight = tt.height();
        if ( off.top > winHeight - ttHeight - 30 ) {
            position.top = off.top - ttHeight - 14;
        }
        position.left = Math.min(position.left, winWidth - 320);

        tt.css(position);
    }, 350);
});

$('body').on('mouseleave', 'span.itemtt', function(e) {
    if ( ttTimeout ) {
        clearTimeout(ttTimeout);
    }
    $('.tooltip').hide();
});

// Number formatters
Vue.filter('fmtqty', (value) => 'Quantity: ' + numberFormatFull(value));
Vue.filter('shortnum', (value) => numberFormatAbbr(value));

window.leftVue = tf.vue = new Vue({
    el: '#left-app',
    data: {
        tab: 'status',
        invFilter: '',
        inventory: [],
        researchBonus: 0,
        land: 0,
        maxLand: 10,
        incompleteSupports: [],
        supports: [],
        incompleteDevices: [],
        devices: [],
        stamina: {
            current: 100,
            maximum: 100,
            change: 0
        },
        power: {
            current: 0,
            maximum: 0,
            change: 0
        },
        ether: {
            current: 0,
            maximum: 0,
            change: 0
        }
    },
    methods: {
        changeTab(tab) {
            this.tab = tab;
        },

        itemClick(item) {
            $('#command').val($('#command').val() + item.name);
        },

        useDevice(name) {
            if ( tf.console.lockHolder ) {
                tf.console.appendLine('> You are busy.', 'error');
                return;
            }

            // if we're in a device, quit first, then use the given name.
            if ( tf.devices.current ) {
                tf.console.processor.run('quit');
            }
            tf.console.processor.run('use ' + name);
        },

        staminaProgress() {
            return progressBar(this.stamina.current, this.stamina.maximum, 34);
        },

        landProgress() {
            return progressBar(this.land, this.maxLand, 34);
        },

        staminaMod() {
            let str = '';
            if ( this.stamina.change > 0 ) {
                str += '+';
            }
            return str + numberFormatAbbr(this.stamina.change);
        },

        powerMod() {
            let str = '';
            if ( this.power.change > 0 ) {
                str += '+';
            }
            return str + numberFormatAbbr(this.power.change);
        },

        etherMod() {
            let str = '';
            if ( this.ether.change > 0 ) {
                str += '+';
            }
            return str + numberFormatAbbr(this.ether.change);
        },

        powerProgress() {
            return progressBar(this.power.current, this.power.maximum, 34);
        },

        textfmt(value) {
            return textFormat(value);
        }
    },
    computed: {
        filteredInventory() {
            if ( this.invFilter.length === 0 ) {
                return this.inventory;
            }
            return this.inventory.filter(inv => inv.name.includes(this.invFilter));
        },

        filteredSupports() {
            if ( this.invFilter.length === 0 ) {
                return this.supports;
            }
            return this.supports.filter(s => s.name.includes(this.invFilter));
        },

        filteredDevices() {
            if ( this.invFilter.length === 0 ) {
                return this.devices;
            }
            return this.devices.filter(d => d.name.includes(this.invFilter));
        },

        filteredIncompleteSupports() {
            if ( this.invFilter.length === 0 ) {
                return this.incompleteSupports;
            }
            return this.incompleteSupports.filter(s => s.includes(this.invFilter));
        },

        filteredIncompleteDevices() {
            if ( this.invFilter.length === 0 ) {
                return this.incompleteDevices;
            }
            return this.incompleteDevices.filter(d => d.includes(this.invFilter));
        }
    }
});
