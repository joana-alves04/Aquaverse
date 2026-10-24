const API_URL = 'https://api.inaturalist.org/v1/observations?taxon_id=47178&photos=true&quality_grade=research&locale=pt&per_page=100';

async function fetchFishSpecies() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error('Nenhum resultado devolvido pela API.');
        }

        const normalizedFish = data.results.map(obs => {
            const taxon = obs.taxon || {};
            const photos = obs.photos && obs.photos.length > 0 ? obs.photos[0].url.replace('square', 'medium') : '';

            let habitat = "Água Salgada";

            const desc = (obs.description || "").toLowerCase();
            const scientific = (taxon.name || "").toLowerCase();
            const common = (taxon.preferred_common_name || "").toLowerCase();

            const palavrasAguaDoce = [
                'freshwater', 'river', 'lake', 'doce', 'rio', 'lago', 'ribeira',
                'cichlid', 'carpa', 'goldfish', 'truta', 'achigã', 'barbo', 'tilapia'
            ];

            const isFreshwater = palavrasAguaDoce.some(palavra =>
                desc.includes(palavra) || scientific.includes(palavra) || common.includes(palavra)
            );

            if (isFreshwater) {
                habitat = "Água Doce";
            }

            return {
                id: obs.id,
                commonName: taxon.preferred_common_name ? capitalizeFirstLetter(taxon.preferred_common_name) : (taxon.name || "Espécie Desconhecida"),
                scientificName: taxon.name || "Nome científico indisponível",
                habitat: habitat,
                image: photos,
                location: obs.place_guess || "Localização não especificada",
                description: obs.description || "Sem descrição detalhada."
            };
        });

        const peixesUnicos = [];
        const nomesVistos = new Set();

        normalizedFish.forEach(peixe => {
            if (!nomesVistos.has(peixe.scientificName)) {
                nomesVistos.add(peixe.scientificName);
                peixesUnicos.push(peixe);
            }
        });

        return peixesUnicos;

    } catch (error) {
        console.error('Falha de ligação à API ou sem internet:', error);
        window.dispatchEvent(new CustomEvent('api-error', { detail: error.message }));
        return [];
    }
}

function capitalizeFirstLetter(string) {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
}