import { format as d3Format } from 'd3-format';

// Number formatters
const shortNumFormatter = d3Format('.3~s');
const smallNumFormatter = d3Format('.3~f');
const fullNumFormatter = d3Format(',');

export const tagRegexp = /^tag:(?<tag>[a-z0-9_]+)(\s*(\[(?<low>\d+),(?<high>\d+)?(?<close>\]|\))))?$/;

export function numberFormatAbbr(value) {
    return Math.abs(value) < 1 ? smallNumFormatter(value) : shortNumFormatter(value);
}

export function numberFormatFull(value) {
    return fullNumFormatter(value);
}

const tagSpecMatchCache = {};

/**
 * @param {Item} item 
 * @param {Object} matchGroups
 * @param {string} originalSpec
 */
export function itemMatchesTagSpec(item, matchGroups, originalSpec) {
    // not sure if necessary or would even make it faster
    //const cacheKey = originalSpec + '|' + item.id;
    //if ( tagSpecMatchCache[cacheKey] !== undefined ) {
    //    return tagSpecMatchCache[cacheKey];
    //}

    const tags = item.tags || [];
    const level = item.level || 0;

    let tagMatches = tags.includes(matchGroups.tag);
    if ( !tagMatches ) {
        //tagSpecMatchCache[cacheKey] = false;
        return false;
    }

    let levelMatches = true;
    if ( matchGroups.low ) {
        levelMatches = levelMatches && level >= parseInt(matchGroups.low);
        if ( matchGroups.high ) {
            if ( matchGroups.close === ']' ) {
                levelMatches = levelMatches && level <= parseInt(matchGroups.high);
            } else if ( matchGroups.close === ')' ) {
                levelMatches = levelMatches && level < parseInt(matchGroups.high);
            }
        }
    }

    //tagSpecMatchCache[cacheKey] = levelMatches;
    return levelMatches;
}

export function formatTagSpec(spec) {
    let m = spec.match(tagRegexp);
    if ( m.groups.low ) {
        if ( m.groups.high ) {
            let low = parseInt(m.groups.low);
            let high = parseInt(m.groups.high);
            if ( m.groups.close === ')' ) {
                high--;
            }
            
            if ( low === high ) {
                return `[any ${m.groups.tag}, level ${low}]`;
            } else {
                return `[any ${m.groups.tag}, level ${low}-${high}]`;
            }
        } else {
            return `[any ${m.groups.tag}, level ${m.groups.low}+]`;
        }
    } else {
        return `[any ${m.groups.tag}]`;
    }
}

export function weightedRandom(items) {
    let sum = 0;
    for ( let k in items ) {
        if ( items.hasOwnProperty(k) ) {
            sum += items[k];
        }
    }

    let rand = parseInt(""+(Math.random() * sum));
    let k;
    for ( k in items ) {
        if ( items.hasOwnProperty(k) ) {
            if ( rand < items[k] ) {
                return k;
            }
            rand -= items[k];
        }
    }
    return k;
}

export function pickRandomKeys(items, divisor = 100) {
    let keys = [];
    for ( let k in items ) {
        let chance = items[k] / divisor;
        // while chance is over 100%, add the item to the list
        while ( chance > 1 ) {
            keys.push(k);
            chance -= 1;
        }
        if ( Math.random() <= chance ) {
            keys.push(k);
        }
    }
    return keys;
}

export function progressBar(current, max, charWidth) {
    const progWidth = charWidth - 2;
    const bars = max === 0 ? 0 : Math.round((current / max) * progWidth);
    let progress = '';
    for ( let i = 0; i < progWidth; i++ ) {
        if ( i < bars ) {
            progress += '#';
        } else {
            progress += ' ';
        }
    }
    return '[' + progress + ']';
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function textFormat(line) {
    line = line.replace(/\{!([a-z0-9 -]+)}/g, '<span class="$1">');
    line = line.replace(/\{\/}/g, '</span>');

    return line;
}