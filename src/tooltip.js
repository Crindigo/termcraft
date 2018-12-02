import $ from "jquery";
import {formatTagSpec, numberFormatAbbr} from "./utils";

let ttTimeout = null;
let ttPage = 1;
let ttItem = null;
let tf = null;
let ttElement = $('.tooltip');
let ttOffset = null;
let ttPageCount = 1;

let inputRecipes = null;
let outputRecipes = null;

function countPages() {
    // needs to have an index of recipes where item is in the output, and where it's in the input, then
    // the total count is 1 + sum of those 2
    return 1 + outputRecipes.length + inputRecipes.length;
}

// Show the overview
// TODO: for devices, show some basic stats on current crafting operation if it has a background process
// TODO: also in that case make the device name bold in the device list.
function getTooltipPage() {
    if ( ttPage === 1 ) {
        return getOverview(ttItem);
    } else {
        let outputRecipeIndex = ttPage - 2;
        let body;
        if ( outputRecipeIndex < outputRecipes.length ) {
            body = getRecipeBody(outputRecipes[outputRecipeIndex], false);
        } else {
            let inputRecipeIndex = ttPage - 2 - outputRecipes.length;
            body = getRecipeBody(inputRecipes[inputRecipeIndex], true);
        }
        return body;
    }
}

function getTooltipTitle() {
    let title = ttItem.name;
    if (ttItem.edible) {
        title += ' [edible]';
    }
    if ( ttItem.animal ) {
        title += ' [animal]';
    }
    return title;
}

function getOverview() {
    let body = [];
    let item = ttItem;

    if (item.flavor.length) {
        body.push(`<i>${item.flavor}</i>`);
    }

    if (item.category === 'support') {
        if (item.staminaRegen > 0) {
            body.push(`<b>Stamina Regen:</b> +${item.staminaRegen}/s`);
        }
        if (item.landBonus > 0) {
            body.push(`<b>Land Bonus:</b> ${item.landBonus}`);
        }
        if (item.researchBonus > 0) {
            body.push(`<b>Research Bonus:</b> ${item.researchBonus}`);
        }
    } else if (item.category === 'device') {
        if (item.land > 0) {
            body.push(`<b>Land Used:</b> ${item.land}`);
        }
    } else {
        if (item.edible) {
            let stamina = numberFormatAbbr(item.stamina * tf.player.staminaMultiplier());
            let staminaCap = numberFormatAbbr(item.staminaCap * tf.player.staminaMultiplier());

            body.push(`<b>Stamina Regen:</b> +${stamina} / ${item.time}s`);
            body.push(`<b>Stamina Cap:</b> +${staminaCap}`);

            let allGroups = Object.keys(tf.player.nutrition);
            let groups = item.tags.filter(t => allGroups.includes(t));
            if (groups.length === 5) {
                groups = ['a truly balanced meal!'];
            }
            body.push(`<b>Food Groups:</b> ${groups.join(', ')}`);
        }
        if (item.tool) {
            let skill = tf.player.toolMakingSkill[item.id] || 0;
            body.push(`<b>Tool:</b> Lv${item.level} ${item.tags[0]}`);
            body.push(`<b>Toolmaking Skill:</b> ${skill}/100`);
        }
        if (item.animal) {
            body.push(`<b>Size:</b> ${item.size}kg`);
            // sheds/drops on other pages probably
        }
    }

    return '<br>' + body.join('<br>');
}

function getRecipeBody(recipe, isInput) {
    let madeWith = recipe.device;
    if ( madeWith === 'structure' ) {
        madeWith = 'build command';
    } else if ( madeWith === 'hand' ) {
        madeWith = 'make command';
    } else {
        madeWith = tf.devices.deviceClasses[madeWith].name;
    }

    let body = [];
    let usage = isInput ? 'Used with' : 'Made with';

    body.push(`${usage}: ${madeWith}`);

    let reqs = [];
    if ( recipe.time ) {
        reqs.push(`Time: ${recipe.time}s`);
    }
    if ( recipe.stamina ) {
        reqs.push(`Stamina: ${recipe.stamina}`);
    }
    if ( recipe.power ) {
        reqs.push(`Power: ${recipe.power}`);
    }
    if ( recipe.ether ) {
        reqs.push(`Ether: ${recipe.ether}`);
    }

    if ( reqs.length > 0 ) {
        body.push(reqs.join(' | '));
    }

    body.push('<b>Input:</b>');
    Object.entries(recipe.input).forEach(kv => {
        // need to get names from id
        let itemName = '';
        if ( kv[0].startsWith('tag:') ) {
            let stacks = tf.player.inventory.findMatchingTag(kv[0]);
            if ( stacks.length === 0 ) {
                itemName = formatTagSpec(kv[0]);
            } else {
                itemName = stacks.map(s => s.item.name).join('/');
            }
        } else {
            itemName = tf.items.get(kv[0]).name;
        }
        console.log(kv[0], itemName);
        body.push(' - ' + itemName + (kv[1] > 1 ? ` (${kv[1]})` : ''));
    });
    body.push('<b>Output:</b>');
    Object.entries(recipe.output).forEach(kv => {
        // need to get names from id
        let itemName = tf.items.get(kv[0]).name;
        body.push(' - ' + itemName + (kv[1] > 1 ? ` (${kv[1]})` : ''));
    });

    return '<br>' + body.join('<br>');
}

function findItemInfo(text, isDevice) {
    if (isDevice) {
        text = tf.devices.activeRegistry[text].deviceClass.id;
    }
    return tf.items.find(text);
}

export function setupTooltip(tfParam) {
    let documentBody = $('body');
    tf = tfParam;

    // possible todo - make clicking itemtt change pages in the tooltip? first page is flavor + stats,
    // further pages are recipes and usages of the item?
    documentBody.on('mouseenter', 'span.itemtt', function () {
        let text = $(this).text().trim();
        if ( $(this).data('ttname') ) {
            // allow override with data attr
            text = $(this).data('ttname').trim();
        }

        let isDevice = $(this).closest('ul.devices-contents').length > 0;
        ttItem = findItemInfo(text, isDevice);

        inputRecipes = tf.crafting.allByInput(ttItem.id, true);
        outputRecipes = tf.crafting.allByOutput(ttItem.id, true);

        ttPageCount = countPages();

        let title = getTooltipTitle();
        let body = getTooltipPage();

        if (ttTimeout) {
            clearTimeout(ttTimeout);
        }

        ttTimeout = setTimeout(() => {
            ttOffset = $(this).offset();
            showTooltip(title, body);
        }, 350);
    });

    documentBody.on('click', 'span.itemtt', function() {
        let oldPage = ttPage;
        ttPage++;
        if ( ttPage > ttPageCount ) {
            ttPage = 1;
        }

        if ( oldPage !== ttPage ) {
            showTooltip(getTooltipTitle(), getTooltipPage());
        }
    });

    documentBody.on('mouseleave', 'span.itemtt', function () {
        if (ttTimeout) {
            clearTimeout(ttTimeout);
        }
        ttElement.hide();
        ttItem = null;
        ttPage = 1;
    });
}

function showTooltip(title, body) {
    let off = ttOffset;
    let winHeight = $(window).height();
    let winWidth = $(window).width();
    let tt = ttElement.html(`<b>${title}</b><span class="ttpage">${ttPage}/${ttPageCount}</span>${body}`).show();

    let position = {left: off.left, top: off.top + 18};
    let ttHeight = tt.height();
    if (off.top > winHeight - ttHeight - 30) {
        position.top = off.top - ttHeight - 14;
    }
    position.left = Math.min(position.left, winWidth - 320);

    tt.css(position);
}