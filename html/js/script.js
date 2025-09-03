// Variables
const api = 'https://pokeapi.co/api/v2/';
const allPokemonCount = 807;
const iconUrl = 'https://raw.githubusercontent.com/HybridShivam/Pokemon/master/assets/images/'

const pokedexLoader = document.getElementById('pokedex-loader');
var isLoading = false;

const pokedexContainer = document.getElementById('pokedex-container');
const pokedexGrid = document.getElementById('pokedex-grid');

const searchInput = document.getElementById('pokemon-search');
const searchButton = document.getElementById('search-button');
const searchAutocomplete = document.getElementById('search-autocomplete');

const pokedexFilterContainer = document.getElementById('pokedex-filter-container');
const filterButton = document.getElementById('pokedex-filter-button');
const filterMenu = document.getElementById('pokedex-filter-menu');
const filterMenuItems = document.getElementById('pokedex-filter-type-items');
const filterClose = document.getElementById('pokedex-filter-close');
const filterReset = document.getElementById('pokedex-filter-reset');
var isFilterMenuOpen = false;

// Pagination
const paginationContainer = document.getElementById('pokedex-pagination');
const paginationFirstButton = document.getElementById('pokedex-pagination-button-first');
const paginationPrevButton = document.getElementById('pokedex-pagination-button-prev');
const paginationNextButton = document.getElementById('pokedex-pagination-button-next');
const paginationLastButton = document.getElementById('pokedex-pagination-button-last');
const paginationCurrentPage = document.getElementById('pokedex-pagination-current-page');
const paginationTotalPages = document.getElementById('pokedex-pagination-total-pages');

const itemsPerPage = 48;

// Detail View
const detailViewContainer = document.getElementById('pokedex-details-container');
const detailViewBack = document.getElementById('pokedex-details-back');
const detailViewImage = document.getElementById('pokedex-details-image');
const detailViewName = document.getElementById('pokedex-details-name');
const detailViewNumber = document.getElementById('pokedex-details-number');
const detailViewTypes = document.getElementById('pokedex-details-types');

var pokemon = null;
var allPokemonNames = [];
var allTypes = [];
var filteredPokemons = [];
var currentPage = 1;
var totalPages = Math.ceil(allPokemonCount / itemsPerPage);
var filteredPokemonCount = allPokemonCount;

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
let loaderStartTime = 0;

function showLoader() {
    pokedexLoader.style.display = 'flex';
    isLoading = true;
    loaderStartTime = Date.now();
}

function hideLoader() {
    const elapsedTime = Date.now() - loaderStartTime;
    const minLoaderTime = 200;
    
    if (elapsedTime < minLoaderTime) {
        setTimeout(() => {
            pokedexLoader.style.display = 'none';
            isLoading = false;
        }, minLoaderTime - elapsedTime);
    } else {
        pokedexLoader.style.display = 'none';
        isLoading = false;
    }
}

async function loadAllPokemonNames() {
    try {
        const response = await fetch(`${api}pokemon?limit=${allPokemonCount}`);
        const data = await response.json();
        allPokemonNames = data.results.map(pokemon => pokemon.name);
        
        await loadCurrentPagePokemons();
        
        applyActiveFilters();
        updatePaginationDisplay();
    } catch (error) {
    }
}

async function loadCurrentPagePokemons() {
    showLoader()

    try {
        const response = await fetch(`${api}pokemon?limit=${itemsPerPage}&offset=${(currentPage - 1) * itemsPerPage}`);
        const data = await response.json();
        const pagePokemons = data.results;
        
        await loadPokemonTypesForPage(pagePokemons);
        
        displayPokemons(pagePokemons);
        
        filteredPokemonCount = allPokemonCount;
        totalPages = Math.ceil(allPokemonCount / itemsPerPage);
        updatePaginationDisplay();
        
        hideLoader();
    } catch (error) {
        hideLoader();
    }
}

async function loadPokemonTypesForPage(pagePokemons) {
    const promises = pagePokemons.map(async (pokemon) => {
        const pokemonId = pokemon.url.split('/')[6];
        try {
            const pokemonData = await getPokemon(pokemonId);
            if (pokemonData) {
                pokemon.types = pokemonData.general.types;
                return pokemon;
            }
        } catch (error) {
        }
        return null;
    });

    await Promise.all(promises);
}

async function getPokemonTypesPerPage() {
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
        const generalResponse = await fetch(`${api}pokemon/${pokemon}`);
        const generalData = await generalResponse.json();
        const speciesResponse = await fetch(`${api}pokemon-species/${pokemon}`);
        const speciesData = await speciesResponse.json();

        return {
            general: generalData,
            species: speciesData
        };
    } catch (error) {
        return null;
    }
}

async function displayPokemons(pokemonList) {
    pokedexGrid.innerHTML = '';
    
    for (const pokemon of pokemonList) {
        let normalId;
        let pokemonId;
        
        if (pokemon.id) {
            normalId = pokemon.id.toString();
            pokemonId = pokemon.id.toString().padStart(3, '0');
        } else if (pokemon.url) {
            normalId = pokemon.url.split('/')[6];
            pokemonId = normalId.padStart(3, '0');
        } else {
            continue;
        }
                
        if (pokemon.types && pokemon.types.length > 0) {
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
                    <img src="${iconUrl}${pokemonId}.png" alt="${pokemon.name}" onerror="this.style.display='none'">
                </div>
            `;
            
            pokemonCard.addEventListener('click', async function () {
                const cardPokemonId = normalId;
                const cardPokemonName = pokemon.name;
                const pokemonData = await getPokemon(cardPokemonId);
                showDetailView(pokemonData, cardPokemonName, pokemonId, cardColor);
            });
            
            pokedexGrid.appendChild(pokemonCard);
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
    }
}

function applyActiveFilters() {
    const activeTypeFilters = [];
    const checkboxes = filterMenuItems.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        const typeName = checkbox.closest('.main__pokedex-filter-menu-item').querySelector('p').textContent;
        activeTypeFilters.push(typeName);
    });
    
    if (searchInput.value.length > 0) {
        applySearchAndFilters();
    } else if (activeTypeFilters.length > 0) {
        loadFilteredPokemonsByType(activeTypeFilters);
    } else {
        if (!isLoading) {
            loadCurrentPagePokemons();
        }
    }
}

function resetToNormalView() {
    currentPage = 1;
    
    if (!isLoading) {
        loadCurrentPagePokemons();
    }
}

function resetAllFilters() {
    const checkboxes = filterMenuItems.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    searchInput.value = '';
    hideAutocomplete();
    
    resetToNormalView();
}

// Pagination
function updatePaginationDisplay() {
    paginationCurrentPage.textContent = currentPage;
    paginationTotalPages.textContent = totalPages;
    
    paginationFirstButton.disabled = currentPage === 1;
    paginationPrevButton.disabled = currentPage === 1;
    paginationNextButton.disabled = currentPage === totalPages;
    paginationLastButton.disabled = currentPage === totalPages;

    paginationContainer.style.display = 'flex';
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;

    const activeTypeFilters = [];
    const checkboxes = filterMenuItems.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        const typeName = checkbox.closest('.main__pokedex-filter-menu-item').querySelector('p').textContent;
        activeTypeFilters.push(typeName);
    });

    if (searchInput.value.length > 0) {
        loadFilteredPokemonsForPage();
    } else if (activeTypeFilters.length > 0) {
        loadFilteredPokemonsByTypeForPage(activeTypeFilters);
    } else {
        loadCurrentPagePokemons();
    }
    
    scrollToGrid();
}

function goToNextPage() {
    if (currentPage < totalPages) {
        goToPage(currentPage + 1);
    }
}

function goToPrevPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

function goToFirstPage() {
    if (currentPage !== 1) {
        goToPage(1);
    }
}

function goToLastPage() {
    if (currentPage !== totalPages) {
        goToPage(totalPages);
    }
}

function applySearchAndFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    
    const searchResults = allPokemonNames.filter(name => 
        name.startsWith(searchTerm)
    );
    
    updateAutocomplete(searchResults);
    
    if (searchTerm.length > 0) {
        const activeTypeFilters = [];
        const checkboxes = filterMenuItems.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            const typeName = checkbox.closest('.main__pokedex-filter-menu-item').querySelector('p').textContent;
            activeTypeFilters.push(typeName);
        });
                
        if (activeTypeFilters.length > 0) {
            loadFilteredPokemonsWithTypes(searchResults, activeTypeFilters);
        } else {
            loadFilteredPokemons(searchResults);
        }
    } else {
        applyActiveFilters();
    }
}

function updateAutocomplete(searchResults) {
    searchAutocomplete.innerHTML = '';
    
    if (searchResults.length === 0) {
        searchAutocomplete.style.display = 'none';
        return;
    }
    
    const limitedResults = searchResults.slice(0, 10);
    
    limitedResults.forEach((name, index) => {
        const item = document.createElement('div');
        item.classList.add('header__search-autocomplete-item');
        item.textContent = name;
        item.dataset.index = index;
        
        item.addEventListener('click', async () => {
            searchInput.value = name;
            searchAutocomplete.style.display = 'none';
            
            try {
                const pokemonData = await getPokemon(name);
                if (pokemonData) {
                    const pokemonId = pokemonData.general.id.toString().padStart(3, '0');
                    const primaryType = pokemonData.general.types[0].type.name;
                    const cardColor = colorMap[primaryType] || colorMap.normal;
                    showDetailView(pokemonData, name, pokemonId, cardColor);
                }
            } catch (error) {
                applySearchAndFilters();
            }
        });
        
        searchAutocomplete.appendChild(item);
    });
    
    positionAutocomplete();
    searchAutocomplete.style.display = 'block';
}

function positionAutocomplete() {
    const searchContainer = document.querySelector('.header__search-container');
    const searchRect = searchContainer.getBoundingClientRect();
    
    searchAutocomplete.style.top = (searchRect.bottom + 5) + 'px';
    searchAutocomplete.style.left = searchRect.left + 'px';
    searchAutocomplete.style.width = searchRect.width + 'px';
}

function hideAutocomplete() {
    searchAutocomplete.style.display = 'none';
}

function darkenColor(color, factor) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const darkerR = Math.max(0, Math.floor(r * (1 - factor)));
    const darkerG = Math.max(0, Math.floor(g * (1 - factor)));
    const darkerB = Math.max(0, Math.floor(b * (1 - factor)));
    
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
}

function scrollToGrid() {
    const gridContainer = document.querySelector('.main__pokedex-container');
    
    if (gridContainer) {
        gridContainer.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

async function loadFilteredPokemons(filteredNames) {
    showLoader();
    
    try {
        const firstPagePokemonNames = filteredNames.slice(0, itemsPerPage);
        
        const promises = firstPagePokemonNames.map(async (name) => {
            try {
                const response = await fetch(`${api}pokemon/${name}`);
                const data = await response.json();
                return {
                    name: data.name,
                    url: data.url,
                    types: data.types,
                    id: data.id
                };
            } catch (error) {
                return null;
            }
        });
        
        const firstPagePokemons = (await Promise.all(promises)).filter(p => p !== null);
        
        displayPokemons(firstPagePokemons);
        
        filteredPokemonCount = filteredNames.length;
        totalPages = Math.ceil(filteredPokemonCount / itemsPerPage);
        currentPage = 1;
        updatePaginationDisplay();
        
        hideLoader();
    } catch (error) {
        hideLoader();
    }
}

async function loadFilteredPokemonsForPage() {
    showLoader();
    
    try {
        const searchTerm = searchInput.value.toLowerCase();
        const searchResults = allPokemonNames.filter(name => 
            name.startsWith(searchTerm)
        );
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pagePokemonNames = searchResults.slice(startIndex, endIndex);
        
        const promises = pagePokemonNames.map(async (name) => {
            try {
                const response = await fetch(`${api}pokemon/${name}`);
                const data = await response.json();
                return {
                    name: data.name,
                    url: data.url,
                    types: data.types,
                    id: data.id
                };
            } catch (error) {
                return null;
            }
        });
        
        const pagePokemons = (await Promise.all(promises)).filter(p => p !== null);
        
        displayPokemons(pagePokemons);
        
        filteredPokemonCount = searchResults.length;
        totalPages = Math.ceil(filteredPokemonCount / itemsPerPage);
        updatePaginationDisplay();
        
        hideLoader();
    } catch (error) {
        hideLoader();
    }
}

async function loadFilteredPokemonsByType(typeFilters) {
    showLoader();
    
    try {        
        const promises = allPokemonNames.map(async (name) => {
            try {
                const response = await fetch(`${api}pokemon/${name}`);
                const data = await response.json();
                
                const pokemonTypes = data.types.map(t => t.type.name);
                const hasMatchingType = typeFilters.some(filterType => 
                    pokemonTypes.includes(filterType)
                );
                
                if (hasMatchingType) {
                    return {
                        name: data.name,
                        url: data.url,
                        types: data.types,
                        id: data.id
                    };
                }
                return null;
            } catch (error) {
                return null;
            }
        });
        
        const allFilteredPokemons = (await Promise.all(promises)).filter(p => p !== null);
                
        const firstPagePokemons = allFilteredPokemons.slice(0, itemsPerPage);
        displayPokemons(firstPagePokemons);
        
        filteredPokemonCount = allFilteredPokemons.length;
        totalPages = Math.ceil(filteredPokemonCount / itemsPerPage);
        currentPage = 1;
        updatePaginationDisplay();
        
        hideLoader();
    } catch (error) {
        hideLoader();
    }
}

async function loadFilteredPokemonsWithTypes(searchResults, typeFilters) {
    showLoader();
    
    try {
        const promises = searchResults.map(async (name) => {
            try {
                const response = await fetch(`${api}pokemon/${name}`);
                const data = await response.json();
                
                const pokemonTypes = data.types.map(t => t.type.name);
                const hasMatchingType = typeFilters.some(filterType => 
                    pokemonTypes.includes(filterType)
                );
                
                if (hasMatchingType) {
                    return {
                        name: data.name,
                        url: data.url,
                        types: data.types,
                        id: data.id
                    };
                }
                return null;
            } catch (error) {
                return null;
            }
        });
        
        const filteredPokemons = (await Promise.all(promises)).filter(p => p !== null);
        
        const firstPagePokemons = filteredPokemons.slice(0, itemsPerPage);
        displayPokemons(firstPagePokemons);
        
        filteredPokemonCount = filteredPokemons.length;
        totalPages = Math.ceil(filteredPokemonCount / itemsPerPage);
        currentPage = 1;
        updatePaginationDisplay();
        
        hideLoader();
    } catch (error) {
        hideLoader();
    }
}

async function loadFilteredPokemonsByTypeForPage(typeFilters) {
    showLoader();
    
    try {        
        const promises = allPokemonNames.map(async (name) => {
            try {
                const response = await fetch(`${api}pokemon/${name}`);
                const data = await response.json();
                
                const pokemonTypes = data.types.map(t => t.type.name);
                const hasMatchingType = typeFilters.some(filterType => 
                    pokemonTypes.includes(filterType)
                );
                
                if (hasMatchingType) {
                    return {
                        name: data.name,
                        url: data.url,
                        types: data.types,
                        id: data.id
                    };
                }
                return null;
            } catch (error) {
                return null;
            }
        });
        
        const allFilteredPokemons = (await Promise.all(promises)).filter(p => p !== null);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pagePokemons = allFilteredPokemons.slice(startIndex, endIndex);
        
        displayPokemons(pagePokemons);
        
        filteredPokemonCount = allFilteredPokemons.length;
        totalPages = Math.ceil(filteredPokemonCount / itemsPerPage);
        updatePaginationDisplay();
        
        hideLoader();
    } catch (error) {
        hideLoader();
    }
}

// Events 
window.addEventListener('load', async function () {
    await loadAllPokemonNames();
    getPokemonTypesPerPage();
});

window.addEventListener('resize', function() {
    if (searchAutocomplete.style.display === 'block') {
        positionAutocomplete();
    }
});

searchInput.addEventListener('input', function () {
    searchInput.value = searchInput.value.toLowerCase();
    searchInput.value = searchInput.value.trim();

    if (searchInput.value.length === 0) {
        hideAutocomplete();
        applyActiveFilters();
    } else {
        applySearchAndFilters();
    }
});

document.addEventListener('click', function(event) {
    if (!searchInput.contains(event.target) && !searchAutocomplete.contains(event.target)) {
        hideAutocomplete();
    }
});

searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        hideAutocomplete();
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

filterMenuItems.addEventListener('change', function(event) {
    if (event.target.type === 'checkbox') {
        applyActiveFilters();
    }
});

// Pagination 
paginationFirstButton.addEventListener('click', goToFirstPage);
paginationPrevButton.addEventListener('click', goToPrevPage);
paginationNextButton.addEventListener('click', goToNextPage);
paginationLastButton.addEventListener('click', goToLastPage);

function togglePokedexGrid(bool) {
    if (bool) {
        pokedexContainer.style.display = 'grid';
        pokedexFilterContainer.style.display = 'flex';
    } else {
        pokedexContainer.style.display = 'none';
        pokedexFilterContainer.style.display = 'none';
    }
}

function hideDetailView() {
    detailViewContainer.style.display = 'none';
    togglePokedexGrid(true);
}

async function buildEvolutionChain(evolutionChain) {    
    async function processEvolutionChain(chain, level = 0) {
        const evolutionItems = [];
        
        if (level > 0) {
            const speciesId = chain.species.url.split('/')[6];
            evolutionItems.push(`
                <div class="main__details-evolution-item">
                    <img src="${iconUrl}${speciesId.padStart(3, '0')}.png" alt="${chain.species.name}" onerror="this.style.display='none'">
                    <p class="main__details-evolution-item-name">${chain.species.name}</p>
                </div>
            `);
        }
        
        if (level > 0 && chain.evolves_to.length > 0) {
            evolutionItems.push(`
                <div class="main__details-evolution-arrow">></div>
            `);
        }
        
        for (const evolution of chain.evolves_to) {
            evolutionItems.push(...await processEvolutionChain(evolution, level + 1));
        }
        
        return evolutionItems;
    }
    
    const baseSpeciesId = evolutionChain.species.url.split('/')[6];
    const evolutionItems = [
        `<div class="main__details-evolution-item">
            <img src="${iconUrl}${baseSpeciesId.padStart(3, '0')}.png" alt="${evolutionChain.species.name}" onerror="this.style.display='none'">
            <p class="main__details-evolution-item-name">${evolutionChain.species.name}</p>
        </div>`
    ];
    
    if (evolutionChain.evolves_to.length > 0) {
        evolutionItems.push(`
            <div class="main__details-evolution-arrow">></div>
        `);
    }
    
    for (const evolution of evolutionChain.evolves_to) {
        evolutionItems.push(...await processEvolutionChain(evolution, 1));
    }
    
    const pokemonEvolutionItems = evolutionItems.join('');
    
    return {
        pokemonEvolutionItems
    };
}

async function showDetailView(pokemon, pokemonName, pokemonId, cardColor) {
    showLoader();
    detailViewContainer.innerHTML = '';
    detailViewContainer.style.display = 'flex';
    togglePokedexGrid(false);

    const generalData = pokemon.general;
    const speciesData = pokemon.species;

    const pokemonHeight = generalData.height / 10 + "m";
    const pokemonWeight = generalData.weight / 10 + "kg";

    //Gender
    let male = 0;
    let female = 0;
    const pokemonGender = speciesData.gender_rate;

    if (pokemonGender === -1) {
        male = "??";
        female = "??";
    } else if (pokemonGender === 0) {
        male = "100%";
        female = "0%";
    } else if (pokemonGender === 8) {
        male = "0%";
        female = "100%";
    } else {
        male = (pokemonGender / 8) * 100 + "%";
        female = 100 - (pokemonGender / 8) * 100 + "%";
    }


    //Stats
    const pokemonStats = generalData.stats;
    const pokemonStatsItems = pokemonStats.map(({ stat, base_stat }) => `
        <div class="main__details-stat-item">
            <p class="main__details-stat-name">${stat.name}</p>
            <div class="main__details-stat-bar">
                <div class="main__details-stat-fill" style="width: ${base_stat}%"></div>
            </div>
            <p class="main__details-stat-value">${base_stat}</p>
        </div>
    `).join('');

    //Abilities
    const pokemonAbilitiesItems = generalData.abilities.map(({ ability }) => `
        <div class="main__details-ability-item">
            <p class="main__details-ability-name">${ability.name}</p>
        </div>
    `).join('');
    
    //Evolution
    const pokemonEvolutionUrl = speciesData.evolution_chain.url;
    const pokemonEvolutionRes = await fetch(pokemonEvolutionUrl);
    const pokemonEvolutionData = await pokemonEvolutionRes.json();
    const pokemonEvolution = pokemonEvolutionData.chain;
    const { pokemonEvolutionItems } = await buildEvolutionChain(pokemonEvolution);

    const detailCard = document.createElement('div');
    detailCard.classList.add('main__pokedex-details-card');
    const darkerColor = darkenColor(cardColor, 0.3);
    detailCard.style.backgroundColor = darkerColor;
    detailCard.innerHTML = `
        <div class="main__details-header">
            <button class="main__details-header-back" id="pokedex-details-back">
                <img src="assets/icon/back.svg" alt="Back" onclick="hideDetailView()">
            </button>
            <div class="main__details-header-title">
                <p class="main__details-header-title-name">${pokemonName}</p>
                <p class="main__details-header-title-number">#${pokemonId}</p>
            </div>
        </div>

        <div class="main__details-image">
            <img src="${iconUrl}${pokemonId}.png" alt="Pokemon" id="pokedex-details-image">
        </div>

        <div class="main__details-content">
            <div class="main__details-section">
                <h3 class="main__details-section-title">About</h3>
                <div class="main__details-about-grid">
                    <div class="main__details-about-item">
                        <p class="main__details-about-label">Species</p>
                        <div class="main__details-about-value">
                            ${generalData.types.map(({ type }) => `
                                <div class="main__pokedex-card-types-type">
                                    <p>${type.name}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="main__details-about-item">
                        <p class="main__details-about-label">Height</p>
                        <p class="main__details-about-value" id="pokedex-details-height">${pokemonHeight}</p>
                    </div>
                    <div class="main__details-about-item">
                        <p class="main__details-about-label">Weight</p>
                        <p class="main__details-about-value" id="pokedex-details-weight">${pokemonWeight}</p>
                    </div>
                    <div class="main__details-about-item">
                        <p class="main__details-about-label">Abilities</p>
                        <div class="main__details-about-value">
                            ${pokemonAbilitiesItems}
                        </div>
                    </div>
                    <div class="main__details-about-item">
                        <p class="main__details-about-label">Gender</p>
                        <p class="main__details-about-value" id="pokedex-details-gender">${male} male / ${female} female</p>
                    </div>
                </div>
            </div>

            <div class="main__details-section">
                <h3 class="main__details-section-title">Stats</h3>
                <div class="main__details-stats">
                    ${pokemonStatsItems}
                </div>
            </div>

            <div class="main__details-section">
                <h3 class="main__details-section-title">Evolution</h3>
                <div class="main__details-evolution">
                    <div class="main__details-evolution-chain" id="pokedex-details-evolution-chain">
                        ${pokemonEvolutionItems}
                    </div>
                </div>
            </div>
        </div>


    `;
    detailViewContainer.appendChild(detailCard);
    hideLoader();
}