const genreImportance = {
  "abuse": 1,
  "academy": 3,
  "acting": 3,
  "action": 1,
  "adopted": 2,
  "androgine": 1,
  "animals": 3,
  "apocalypse": 4,
  "art": 2,
  "arts-martiaux": 2,
  "aventure": 1,
  "badass": 5,
  "beast world": 5,
  "business": 3,
  "caretaker": 3,
  "child lead": 4,
  "comédie": 1,
  "cooking": 5,
  "crossdressing": 2,
  "cultivation": 4,
  "drame": 2,
  "disciple": 2,
  "dungeon": 5,
  "enfant": 3,
  "fantasy": 5,
  "father": 4,
  "female lead": 1,
  "food": 3,
  "jeux vidéo": 3,
  "ghosts": 2,
  "harem": 2,
  "historical": 5,
  "horreur": 3,
  "isekai": 3,
  "idol": 4,
  "long life": 2,
  "magie": 2,
  "male lead": 1,
  "manga": 4,
  "mature": 2,
  "mécanique": 2,
  "médicale": 4,
  "militaire": 2,
  "moderne": 5,
  "monstre": 1,
  "mother": 3,
  "murim": 4,
  "multi world": 5,
  "musique": 3,
  "mystère": 5,
  "novel": 2,
  "omegaverse": 3,
  "power": 1,
  "prof": 2,
  "psychologique": 2,
  "réincarnation": 4,
  "return": 3,
  "revenge": 1,
  "rich": 3,
  "romance": 1,
  "saint": 1,
  "school life": 1,
  "seconde chance": 3,
  "secret identity": 4,
  "sick": 5,
  "sport": 1,
  "suicide":1,
  "superhero": 1,
  "surnaturel": 2,
  "system": 5,
  "time travel": 2,
  "tower": 4,
  "tyrant": 4,
  "transmigration": 3,
  "transformation": 2,
  "vampire": 2,
  "villainess": 1,
  "yaoi": 5
  // Tous les genres non listés vaudront 1
};


// DOM elements
const container = document.getElementById('mangaContainer');
const searchInput = document.getElementById('searchInput');
const checkboxes = document.querySelectorAll('.sidebar-genres input[type="checkbox"]');

let currentSort = null;

function setSort(type) {
  if (currentSort === type) {
    currentSort = null;
  } else {
    currentSort = type;
  }

  // Boutons actifs
  document.querySelectorAll('.sort-buttons button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase().includes(type)) {
      btn.classList.add('active');
    }
  });

  if (type === 'genres') {
    trierParGenresSimilaires();
  } else {
    afficherAvecFiltres();
  }
}

function normalizeGenresArray(genres) {
  if (!genres) return [];

  const arr = Array.isArray(genres) ? genres : genres.split(',');

  return arr.map(g =>
    g.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );
}


function countCommonGenres(mangaGenres, selectedGenres) {
  const mangaArray = normalizeGenresArray(mangaGenres);
  const selectedArray = normalizeGenresArray(selectedGenres);
  return mangaArray.filter(genre => selectedArray.includes(genre)).length;
}


function displayMangas(mangas) {
  const countDiv = document.getElementById("mangaCount");
  if (countDiv) {
    countDiv.textContent = `${mangas.length} manga${mangas.length > 1 ? 's' : ''} affiché${mangas.length > 1 ? 's' : ''}`;
  }

  container.innerHTML = '';
  mangas.forEach(manga => {
    const id = Object.keys(mangaData).find(key => mangaData[key] === manga);
    const imageSrc = manga.image && manga.image.trim() !== '' ? manga.image : 'image/fond.jpg';

    const card = document.createElement('div');
    card.classList.add('manga');
    card.setAttribute('data-id', id);
    card.setAttribute('data-title', manga.title.toLowerCase());

    const genresStr = Array.isArray(manga.genres)
      ? manga.genres.map(g => g.toLowerCase().trim()).join(',')
      : (manga.genres || '').toLowerCase().trim();
    card.setAttribute('data-genres', genresStr);
    card.setAttribute('data-othertitles', (manga.otherTitles || []).join(',').toLowerCase());

    card.innerHTML = `
      <img src="${imageSrc}" alt="Couverture de ${manga.title || 'Manga'}">
      <h3>${manga.title || 'Sans titre'}</h3>
    `;

    card.addEventListener('click', () => openPopup(id));
    container.appendChild(card);
  });

  const countBar = document.getElementById("mangaCountBar");
if (countBar) {
  if (mangas.length > 0) {
    countBar.textContent = `${mangas.length} manga${mangas.length > 1 ? 's' : ''}`;
  } else {
    countBar.textContent = 'Aucun manga trouvé';
  }
}
document.getElementById("mangaCountBar").innerHTML = `${mangas.length} mangas`;

}


function filterByStatus(status) {
  const allMangas = Object.values(mangaData);
  let filtered = allMangas;

  if (status && status !== 'tous') {
    filtered = allMangas.filter(m => (m.status || 'inconnu').toLowerCase() === status.toLowerCase());
    displayMangas(filtered);
    return;
  }

  // Sinon : tous les statuts triés par groupe
  const order = ['en cours', 'pause', 'inconnu', 'complet', 'abandonné'];

  // Crée une liste finale avec des titres de section
  const grouped = [];

  order.forEach(stat => {
    const group = allMangas.filter(m => (m.status || 'inconnu').toLowerCase() === stat);
    if (group.length > 0) {
      grouped.push({ isTitle: true, title: stat });
      grouped.push(...group);
    }
  });

  displayGroupedByStatus(grouped);
  filterMangas();
}

function filtrerParLecture(mangas) {
  const filterValue = document.getElementById("lectureFilter").value;
  return mangas.filter(m => {
    const chTotal = parseInt(m.chTotal) || 0;
    const lusArray = (m.chLus || "")
      .replace(/[^\d.]/g, '')
      .split('.')
      .filter(x => x !== '')
      .map(Number);

    const maxLu = Math.max(...lusArray, 0);

    if (filterValue === "nonCommence") {
      return lusArray.length === 0;
    } else if (filterValue === "enCours") {
      return lusArray.length > 0 && (maxLu < chTotal);
    } else if (filterValue === "termine") {
      return (maxLu === chTotal) && (m.status?.toLowerCase() === "complet");
    }

    return true; // Si "tous"
  });
}

function filtrerParJade(mangas) {
  const filterValue = document.getElementById("jadeFilter")?.value;
  if (!filterValue || filterValue === "tous") return mangas;

  return mangas.filter(m => {
    const chTotal = parseInt(m.chTotal) || 0;
    const jade = parseInt(m.chJade) || 0;

    if (filterValue === "nonCommence") {
      return jade === 0;
    } else if (filterValue === "enCours") {
      return jade > 0 && jade < chTotal;
    } else if (filterValue === "termine") {
      const status = (m.status || "").toLowerCase();
      return jade === chTotal && (status === "complet" || status === "abandonné");
    }


    return true;
  });
}


function displayGroupedByStatus(items) {
  container.innerHTML = '';

  items.forEach(item => {
    if (item.isTitle) {
      const line = document.createElement('div');
      line.className = 'status-divider';
      line.textContent = `— ${capitalizeFirstLetter(item.title)} —`;
      container.appendChild(line);
    } else {
      const id = item.id || Object.keys(mangaData).find(key => mangaData[key] === item);
      const imageSrc = item.image && item.image.trim() !== '' ? item.image : 'image/fond.jpg';

      const card = document.createElement('div');
      card.classList.add('manga');
      card.setAttribute('data-id', id);
      card.setAttribute('data-title', item.title.toLowerCase());
      const genresStr = Array.isArray(item.genres)
        ? item.genres.map(g => g.toLowerCase().trim()).join(',')
        : (item.genres || '').toLowerCase().trim();
      card.setAttribute('data-genres', genresStr);
      card.setAttribute('data-othertitles', (item.otherTitles || []).join(',').toLowerCase());

      card.innerHTML = `
        <img src="${imageSrc}" alt="Couverture de ${item.title || 'Manga'}">
        <h3>${item.title || 'Sans titre'}</h3>
      `;

      card.addEventListener('click', () => openPopup(id));
      container.appendChild(card);
    }
  });
}




function capitalizeFirstLetter(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}




function openPopup(id) {
  const manga = mangaData[id];
  document.getElementById('popupTitle').innerText = manga.title;
  document.getElementById('popupImg').src = manga.image || 'image/fond.jpg';
  const formattedDescription = (manga.description || '')
  .split('\n')
  .map(p => `<p>${p.trim()}</p>`)
  .join('');
document.getElementById('popupDescription').innerHTML = formattedDescription;

  document.getElementById('popupGenres').innerText = formatGenres(manga.genres || "");
  document.getElementById('popupOtherTitles').innerText = manga.otherTitles?.join(', ') || "Aucun";

  // Ch et Ch total
  const popupChContainer = document.getElementById('popupChContainer');
  popupChContainer.innerHTML = `
  <div class="row">
    <div class="col-4"><strong>Ch total:</strong> ${manga.chTotal || '—'}</div>
    <div class="col-4"><strong>Ch lus:</strong> ${manga.chLus || '—'}</div>
    <div class="col-4"><strong>Ch:</strong> ${manga.chJade || '—'}</div>
  </div>
`;


  // Date et status
  const popupDateStatus = document.getElementById('popupDateStatus');
  popupDateStatus.innerHTML = `
  <div class="row">
    <div class="col-4"><strong>Status:</strong> ${manga.status || '—'}</div>
    <div class="col-4"><strong>Date:</strong> ${manga.date || '—'}</div>
    <div class="col-4"><strong>Last read:</strong> ${manga.dernierLecture || '—'}</div>
  </div>
`;


  // Liens externes
  const externalLinksContainer = document.getElementById('popupExternalLinks');
  externalLinksContainer.innerHTML = '';
  if (manga.externalLinks) {
    for (const [name, url] of Object.entries(manga.externalLinks)) {
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = name;
        externalLinksContainer.appendChild(a);
      }
    }
  } else {
    externalLinksContainer.innerHTML = "<em>Aucun lien externe disponible.</em>";
  }

  document.getElementById('popup').style.display = 'flex';
}



function closePopup() {
  document.getElementById('popup').style.display = 'none';
}

function formatGenres(genres) {
  if (!genres) return "—";
  const arr = Array.isArray(genres) ? genres : genres.split(',');
  return arr.map(g => g.trim()[0].toUpperCase() + g.trim().slice(1)).join(', ');
}

function resetFilters() {
  // Réinitialiser la recherche
  searchInput.value = '';

  // Décoche tous les genres
  checkboxes.forEach(cb => cb.checked = false);

  // Réinitialise le filtre de lecture
  const lectureFilter = document.getElementById("lectureFilter");
  if (lectureFilter) lectureFilter.value = 'tous';

  // Vide le champ de chapitres minimum
  const minChapitresInput = document.getElementById("minChapitresInput");
  if (minChapitresInput) minChapitresInput.value = '';

  // Réinitialise le tri
  currentSort = null;

  // Recharge avec tous les mangas
  afficherAvecFiltres();
}

window.addEventListener("click", (e) => {
  const genreSidebar = document.getElementById("genreSidebar");
  const sortSidebar = document.getElementById("sortSidebar");

  const clickedOutsideGenre = !genreSidebar.contains(e.target) && e.target.id !== "openSidebarBtn";
  const clickedOutsideSort = !sortSidebar.contains(e.target) && e.target.id !== "openSortSidebarBtn";

  if (genreSidebar.classList.contains("open") && clickedOutsideGenre) {
    genreSidebar.classList.remove("open");
  }

  if (sortSidebar.classList.contains("open") && clickedOutsideSort) {
    sortSidebar.classList.remove("open");
  }

  const dropdown = document.querySelector(".sort-dropdown");
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.remove("open");
  }
});

// Empêche la propagation du clic dans les sidebars
document.getElementById("genreSidebar").addEventListener("click", (e) => e.stopPropagation());
document.getElementById("sortSidebar").addEventListener("click", (e) => e.stopPropagation());

searchInput.addEventListener('input', afficherAvecFiltres);
checkboxes.forEach(cb => cb.addEventListener('change', afficherAvecFiltres));

function afficherAvecFiltres() {
  let mangas = Object.values(mangaData);

  // 1. Lecture : non commencé / en cours / terminé
  const lectureVal = document.getElementById("lectureFilter")?.value || "tous";
  const jadeVal = document.getElementById("jadeFilter")?.value || "tous";

  mangas = mangas.filter(m => {
    const chTotal = parseInt(m.chTotal || 0);

    const lusArray = (m.chLus || "")
      .replace(/[^\d.]/g, '')
      .split('.')
      .filter(x => x !== '')
      .map(Number);
    const maxLu = Math.max(...lusArray, 0);

    const jade = parseInt(m.chJade) || 0;

    let lectureOK = true;
    let jadeOK = true;

    // Lecture Filter
    if (lectureVal === "nonCommence") lectureOK = lusArray.length === 0;
    else if (lectureVal === "enCours") lectureOK = lusArray.length > 0 && maxLu < chTotal;
    else if (lectureVal === "termine") {
      const status = (m.status || "").toLowerCase();
      lectureOK = maxLu === chTotal && (status === "complet" || status === "abandonné");
    }


    // Jade Filter
    if (jadeVal === "nonCommence") jadeOK = jade === 0;
    else if (jadeVal === "enCours") jadeOK = jade > 0 && jade < chTotal;
    else if (jadeVal === "termine") {
      const status = (m.status || "").toLowerCase();
      jadeOK = jade === chTotal && (status === "complet" || status === "abandonné");
    }


    // S’ils sont tous les deux sélectionnés, il faut que les deux soient vrais
    if (lectureVal !== "tous" && jadeVal !== "tous") {
      return lectureOK && jadeOK;
    }

    // Sinon on applique seulement celui qui est activé
    if (lectureVal !== "tous") return lectureOK;
    if (jadeVal !== "tous") return jadeOK;

    return true; // Aucun des deux actifs
  });


  // 2. Genre cochés
  const selectedGenres = Array.from(document.querySelectorAll("#genreSidebar input[type='checkbox']:checked"))
    .map(cb => cb.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  if (selectedGenres.length > 0) {
    mangas = mangas.filter(m => {
      const genres = normalizeGenresArray(m.genres);
      return selectedGenres.every(g => genres.includes(g));
    });
  }

  // 3. Mot-clé dans la recherche
// 3. Mot-clé dans la recherche (avec Fuse.js)
const search = searchInput.value.trim();
if (search) {
  const options = {
    keys: ['title', 'otherTitles'],
    threshold: 0.4, // 0 = strict, 1 = très tolérant
    ignoreLocation: true,
    minMatchCharLength: 2
  };

  const fuse = new Fuse(mangas, options);
  const results = fuse.search(search);
  mangas = results.map(r => r.item);
}



  // 4. Chapitres minimum
  const minInput = document.getElementById("minChapitresInput");
  if (minInput) {
    const minCh = parseInt(minInput.value) || 0;
    mangas = mangas.filter(m => {
      const chTotal = parseInt(m.chTotal || m.chapitresTotal || 0);
      return chTotal >= minCh;
    });
  }

  // 5. Tri (si activé)
  // 5. Tri (si activé) ou mélanger si aucun tri
  if (currentSort === 'alphabetique') {
    mangas.sort((a, b) => a.title.localeCompare(b.title));
  } else if (currentSort === 'date') {
    mangas.sort((a, b) => new Date(b.date || "2000-01-01") - new Date(a.date || "2000-01-01"));
  } else if (currentSort === 'chapitresMin') {
    mangas.sort((a, b) => (parseInt(b.chTotal || 0)) - (parseInt(a.chTotal || 0)));
  } else {
    // Mélange aléatoire si aucun tri activé
    mangas.sort(() => Math.random() - 0.5);
  }


  // 6. Affichage final
  displayMangas(mangas);
}


document.addEventListener("DOMContentLoaded", () => {
  afficherAvecFiltres();
});


document.querySelector('.dropdown-toggle').addEventListener('click', (e) => {
  e.stopPropagation();
  document.querySelector('.sort-dropdown').classList.toggle('open');
});

window.addEventListener('click', () => {
  document.querySelector('.sort-dropdown').classList.remove('open');
});

document.getElementById("lectureFilter").addEventListener("change", afficherAvecFiltres);

document.getElementById("openSidebarBtn").addEventListener("click", () => {
  document.getElementById("genreSidebar").classList.add("open");
});

document.getElementById("closeSidebarBtn").addEventListener("click", () => {
  document.getElementById("genreSidebar").classList.remove("open");
});

document.getElementById("openSortSidebarBtn").addEventListener("click", () => {
  document.getElementById("sortSidebar").classList.add("open");
});

document.getElementById("closeSortSidebarBtn").addEventListener("click", () => {
  document.getElementById("sortSidebar").classList.remove("open");
});




function trierParGenresSimilaires() {
  let mangasFiltres = Object.values(mangaData);

  // Appliquer tous les filtres
  afficherAvecFiltres(); // ça met à jour l'affichage mais on veut récupérer les données filtrées

  // Récupérer les mangas actuellement affichés
  const cards = Array.from(document.querySelectorAll('.manga'));
  const idsAffiches = cards.map(card => card.getAttribute('data-id'));
  mangasFiltres = idsAffiches.map(id => mangaData[id]);

  // Normalise les genres
  const normalizedMangas = mangasFiltres.map(m => ({
    ...m,
    genresNorm: normalizeGenresArray(m.genres || [])
  }));

  // Grouper
  const groupes = { 'female lead': [], 'male lead': [], 'autres': [] };

  normalizedMangas.forEach(m => {
    const genres = m.genresNorm;
    if (genres.includes('female lead')) {
      groupes['female lead'].push(m);
    } else if (genres.includes('male lead')) {
      groupes['male lead'].push(m);
    } else {
      groupes['autres'].push(m);
    }
  });

  function computeWeightedSimilarityScore(manga, group) {
    return group.reduce((sum, other) => {
      if (manga === other) return sum;
      const common = manga.genresNorm.filter(g => other.genresNorm.includes(g));
      return sum + common.reduce((score, g) => score + (genreImportance[g] || 1), 0);
    }, 0);
  }

  Object.keys(groupes).forEach(groupe => {
    groupes[groupe].forEach(m => {
      m.similarityScore = computeWeightedSimilarityScore(m, groupes[groupe]);
    });
    groupes[groupe].sort((a, b) => b.similarityScore - a.similarityScore);
  });

  // Fusionner
  const resultatFinal = [];
  for (const groupe of ['female lead', 'male lead', 'autres']) {
    if (groupes[groupe].length > 0) {
      resultatFinal.push({ isTitle: true, title: `Protagoniste : ${groupe}` });
      resultatFinal.push(...groupes[groupe]);
    }
  }

  displayGroupedByStatus(resultatFinal);
}


function allerA(groupe) {
  const sections = document.querySelectorAll('.status-divider');

  for (const section of sections) {
    if (section.textContent.toLowerCase().includes(groupe.toLowerCase())) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      section.style.backgroundColor = "#fffae6";
      setTimeout(() => section.style.backgroundColor = "", 1000);
      break;
    }
  }
}

document.getElementById("jadeFilter").addEventListener("change", afficherAvecFiltres);

function convertirDescriptionsEnParagraphes(codeSource) {
  return codeSource.replace(
    /description:\s*"((?:[^"\\]|\\.)*?)"/gs,
    (_, contenu) => {
      const blocsParagraphe = contenu
        .replace(/\\n/g, '\n')
        .split('\n')
        .map(l => `<p>${l.trim()}</p>`)
        .join('');
      const safe = blocsParagraphe.replace(/`/g, '\\`');
      return `description: \`${safe}\``;
    }
  );
}




