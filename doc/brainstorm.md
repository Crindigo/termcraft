# Premise

You have one base. Infinite inventory. Many types of resources. One type of
power. Actions are limited by stamina. It slowly recovers over time, but
eating food makes it recover faster. Sleeping also recovers while locking the
console, and can be improved with better conditions (bed, house, etc.). As you
eat and sleep, the stamina cap increases. Maybe instead of sleep, just building
certain structures improves stamina regeneration. Food can give instant stamina
and slightly raise the cap.

Complex food generally gives a bigger bonus to stamina cap but less stamina
regeneration. While simple food gives very little to the cap but good regen.
Future: implement nutrition, so a balanced diet gives an extra multiplier to
regen/cap gained by food. Fruits/veggies, grains, dairy, meat.

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

ALTERNATIVE: Exploration is a run-forever command that just slowly increases
land by 0.1%/second, with higher stamina drain as the number grows. It stops
if combat isn't high enough (formula tbd). At certain land milestones, story
gets added to the terminal. If nutrition gets added it could boost explore
speed. Also some support items could boost speed or reduce stamina drain, like
binoculars, boots, star charts, drones, satellites.

TOOLS IDEA: Maybe instead of crafting one tool that has a % chance of breakage
on each use, the crafting operation makes X "tools" which are just "tool usages"
instead of quantities. Then gathering, crafting, etc. just takes 1 per use.

ending:
Va gur raq, n tynff oernxvat bireynl nccrnef bire gur pbafbyr, naq cvrprf sentzrag 
gb gur fvqr gb erirny n pehqryl qenja snpr fnlvat "huu, uv?".

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

Before I forget, devices that don't use power will use the standard make
command which is interactive and probably uses stamina, and will stop when
ingredients dry up. Devices that DO use power will use a special make command
that will allow it to start even if requirements aren't met, and then the
crafting process begins once there's enough power and items available.


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

# Space

Level 1 devices - require an item (satellite, etc.) combined with a rocket + fuel built on a launchpad.
Level 2 devices - require an item combined with power built on a space elevator.
Level 3 devices - require an item combined with power built on a mass driver.
Technically could use the same item but put it in a different device.
Perhaps land should be renamed Device Cap? Since it doesn't make sense in space, and I really don't
want to allow infinite devices. Or change "Land" to "Space" once you do rocketry research?