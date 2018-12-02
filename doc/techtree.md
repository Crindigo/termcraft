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

- mechanics 1 (req: simple construction + carving)
  - first power production. hand crank generator, millstone, gears, axles. millstone
    can extract kaolinite from sand + clay. also chalk from calcite.
  - sifter, can rarely get materials from sand and gravel. should allow multiple types
    of mesh with durability. plant fiber mesh to start with.
  - sand: quartz shard, multiple seashell types.
  - gravel: flawed gemstones. used in magic probably.

- pottery (req: charcoal production)
  - creation of charcoal kilns, unfired pots, fired pots (used for fluid collection),
    fired clay bricks (fireclay=clay + kaolinite).

- cooking ovens (req: charcoal production)
  - creation of stone brick ovens, used for heated drying and cooking/baking of food.
  - can make quicklime from chalk.

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
  - recipes for nicer clothes, beds with down blankets and alpaca wool.

- animal power (req: animal husbandry)
  - creation of horse-powered generator. recipe takes a horse, generates power in exchange for hay.

- leather processing (req: animal husbandry)
  - creation of drying rack
  - creation of leather (raw hide + slaked lime + water + salt + drying rack time), leather armor
  - cut into strips with handaxe and use as binding for higher level tools

- smelting (req: pottery)
  - creation of charcoal-powered smelteries built with firebrick. processing stone
    gives trace amounts of molten copper along with slag.
  - creation of (sand + clay + water) molds for hammer head and unshaped pick/axe/spear/sword/shovel
  - foundry combines molten metal + molds

- metal forming (req: smelting)
  - creation of stone anvil + hammers to turn unshaped tool heads/blades into shaped ones.
  - shaped heads can then be used to make new tools. copper pick can mine cassiterite
    which can be smelted into tin.

- alloying (req: smelting)
  - creation of an alloy mixer that lets you turn 2+ molten fluids into another.
  - initially just bronze, which is better than copper for tool efficiency/durability,
    and lets you mine hematite to be used for iron. https://en.wikipedia.org/wiki/Ore

- iron making (req: alloying)
  - creation of bloomeries, which require charcoal + hematite and create molten iron,
    which can then be used for wrought iron tools and items like nails.
    wrought iron picks can be used to mine galena (lead + silver).

- construction 2 (req: iron making)
  - creation of scaffolding with planks + nails, concrete houses

- mechanics 2 (req: iron making, construction 2)
  - creation of wind mills and water wheels for more advanced power generation
  - creation of drill molds, drills
  - creation of automatic quarries using drills, gets pick and shovel mats
  - creation of powered screw pumps for automated water
  - creation of sawmills for automatic planks, saw molds and saws
  - creation of lumber mills, also using saws to automate wood

- steel making (req: iron making)
  - creation of blast furnaces, requiring power for bellows + charcoal + hematite,
    and producing molten steel. molten steel can be formed into decent tools and
    good weapons for expanding land area. better tools have to wait until advanced
    steel making where chromite can mix in for stainless steel, or later tungsten steel.
    steel tools can start finding gold nuggets, chromite when mining.

- steam age (req: steel making, mechanics 2)
  - creation of steam engines, which consume charcoal or coal, water, and lubricant, and
    produce a good amount of power

## Unorganized

(in mechanics 2 now) Windmill and water wheels. 
  Windmills needing lots of fabric from hemp, plus concrete bricks + scaffolding which is in
  construction 2. Scaffolding probably needs treated planks.
  Water mills needing treated planks made from milling hemp seeds into hemp oil and adding to planks.
  Both devices will vary in output power due to fluctuations in wind and currents, wind moreso.
  
With wind/water, you have enough power to make drills and automatic quarries. The drill head
determines the materials that can be mined.

Wolframite (tungsten) requires stainless steel picks/drills to mine. You know what? Tired of
spending hours on wikipedia researching stuff. You know how you get tungsten? Hellfire Forge
from the blood magic tree, heats shit up REAL hot and can make molten tungsten.

TBH, most shouldn't require a ton of complex processing. I'd say titanium, aluminum, and uranium
should have more complex processes but the rest should be simple.

Titanium requires ilmenite, found with tungsten steel picks/drills.

Titanium:
    - ilmenite + carbon + chlorine = titanium tetrachloride
    - titanium tetrachloride + magnesium = titanium

Magnesium:
    - silicon + dolomite + shit tons of power = magnesium + sand
    - silicon = electric arc furnace + coke + sand

Chlorine:
    - electrolysis of salt water = chlorine + hydrogen + sodium hydroxide

Sodium carbonate:
    - solvay tower: heats chalk, salt, and a bit of ammonia to make sodium carbonate
    - can be used for glass when mixed with sand and chalk

Ammonia:
    - haber reactor: heat + haber catalyst (small amount) + hydrogen + nitrogen = ammonia
    - haber catalyst: iron powder + quicklime

Sulfuric acid:
    - chemical reactor: heat + sulfur + oxygen = sulfur dioxide
    - chemical reactor: sulfur dioxide + oxygen = sulfur trioxide
    - chemical reactor: sulfur trioxide + water = sulfuric acid (good enough)

Sodium hydroxide:
    - chemical reactor: slaked lime + sodium carbonate = sodium hydroxide

Platinum:
    - arc smelter: sperrylite

Nickel:
    - smelt pentlandite

Zinc:
    - smelt sphalerite, with sulfur and a small amount of cadmium byproducts

Lithium:
    - more advanced pump can collect lithium brine, solar evaporator converts to lithium

TODO: bauxite/aluminum, chromite/chromium, uranium

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

## Pick Tiers

1. flint
2. copper
3. bronze
4. wrought iron
5. steel
6. stainless steel
7. tungsten steel