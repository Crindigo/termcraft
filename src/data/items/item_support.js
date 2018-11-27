function stamina(name, value) {
    return {
        "name": name,
        "category": "support",
        "staminaRegen": value
    };
}

function land(name, value) {
    return {
        "name": name,
        "category": "support",
        "landBonus": value
    };
}

const thatch_bed = stamina('thatch bed', 0.1);
thatch_bed.flavor = 'Better than sleeping on dirt and rocks.';

const dirt_hut = stamina("dirt hut", 0.4);
dirt_hut.flavor = 'Look, it\'s your first Minecraft house!';

const adobe_hut = stamina("adobe hut", 2);
adobe_hut.flavor = 'Bit more room to stretch your legs. Movin\' on up.';

const flint_spears = land("flint spears", 1);
flint_spears.flavor = 'Very simple weapons to help expand your influence.';

const earth_rampart = land("earth rampart", 3);
earth_rampart.flavor = 'Basically just an artificial hill, but you do get a bit of high ground.';

const palisade = land("palisade", 8);
palisade.flavor = 'Wall of wood with some basic reinforcement.';

module.exports = {
    // Support items increase the stamina regeneration rate by improving morale.
    // Duplicates are allowed, but the effectiveness is 1 + log(count) so it diminishes.
    // They do not use land, and are activated once crafted.",

    // Technically, support could be used for other bonuses as well besides stamina regen.
    // Maybe use this for combat as well, making devices go faster, research faster, etc.
    // more etc: increase recipe output for tools.

    thatch_bed,
    dirt_hut,
    adobe_hut,
    flint_spears,
    earth_rampart,
    palisade,

    "christmas_tree": {
        "name": "christmas tree",
        "category": "support",
        "staminaRegen": 5.0,
        "logBase": 10
    },
    "christmas_ornament": {
        "name": "christmas ornament",
        "category": "support",
        "staminaRegen": 0.5,
        "logBase": 2
    },

    // research bonus, other speed bonus, makes it go X% faster. multiply time by 100/100+bonus.

    "research_table": {
        "name": "research table",
        "category": "support",
        "researchBonus": 1.0
    },

    "quantum_science_lab": {
        "name": "quantum science lab",
        "category": "support",
        "researchBonus": 10.0
    }
};
