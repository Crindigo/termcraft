/**
 * Allows certain things to happen upon reaching one or more conditions.
 * 
 * - Minimum land
 * - Minimum qty of an item
 * - Device built
 * - Support built
 * - Research completed
 */
export class Events
{
    constructor(tf) {
        this.tf = tf;

        // completed event ids. needs to be in save file.
        this.completedEvents = [];

        this.allEvents = {}; // every event, complete or not
        this.events = {}; // incomplete events

        // Cache of item IDs to the list of events that include the item as a requirement.
        // that way we don't have to do a full event check on EVERY event whenever ANY item
        // quantity is increased, which can happen 100+ times per second.
        // Not as important for other requirements since they don't happen very often.
        this.itemCache = {};

        // Event definitions.
        this.make('blood_magic', event => {
            event.items.blood = 1000;
            event.addStory = `The stench of blood relentlessly assaults my nostrils. Yet, it feels heavier than simply the
            odor. As if all the death is placing an intangible weight down on the world. I should look into this more.`;
            event.addResearch.push('blood_magic');
        });
    }

    make(id, fn) {
        let event = new TFEvent(id);
        fn(event);
        this.add(id, event);
    }

    add(id, event) {
        this.allEvents[id] = event;
        this.events[id] = event;

        Object.keys(event.items).forEach(itemId => {
            if ( !this.itemCache[itemId] ) {
                this.itemCache[itemId] = [];
            }
            this.itemCache[itemId].push(event);
        });
    }

    // Use this for inventory updates.
    onItemAdded(stack) {
        let events = this.itemCache[stack.item.id];
        if ( events ) {
            this.checkEvents(events);
        }
    }

    // Use this for land/device/support/research. Less efficient but not called very often.
    checkAll() {
        this.checkEvents(Object.values(this.events));
    }

    checkEvents(events) {
        events.filter(ev => ev.requirementsMet(this.tf)).forEach(ev => this.complete(ev.id));
    }

    complete(id, skipStory = false) {
        let event = this.events[id];
        if ( !event || event.complete ) {
            return;
        }

        event.complete = true;
        this.completedEvents.push(id);

        if ( !skipStory && event.addStory.length > 0 ) {
            this.tf.console.append(event.addStory, 'story', '> ');
        }

        event.addResearch.forEach(r => this.tf.research.unlock(r));

        delete this.events[id];
    }
}

class TFEvent 
{
    constructor(id) {
        this.id = id;
        this.complete = false;

        this.minLand = 0;
        this.items = {};
        this.deviceIds = [];
        this.supportIds = [];
        this.researchIds = [];

        this.addStory = '';

        // events can give "sparks" that need to be acted upon via more in-depth research.
        // they shouldn't just give you new recipes, etc. on their own.
        this.addResearch = [];
    }

    requirementsMet(tf) {
        if ( tf.land < this.minLand ) {
            return false;
        }

        let met = this.deviceIds.every(id => !!tf.devices.currentCounts[id]);
        if ( !met ) {
            return false;
        }

        met = this.supportIds.every(id => !!tf.support.activeRegistry[id]);
        if ( !met ) {
            return false;
        }

        met = this.researchIds.every(id => !!this.tf.research.completedIndex[id]);
        if ( !met ) {
            return false;
        }

        met = Object.entries(this.items).every(kv => {
            return tf.player.inventory.findQtyById(kv[0]) >= kv[1];
        });
        if ( !met ) {
            return false;
        }

        return true;
    }
}