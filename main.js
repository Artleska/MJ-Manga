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
  document.getElementById('popupDescription').innerText = manga.description;
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
  const filterValue = document.getElementById("lectureFilter")?.value;
  if (filterValue) {
    mangas = mangas.filter(m => {
      const chTotal = parseInt(m.chTotal || m.chapitresTotal || 0);
      const lusArray = (m.chLus || "")
        .replace(/[^\d.]/g, '')
        .split('.')
        .filter(x => x !== '')
        .map(Number);

      const maxLu = Math.max(...lusArray, 0);

      if (filterValue === "nonCommence") {
        return lusArray.length === 0;
      } else if (filterValue === "enCours") {
        return lusArray.length > 0 && maxLu < chTotal;
      } else if (filterValue === "termine") {
        return maxLu === chTotal && m.status?.toLowerCase() === "complet";
      }
      return true;
    });
  }

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
  const search = searchInput.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (search) {
    mangas = mangas.filter(m => {
      const title = (m.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const other = (m.otherTitles || []).join(',').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return title.includes(search) || other.includes(search);
    });
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
  if (currentSort === 'alphabetique') {
    mangas.sort((a, b) => a.title.localeCompare(b.title));
  } else if (currentSort === 'date') {
    mangas.sort((a, b) => new Date(b.date || "2000-01-01") - new Date(a.date || "2000-01-01"));
  } else if (currentSort === 'chapitresMin') {
    mangas.sort((a, b) => (parseInt(b.chTotal || 0)) - (parseInt(a.chTotal || 0)));
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
  const allMangas = Object.values(mangaData);
  
  // Normalise les genres pour chaque manga
const normalizedMangas = Object.entries(mangaData).map(([id, m]) => ({
  ...m,
  id,
  genresNorm: normalizeGenresArray(m.genres || [])
}));


  // Séparer en 3 groupes : female lead, male lead, autres
  const groupes = {
    'female lead': [],
    'male lead': [],
    'autres': []
  };

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

  // Fonction pour compter les genres communs avec tous les autres
  function computeSimilarityScore(manga, group) {
    return group.reduce((sum, other) => {
      if (manga === other) return sum;
      const common = manga.genresNorm.filter(g => other.genresNorm.includes(g)).length;
      return sum + common;
    }, 0);
  }

  // Trier chaque groupe selon le score de similarité
  Object.keys(groupes).forEach(groupe => {
    groupes[groupe].forEach(m => {
      m.similarityScore = computeSimilarityScore(m, groupes[groupe]);
    });

    groupes[groupe].sort((a, b) => b.similarityScore - a.similarityScore);
  });

  // Fusionner les groupes avec des séparateurs
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

// Swipe vers le bas pour fermer la sidebar sur mobile
function enableSwipeToClose(sidebarId) {
  const sidebar = document.getElementById(sidebarId);
  let startY = 0;

  sidebar.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  });

  sidebar.addEventListener('touchend', (e) => {
    const endY = e.changedTouches[0].clientY;
    const diffY = endY - startY;

    // Si l'utilisateur glisse vers le bas d'au moins 50px
    if (diffY > 50) {
      sidebar.classList.remove('open');
    }
  });
}

// Applique aux deux sidebars
enableSwipeToClose('genreSidebar');
enableSwipeToClose('sortSidebar');





