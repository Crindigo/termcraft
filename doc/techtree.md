# Tech Tree

- flint knapping
  - creation of flint tools

- fire
  - creation of firestarters, spit-roasting campfires (unlock build)

- weaving
  - straw baskets for gathering fruits, thatch bedding and roofing

- archery (req: flint knapping + weaving)
  - creation of flint bow & arrow for gathering meat

- carving (req: flint knapping)
  - creation of small wood tools (bowls, gears)

- construction 1 (req: flint knapping + weaving)
  - creation of basic structures. chopping block, brick former, mud hut, adobe hut.

- charcoal production (req: simple construction + fire)
  - creation of charcoal pits to turn wood into charcoal.

- pottery (req: charcoal production)
  - creation of charcoal kilns, unfired pots, fired pots (used for fluid collection),
    fired clay bricks (fireclay=clay + kaolinite). can make quicklime from chalk.

- mechanics 1 (req: simple construction + carving)
  - first power production. hand crank generator, millstone, gears, axles. millstone
    can extract kaolinite from sand + clay.

- agriculture (req: pottery)
  - creation of farms, flint scythe for gathering basic seeds. farms can be watered via
    command for temporary speed boost, and also fertilized with manure.
  - wheat, carrot, potato, hemp.

- animal husbandry (req: agriculture)
  - creation of pastures, which slowly accumulate random animals in exchange for hay.
  - will not allow animals to accumulate beyond a certain number per pasture.
  - accumulates manure (fertilizer for farms) for each cow in inventory, also draining hay.
  - has butcher command which uses flint hatchet + handaxe + animal to get resources.
  - has milk command for some animals, takes time/stamina to get cow milk, goat milk.
  - butcher/milk can just work for any animal in the inventory, we do not track a
    separate inventory for each pasture.

- smelting (req: pottery)
  - creation of charcoal-powered smelteries built with firebrick. processing stone
    gives trace amounts of molten copper.
  - creation of clay molds for hammer head and unshaped pick/axe/spear/sword/shovel

- metal forming (req: smelting)
  - creation of stone anvil + hammers to turn unshaped tool heads/blades into shaped ones.
  - shaped heads can then be used to make new tools. copper pick can mine cassiterite
    which can be smelted into tin.

- alloying (req: smelting)
  - creation of an alloy mixer that lets you turn 2+ molten fluids into another.
  - initially just bronze, which is better than copper for tool efficiency/durability,
    and lets you mine hematite to be used for iron. https://en.wikipedia.org/wiki/Ore


## Unorganized

Windmill and water wheels. 
Windmills needing lots of fabric from hemp, plus concrete bricks + scaffolding which is in
construction 2. Scaffolding probably needs treated planks.
Water mills needing treated planks made from milling hemp seeds into hemp oil and adding to planks.
Both devices will vary in output power due to fluctuations in wind and currents, wind moreso.
With wind/water, you have enough power to make drills and automatic quarries. The drill head
determines the materials that can be mined.

## Power Levels

Hand crank: storage=100, 1/s. Uses 5 stamina over 5 seconds to make 5 power. With an adobe hut you
should be able to keep it running consistently.

Water wheel: storage=1000, 10/s.

Windmill: storage=5000, 50/s.

## Originality

Instead of trying to wiki the shit out of everything for historical accuracy, I should probably
just wing most things and deviate from the real world. Everyone's probably played incrementals
that go through historical progression before. Then again if something in the game has a real
world equivalent it would sound dumb to make up my own name for it.