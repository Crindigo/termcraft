import $ from 'jquery';
import Vue from 'vue';
import './assets/style.css';
import { numberFormatFull, numberFormatAbbr, progressBar } from './utils';

import { TFConsole } from './console';
import { Player } from './player';
import { Items } from './items';
import { Crafting } from './crafting';
import { Research } from './research';
import { Support } from './support';

window.jQuery = $;
window.$ = $;

class TermFactory
{
    constructor() {
        this.vue = null;

        this.land = 0;
        this.maxLand = 100;

        //this.crafting = new Crafting();
        this.player = new Player();
        this.console = new TFConsole(this);
        this.items = new Items(this);
        this.crafting = new Crafting(this);

        this.support = new Support(this);

        // research needs to come after console and crafting as it can unlock commands/recipes
        this.research = new Research(this);

        this.ticker = setInterval(() => this.tick(), 1000);

        setTimeout(() => this.sync(), 0);
    }

    freeLand() {
        return this.maxLand - this.land;
    }

    tick() {
        this.player.tick(this);
        this.support.tick();
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

        this.vue.combat = this.support.totalCombatBonus;
        this.vue.researchBonus = this.support.totalResearchBonus;
        this.vue.supports = this.support.activeCache;
    }

    syncInventory() {
        this.vue.inventory = this.player.inventory.items.map(stack => {
            return {"name": stack.item.name, "qty": stack.qty};
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

/*
$('body').on('mouseenter', 'span.itemtt', function(e) {
    let itemname = $(this).text().trim();
    let item = tf.items.find(itemname);
    let off = $(this).offset();
    $('.tooltip')
        .html(`<b>${itemname}</b><br>This is some example flavor text for the item.`)
        .css({left: off.left, top: off.top + 18})
        .show();
});

$('body').on('mouseleave', 'span.itemtt', function(e) {
    $('.tooltip').hide();
});
*/

// Number formatters
Vue.filter('fmtqty', (value) => 'Quantity: ' + numberFormatFull(value));
Vue.filter('shortnum', (value) => numberFormatAbbr(value));

window.leftVue = tf.vue = new Vue({
    el: '#left-app',
    data: {
        tab: 'status',
        invFilter: '',
        inventory: [],
        combat: 0,
        researchBonus: 0,
        supports: [],
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
        }
    },
    methods: {
        changeTab(tab) {
            this.tab = tab;
        },

        itemClick(item) {
            $('#command').val($('#command').val() + item.name);
        },

        staminaProgress() {
            return progressBar(this.stamina.current, this.stamina.maximum, 34);
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

        powerProgress() {
            return progressBar(this.power.current, this.power.maximum, 34);
        }
    },
    computed: {
        filteredInventory() {
            if ( this.invFilter.length === 0 ) {
                return this.inventory;
            }
            return this.inventory.filter(inv => inv.name.includes(this.invFilter));
        }
    }
});