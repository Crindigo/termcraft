import $ from 'jquery';
import Vue from 'vue';
import './assets/style.css';
import { format as d3Format } from 'd3-format';

import { TFConsole } from './console';

window.jQuery = $;
window.$ = $;

class TermFactory
{
    constructor()
    {
        this.vue = null;

        //this.crafting = new Crafting();
        //this.player = new Player();
        this.console = new TFConsole(this);

        //this.items = new Items(this);
        //this.items.initTcItems();

        //this.crafts = new Crafts(this);
        //this.crafts.initTcCrafts();

        //this.gathering = new Gathers(this);
        //this.gathering.initTcGathers();
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

// Number formatters
const shortNumFormatter = d3Format('.3~s');
const smallNumFormatter = d3Format('.3~f');
const fullNumFormatter = d3Format(',');

Vue.filter('fmtqty', (value) => 'Quantity: ' + fullNumFormatter(value));
Vue.filter('shortnum', (value) => value < 1 ? smallNumFormatter(value) : shortNumFormatter(value))

window.leftVue = tf.vue = new Vue({
    el: '#left-app',
    data: {
        invFilter: '',
        inventory: [],
        status: {
            stamina: 85,
            maxStamina: 100
        }
    },
    methods: {
        itemClick(item) {
            $('#command').val($('#command').val() + item.name);
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