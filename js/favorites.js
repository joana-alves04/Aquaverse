const STORAGE_KEY = 'aquaverse_favorites';

function getFavorites() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

function isFavorite(id) {
    const favorites = getFavorites();
    return favorites.includes(id);
}

function toggleFavorite(id) {
    let favorites = getFavorites();
    const index = favorites.indexOf(id);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(id);
    }

    saveFavorites(favorites);
    return isFavorite(id);
}

document.addEventListener('DOMContentLoaded', async () => {
    const favoritesGrid = document.getElementById('favorites-grid');
    if (!favoritesGrid) return;

    const fishModalElement = document.getElementById('fishModal');
    let fishModalInstance = fishModalElement ? new bootstrap.Modal(fishModalElement) : null;
    const emptyFavorites = document.getElementById('empty-favorites');
    const favBadge = document.getElementById('fav-badge');

    if (typeof fetchFishSpecies !== 'function') {
        console.error('Erro: o ficheiro api.js não foi carregado.');
        return;
    }

    const allFishSpecies = await fetchFishSpecies();
    const favIds = getFavorites();

    const favoriteFishList = allFishSpecies.filter(fish => favIds.includes(fish.id));

    if (favBadge) favBadge.textContent = favoriteFishList.length;

    if (favoriteFishList.length === 0) {
        if (emptyFavorites) emptyFavorites.classList.remove('d-none');
    } else {
        if (emptyFavorites) emptyFavorites.classList.add('d-none');

        favoriteFishList.forEach(fish => {
            const col = document.createElement('div');
            col.className = 'col';

            const badgeColor = fish.habitat === 'Água Doce' ? 'bg-primary' : 'bg-success';

            col.innerHTML = `
                <div class="card fish-card h-100 shadow-sm">
                    <div class="fish-img-container">
                    <img src="${fish.image}" alt="${fish.commonName}" loading="lazy">                    
                </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold text-info h6">${fish.commonName}</h5>
                        <p class="card-text small text-muted fst-italic mb-2">${fish.scientificName}</p>
                        <span class="badge ${badgeColor} mb-3 align-self-start">${fish.habitat}</span>
                        
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <button class="btn btn-outline-info btn-sm btn-details">Ver Detalhes</button>
                            <button class="btn btn-sm btn-danger btn-remove-fav" title="Remover">
                                <i class="fa-solid fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            col.querySelector('.btn-details').addEventListener('click', () => {
                document.getElementById('modal-common-name').textContent = fish.commonName;
                document.getElementById('modal-scientific-name').textContent = fish.scientificName;
                document.getElementById('modal-habitat').textContent = fish.habitat;
                document.getElementById('modal-habitat').className = `badge ${badgeColor}`;
                document.getElementById('modal-location').textContent = fish.location;
                document.getElementById('modal-img').src = fish.image;

                const modalFavBtn = document.getElementById('modal-fav-btn');
                modalFavBtn.className = 'btn btn-sm btn-danger w-100';
                modalFavBtn.innerHTML = `<i class="fa-solid fa-heart"></i> Nos Favoritos`;

                const newModalFavBtn = modalFavBtn.cloneNode(true);
                modalFavBtn.parentNode.replaceChild(newModalFavBtn, modalFavBtn);

                newModalFavBtn.addEventListener('click', () => {
                    toggleFavorite(fish.id);
                    location.reload();
                });

                if (fishModalInstance) fishModalInstance.show();
            });

            col.querySelector('.btn-remove-fav').addEventListener('click', () => {
                toggleFavorite(fish.id);
                location.reload();
            });

            favoritesGrid.appendChild(col);
        });
    }
});