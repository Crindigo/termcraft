# Premise

You have one base. Infinite inventory. Many types of resources. One type of
power. Actions are limited by stamina. It slowly recovers over time, but
eating food makes it recover faster. Sleeping also recovers while locking the
console, and can be improved with better conditions (bed, house, etc.). As you
eat and sleep, the stamina cap increases. Maybe instead of sleep, just building
certain structures improves stamina regeneration. Food can give instant stamina
and slightly raise the cap.

Exploration expands the story and increases the amount of usable land area. 
To explore, you need combat strength (making weapons, armor, tanks, etc.), and
good stamina regeneration.

You start with 100 land, 100 stamina (0.1/s regen), and 0 combat strength.
Expeditions will expand the land to current * 1.10520985, so after 99
expansions it will be at 2 million.

Each expedition uses 1.1 * current land stamina, draining 1% per second for
100 seconds, and requires 0.1 * current land combat to even begin. So your 
first expedition will use 1.1 stamina/second for 100 seconds during which you
can't run any other commands besides stop, which aborts the expedition.
As for time, I may make it equal to the # of land gained. 

# Commands

- help [command]: Shows a command list or help for a single command.

- gather [with tool name]: Gathers resources with your bare hands or with the
  given tool name. If the tool durability runs out, it will switch to another
  equivalent tool or else stop the command. Locks the console as it runs as long
  as possible. Consumes stamina.

- stop: Stops any console-locking command like gather.

- recipes [device]: Shows items craftable with your hands or a device.

- craft [number] {item name}: Crafts an item, multiple if a number is given.
  Items can take a certain amount of time to craft, and the console is locked
  while the process is ongoing. Consumes stamina.

- alias {id} {name}: Gives a name to an entity like a device.

- inv [filter]: Displays the inventory, optionally filtering by name.

# Device

A device is something that can take input and give output after a period of 
time. Like a simple furnace could take 1 charcoal + 1 raw beef and give 1 
cooked beef after 30 seconds. An electric furnace would only need raw beef, but 
require a constant 5 power/second to operate.

When crafting a device, land is checked and allocated at the start of crafting.
When crafting is finished, the device is added to the base. Dismantling the
device optionally gives back some raw materials.

Current system involves put/take, but I wonder if instead we do something
like the following:

```
$ use brick_dryer_1
brick_dryer_1$ recipes
...
- adobe brick (5 minutes)
  - clay (2)
  - plant fiber
...
brick_dryer_1$ make 10 adobe brick
(will consume 2 clay + 1 plant fiber from inventory every 5 minutes starting
now, and deposit adobe brick in the inventory, stopping after 10. will wait
if items not in inventory.)
brick_dryer_1$ leave/stop/exit/quit
$
```

For power, every device that generates power would have its own internal power
storage. There could also be devices that only serve to increase power storage.
When consuming power, the device will try pulling it out of storage at the
start of its tick. If not enough is available, the device will not proceed.
There is no "partial tick" where the device will run slower if only half the
required power is available.

A note on recipes with multiple outputs. By default, anything using the "make"
command will only have one output, so it's easy to do "make X item name".
Devices that have multiple outputs will have special commands for controlling
them, to put them in a certain "mode" which consumes one set of items and
produces another set.


- place {item name}: Places down the item as a device from the inventory, if it
  is a device. Will fail if there is not enough land available. Consumes
  stamina.

- remove {device id or name}: Picks up the device and puts it in the inventory,
  operations are cancelled and anything in input goes back to the inventory.
  Consumes stamina.

- use {device id or name}: Switches to device mode, changing the terminal
  prompt to include the id or name. Consumes stamina.

- put [number] {item name}: (device mode) Puts number (or 1) of the item into
  the device's input slots.

- take [number] {item name}: (device mode) Takes items out of the device's
  input slots, in case you made an error.

- start: (device mode) Starts processing the items, output goes into the base's
  inventory when it's done. Does not lock the console.

- leave: (device mode) Exits device mode.

# Research

- research: Shows a list of available things to research.

$ research

- brick drying
  - clay (8)
  - dirt (8)
  - small plank (8)
  - stone (8)

- fire
  - stick (4)
  - flint (2)

- charcoal pit
  - stick (16)
  - clay (8)
  - dirt (8)
  - loam (8)

$ recipes

- brick dryer
  - stone (16)
  - small plank (8)

- fireclay
  - clay
  - kaolinite

$ craft brick dryer
$ place brick dryer

- Placed as brick_dryer_1
- 1/100 land used

$ alias brick_dryer_1 bd1
$ recipes brick dryer

- clay brick (5 minutes)
  - clay (2)

- dirt brick (5 minutes)
  - dirt (2)

- adobe brick (5 minutes)
  - clay (2)
  - plant fiber

- concrete brick (20 minutes)
  - slaked lime (note: cook chalk for quicklime, add water for slaked lime)
  - sand
  - gravel

$ use bd1
$ put 2 plant fiber
$ put 4 clay
$ check
Recipe: adobe brick
- plant (2)
- clay (4)

$ start
- Recipe OK (clay brick), starting
$ leave

$ recipe adobe house
- adobe brick (200)
- thatch (100)

$ recipe thatch
thatch (4)
- stick
- plant fiber (4)

$ recipe farmland
- fertile soil (100)

$ recipe fertile soil
fertile soil (2)
- loam
- dirt

$ recipe loam
loam (4)
- sand (2)
- silt (2)
- clay (1)

$ recipe farmland

- wheat [60 minutes]
  - wheat seed (not consumed)

$ use farmland_1
$ put 1 wheat seed
1/100 plots used
$ start
$ leave

$ recipe cob
cob (2)
- dirt (2)
- plant fiber

$ recipe mass driver
mass driver [12 hours]
- device: structure builder mk8
- steel (10M)
- copper wire (2M)
- electromagnet (1M)
- circuit board mk5 (250K)

# Saving/Loading

For upgrades, store the save file version in the JSON data. Then an upgrade can migrate the save data to a new
version, auto unlocking new research, etc. If this happens, store the un-migrated JSON in a backup key in
local storage so if something went wrong it could be recovered and attempted again.