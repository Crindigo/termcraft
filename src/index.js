import $ from 'jquery';
import Vue from 'vue';
import './assets/style.css';
import {numberFormatFull, numberFormatAbbr, progressBar, textFormat, clamp} from './utils';
import { setupTooltip } from './tooltip';

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

    modifyPower(power) {
        this.power = clamp(this.power + power, 0, this.maxPower);
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
        this.vue.activeDeviceName = this.devices.current ? this.devices.current.name : '';
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
            //console.log('[CHANGE] ', change[0], change[1], change[2].item.name, change[2].qty);
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

setupTooltip(tf);

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
        activeDeviceName: '',
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
            //$('#command').val($('#command').val() + item.name);
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

            if ( name === this.activeDeviceName ) {
                this.activeDeviceName = '';
            } else {
                tf.console.processor.run('use ' + name);
                this.activeDeviceName = name;
            }

            tf.console.focus();
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
