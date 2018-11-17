import $ from 'jquery';
import Vue from 'vue';
import './assets/style.css';
import 'nanoscroller/bin/css/nanoscroller.css';

const d3Format = require('d3-format');

window.jQuery = $;
window.$ = $;
require('nanoscroller');

class TermCraft
{
    
}

new TermCraft();

const consoleElement = $('.console');
const commandElement = $('#command');

function updateHeights() {
    $('.leftcontent').height($('.left').height() - $('.left h1').height() - $('.left nav').height() - 22);
    consoleElement.height($('.right').height() - $('.right .input').height() - 4);
}

$(window).on('resize', () => updateHeights());
updateHeights();

$('.nano').nanoScroller();
setTimeout(() => consoleElement.scrollToEnd(true), 200);

commandElement.focus();

// Number formatters
const shortNumFormatter = d3Format.format('.3~s');
const smallNumFormatter = d3Format.format('.3~f');
const fullNumFormatter = d3Format.format(',');

Vue.filter('fmtqty', (value) => 'Quantity: ' + fullNumFormatter(value));
Vue.filter('shortnum', (value) => value < 1 ? smallNumFormatter(value) : shortNumFormatter(value))

window.leftVue = new Vue({
    el: '#left-app',
    data: {
        invFilter: '',
        inventory: [],
        status: {
            stamina: 85,
            maxStamina: 100
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