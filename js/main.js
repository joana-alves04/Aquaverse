/* Variáveis */

let allFishSpecies = [];
let currentFilter = 'all';
let currentSearchQuery = '';
let currentSortOrder = 'name-asc';

const fishGrid = document.getElementById('fish-grid');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterButtons = document.querySelectorAll('.filter-btn');
const speciesCountEl = document.getElementById('species-count');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const emptyState = document.getElementById('empty-state');
const favBadge = document.getElementById('fav-badge');
const btnRandom = document.getElementById('btn-random');

/* Botão de voltar para o topo */
document.addEventListener('DOMContentLoaded', () => {
    const backToTopBtn = document.getElementById('btn-back-to-top');

    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.remove('d-none');
            } else {
                backToTopBtn.classList.add('d-none');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

let fishModalInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    fishModalInstance = new bootstrap.Modal(document.getElementById('fishModal'));

    initEventListeners();

    window.addEventListener('api-error', () => {
        if (errorState) errorState.classList.remove('d-none');
    });

    allFishSpecies = await fetchFishSpecies();

    if (loadingState) loadingState.classList.add('d-none');

    updateFavoriteBadge();
    renderCatalog();
});
/*botão de pesquisa e ordenação(A-Z)*/
function initEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.trim().toLowerCase();
            renderCatalog();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSortOrder = e.target.value;
            renderCatalog();
        });
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => {
                b.classList.remove('active', 'btn-info');
                b.classList.add('btn-outline-info');
            });

            const target = e.currentTarget;
            target.classList.add('active', 'btn-info');
            target.classList.remove('btn-outline-info');

            currentFilter = target.getAttribute('data-filter');
            renderCatalog();
        });
    });
    /*Sorteio para o peixe aleatório*/
    if (btnRandom) {
        btnRandom.addEventListener('click', () => {
            if (allFishSpecies.length === 0) return;
            const randomIndex = Math.floor(Math.random() * allFishSpecies.length);
            openFishModal(allFishSpecies[randomIndex].id);
        });
    }
}

function renderCatalog() {
    if (!fishGrid) return;
    /*Filtros*/
    let filtered = allFishSpecies.filter(fish => {
        if (currentFilter === 'freshwater' || currentFilter === 'agua-doce' || currentFilter === 'doce') {
            return fish.habitat === 'Água Doce';
        }
        if (currentFilter === 'marine' || currentFilter === 'agua-salgada' || currentFilter === 'salgada') {
            return fish.habitat === 'Água Salgada';
        }
        if (currentFilter === 'favorites') {
            return isFavorite(fish.id);
        }
        return true;
    });

    if (currentSearchQuery !== '') {
        filtered = filtered.filter(fish =>
            fish.commonName.toLowerCase().includes(currentSearchQuery) ||
            fish.scientificName.toLowerCase().includes(currentSearchQuery)
        );
    }

    filtered.sort((a, b) => {
        if (currentSortOrder === 'name-asc') {
            return a.commonName.localeCompare(b.commonName);
        } else {
            return b.commonName.localeCompare(a.commonName);
        }
    });

    if (speciesCountEl) speciesCountEl.textContent = filtered.length;
    fishGrid.innerHTML = '';

    if (filtered.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
        return;
    } else {
        if (emptyState) emptyState.classList.add('d-none');
    }

    filtered.forEach(fish => {
        const card = createFishCardElement(fish);
        fishGrid.appendChild(card);
    });
}

/*cards para os peixes */
function createFishCardElement(fish) {
    const col = document.createElement('div');
    col.className = 'col';

    const isFav = isFavorite(fish.id);
    const badgeColor = fish.habitat === 'Água Doce' ? 'bg-primary' : 'bg-success';
    const favBtnClass = isFav ? 'btn-danger' : 'btn-outline-danger';

    col.innerHTML = `
        <div class="card fish-card h-100 shadow-sm">
            <div class="fish-img-container">
                <img src="${fish.image}" alt="${fish.commonName}" loading="lazy">
            </div>
            <div class="card-body d-flex flex-column">
                <h5 class="card-title fw-bold text-info h6">${fish.commonName}</h5>
                <span class="badge ${badgeColor} mb-3 align-self-start">${fish.habitat}</span>
                
                <div class="mt-auto d-flex justify-content-between align-items-center">
                    <button class="btn btn-outline-info btn-sm btn-details">Ver Detalhes</button>
                    <button class="btn btn-sm ${favBtnClass} btn-fav" title="Favorito">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    col.querySelector('.btn-details').addEventListener('click', () => openFishModal(fish.id));

    const favBtn = col.querySelector('.btn-fav');
    favBtn.addEventListener('click', () => {
        const nowFav = toggleFavorite(fish.id);
        favBtn.className = `btn btn-sm ${nowFav ? 'btn-danger' : 'btn-outline-danger'} btn-fav`;
        updateFavoriteBadge();
        if (currentFilter === 'favorites') renderCatalog();
    });

    return col;
}

function updateFavoriteBadge() {
    if (!favBadge) return;
    const favIds = getFavorites();
    const validFavorites = favIds.filter(id => allFishSpecies.some(fish => fish.id === id));
    favBadge.textContent = validFavorites.length;
}

/*master-detail*/
function openFishModal(fishId) {
    const fish = allFishSpecies.find(f => f.id === fishId);
    if (!fish) return;

    document.getElementById('modal-common-name').textContent = fish.commonName;
    document.getElementById('modal-scientific-name').textContent = fish.scientificName;
    document.getElementById('modal-habitat').textContent = fish.habitat;
    document.getElementById('modal-habitat').className = `badge ${fish.habitat === 'Água Doce' ? 'bg-primary' : 'bg-success'}`;
    document.getElementById('modal-location').textContent = fish.location;
    document.getElementById('modal-img').src = fish.image;

    const modalFavBtn = document.getElementById('modal-fav-btn');
    const newModalFavBtn = modalFavBtn.cloneNode(true);
    modalFavBtn.parentNode.replaceChild(newModalFavBtn, modalFavBtn);

    const updateModalBtnVisuals = () => {
        const isFav = isFavorite(fish.id);
        newModalFavBtn.className = `btn btn-sm ${isFav ? 'btn-danger' : 'btn-outline-danger'} w-100`;
        newModalFavBtn.innerHTML = `<i class="fa-solid fa-heart"></i> ${isFav ? 'Nos Favoritos' : 'Adicionar Aos Favoritos'}`;
    };

    updateModalBtnVisuals();

    newModalFavBtn.addEventListener('click', () => {
        toggleFavorite(fish.id);
        updateModalBtnVisuals();
        renderCatalog();
        updateFavoriteBadge();
    });

    fishModalInstance.show();
}