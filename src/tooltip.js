import $ from "jquery";
import {numberFormatAbbr} from "./utils";

let ttTimeout = null;
let ttPage = 1;
let ttItem = null;
let tf = null;
let ttElement = $('.tooltip');
let ttOffset = null;
let ttPageCount = 1;

function countPages() {
    // needs to have an index of recipes where item is in the output, and where it's in the input, then
    // the total count is 1 + sum of those 2
    return 2;
}

function getTooltipPage() {
    if ( ttPage === 1 ) {
        return getOverview(ttItem);
    } else {
        return '<br>Hello there, this is page 2 of the tooltip which does not contain anything useful right now.';
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
        let isDevice = $(this).closest('ul.devices-contents').length > 0;
        ttItem = findItemInfo(text, isDevice);
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