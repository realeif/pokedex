// Variables
const api = 'https://pokeapi.co/api/v2/';
const pokemonLimit = 151;
const iconUrl = 'https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/dream-world/'

const pokedexLoader = document.getElementById('pokedex-loader');
var isLoading = false;

const pokedexContainer = document.getElementById('pokedex-container');

const searchInput = document.getElementById('pokemon-search');
const searchButton = document.getElementById('search-button');

const filterButton = document.getElementById('pokedex-filter-button');
const filterMenu = document.getElementById('pokedex-filter-menu');
const filterMenuItems = document.getElementById('pokedex-filter-type-items');
const filterClose = document.getElementById('pokedex-filter-close');
const filterReset = document.getElementById('pokedex-filter-reset');
var isFilterMenuOpen = false;

var pokemon = null;
var allPokemons = [];
var allTypes = [];
var filteredPokemons = [];

const colorMap = {
    fire: "#e03a3a",
    grass: "#50C878",
    electric: "#fad343",
    water: "#1E90FF",
    ground: "#735139",
    rock: "#63594f",
    fairy: "#EE99AC",
    poison: "#b34fb3",
    bug: "#A8B820",
    dragon: "#fc883a",
    psychic: "#882eff",
    flying: "#87CEEB",
    fighting: "#bf5858",
    normal: "#D2B48C",
    ghost: "#7B62A3",
    dark: "#414063",
    steel: "#808080",
    ice: "#98D8D8",
}

// Functions
function loadPokedex() {
    pokedexLoader.style.display = 'flex';
    pokedexContainer.style.display = 'none';
    isLoading = true;

    setTimeout(() => {
        pokedexLoader.style.display = 'none';
        pokedexContainer.style.display = 'grid';
        isLoading = false;
    }, 500);
}

async function getAllPokemons() {
    try {
        const response = await fetch(`${api}pokemon?limit=${pokemonLimit}`);
        const data = await response.json();
        allPokemons = data.results;
        
        await loadAllPokemonTypes();
        
        filteredPokemons = [...allPokemons];
        displayPokemons();
    } catch (error) {
        console.error('Fehler beim Laden der Pokemon:', error);
    }
}

async function loadAllPokemonTypes() {
    const promises = allPokemons.map(async (pokemon) => {
        const pokemonId = pokemon.url.split('/')[6];
        try {
            const pokemonData = await getPokemon(pokemonId);
            if (pokemonData) {
                pokemon.types = pokemonData.types;
                return pokemon;
            }
        } catch (error) {
            console.error(`Fehler: ${pokemonId}:`, error);
        }
        return null;
    });

    await Promise.all(promises);
}

async function getPokemonTypes() {
    const response = await fetch(`${api}type`);
    const data = await response.json();
    allTypes = data.results;

    filterMenuItems.innerHTML = '';

    allTypes.forEach(type => {
        if (type.name === 'unknown') return;
        
        const filterMenuItem = document.createElement('div');
        filterMenuItem.classList.add('main__pokedex-filter-menu-item');
        filterMenuItem.innerHTML = `
            <p>${type.name}</p>
            <label class="main__pokedex-filter-menu-checkbox" id="${type.name}">
                <input type="checkbox">
                <span></span>
            </label>
        `;
        filterMenuItems.appendChild(filterMenuItem);
    });
}

async function getPokemon(pokemon) {
    try {
        const response = await fetch(`${api}pokemon/${pokemon}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fehler:', error);
        return null;
    }
}

async function displayPokemons() {
    pokedexContainer.innerHTML = '';
    
    for (const pokemon of filteredPokemons) {
        const pokemonId = pokemon.url.split('/')[6];
        
        if (pokemon.types) {
            const pokemonCard = document.createElement('div');
            pokemonCard.classList.add('main__pokedex-card');

            const { types } = pokemon;
            
            const primaryType = types[0].type.name;
            
            const cardColor = colorMap[primaryType] || colorMap.normal;
            pokemonCard.style.backgroundColor = cardColor;
            
            pokemonCard.innerHTML = `
                <div class="main__pokedex-card-header">
                    <h2>${pokemon.name}</h2>

                    <div class="main__pokedex-card-header-number">
                        <p>#${pokemonId}</p>
                    </div>
                </div>

                <div class="main__pokedex-card-types">
                    ${types.map(({ type }) => `
                        <div class="main__pokedex-card-types-type">
                            <p>${type.name}</p>
                        </div>
                    `).join('')}
                </div>

                <div class="main__pokedex-card-image">
                    <img src="${iconUrl}${pokemonId}.svg" alt="${pokemon.name}" onerror="this.style.display='none'">
                </div>
            `;
            
            pokedexContainer.appendChild(pokemonCard);
        }
    }
}

function toggleFilterMenu(bool) {
    if (bool) {
        filterButton.style.display = 'none';
        filterMenu.style.display = 'flex';
        isFilterMenuOpen = true;
    } else {
        filterButton.style.display = 'flex';
        filterMenu.style.display = 'none';
        isFilterMenuOpen = false;
        
        applyActiveFilters();
    }
}

function applyActiveFilters() {
    const activeCheckboxes = filterMenuItems.querySelectorAll('input[type="checkbox"]:checked');
    const activeTypes = Array.from(activeCheckboxes).map(checkbox => checkbox.parentElement.id);
    
    if (activeTypes.length === 0) {
        filteredPokemons = [...allPokemons];
    } else {
        filteredPokemons = allPokemons.filter(pokemon => 
            pokemon.types.some(type => activeTypes.includes(type.type.name))
        );
    }
    
    displayPokemons();
}

function resetAllFilters() {
    const checkboxes = filterMenuItems.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    filteredPokemons = [...allPokemons];
    displayPokemons();
}

function applySearchAndFilters() {
    let searchResults = allPokemons;
    
    if (searchInput.value.length > 0) {
        searchResults = allPokemons.filter(pokemon => 
            pokemon.name.startsWith(searchInput.value.toLowerCase())
        );
    }
    
    const activeCheckboxes = filterMenuItems.querySelectorAll('input[type="checkbox"]:checked');
    const activeTypes = Array.from(activeCheckboxes).map(checkbox => checkbox.parentElement.id);
    
    if (activeTypes.length > 0) {
        searchResults = searchResults.filter(pokemon => 
            pokemon.types && pokemon.types.some(type => activeTypes.includes(type.type.name))
        );
    }
    
    filteredPokemons = searchResults;
    displayPokemons();
}

// Events 
window.addEventListener('load', function () {
    loadPokedex();
    getAllPokemons();
    getPokemonTypes();
});

searchInput.addEventListener('input', function () {
    searchInput.value = searchInput.value.toLowerCase();
    searchInput.value = searchInput.value.trim();

    if (searchInput.value.length === 0) {
        applyActiveFilters();
    } else {
        applySearchAndFilters();
    }
});

searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

searchButton.addEventListener('click', function () {
    if (searchInput.value.length > 0) {
        applySearchAndFilters();
    } else {
        applyActiveFilters();
    }
});

filterButton.addEventListener('click', function () {
    toggleFilterMenu(!isFilterMenuOpen);
});

filterClose.addEventListener('click', function () {
    toggleFilterMenu(false);
});

filterReset.addEventListener('click', function () {
    resetAllFilters();
});
