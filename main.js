// DOM elements
const container = document.getElementById('mangaContainer');
const searchInput = document.getElementById('searchInput');
const checkboxes = document.querySelectorAll('.sidebar-genres input[type="checkbox"]');

let currentSort = null;


function sortManga(type) {
  const buttons = document.querySelectorAll('.sort-buttons button');

  if (currentSort === type) {
    currentSort = null;
    buttons.forEach(btn => btn.classList.remove('active'));
    displayMangas(Object.values(mangaData));
    filterMangas();
    return;
  }

  currentSort = type;
  buttons.forEach(btn => btn.classList.remove('active'));
  const activeBtn = [...buttons].find(btn => btn.getAttribute('onclick')?.includes(type));
  if (activeBtn) activeBtn.classList.add('active');

  let filteredMangas = Object.values(mangaData);
  filteredMangas.forEach(m => {
    m.chTotal = m.chTotal || m.chapitresTotal || 0;
  });

  const selectedGenres = Array.from(document.querySelectorAll("#genreSidebar input[type='checkbox']:checked"))
    .map(cb => cb.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

  if (type === 'alphabetique') {
    filteredMangas.sort((a, b) => a.title.localeCompare(b.title));
  } else if (type === 'date') {
    filteredMangas.sort((a, b) => new Date(b.date || "2000-01-01") - new Date(a.date || "2000-01-01"));
  } else if (type === 'genres') {
    let baseGenres = [];

    if (selectedGenres.length > 0) {
      baseGenres = selectedGenres.map(g => {
  const genre = g.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  return (genre === 'female lead' || genre === 'male lead') ? 'leadtype' : genre;
});

    } else {
      const base = filteredMangas.find(m => m.genres && (Array.isArray(m.genres) ? m.genres.length > 0 : m.genres.trim() !== ''));
      if (base) {
        baseGenres = Array.isArray(base.genres)
          ? base.genres.map(g => g.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim())
          : base.genres.split(',').map(g => g.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
      }
    }

      if (baseGenres.length === 0) {
    displayMangas(filteredMangas);
    filterMangas();
    return;
  }

   const femaleLeadGroup = [];
const maleLeadGroup = [];
const otherGroup = [];

filteredMangas.forEach(m => {
  const genres = normalizeGenresArray(m.genres);
  if (genres.includes("female lead")) {
    femaleLeadGroup.push(m);
  } else if (genres.includes("male lead")) {
    maleLeadGroup.push(m);
  } else {
    otherGroup.push(m);
  }
});

// Tri de chaque groupe par similarité
femaleLeadGroup.sort((a, b) => {
  const commonA = countCommonGenres(a.genres, baseGenres);
  const commonB = countCommonGenres(b.genres, baseGenres);
  return commonB - commonA;
});

maleLeadGroup.sort((a, b) => {
  const commonA = countCommonGenres(a.genres, baseGenres);
  const commonB = countCommonGenres(b.genres, baseGenres);
  return commonB - commonA;
});

otherGroup.sort((a, b) => {
  const commonA = countCommonGenres(a.genres, baseGenres);
  const commonB = countCommonGenres(b.genres, baseGenres);
  return commonB - commonA;
});

// Fusionner les 3 groupes
filteredMangas = [...femaleLeadGroup, ...maleLeadGroup, ...otherGroup];

  } else if (type === 'chapitresMin') {
    const min = parseInt(document.getElementById("minChapitresInput").value) || 0;
    filteredMangas = filteredMangas.filter(m => m.chTotal >= min);
    filteredMangas.sort((a, b) => b.chTotal - a.chTotal);
  }

  displayMangas(filteredMangas);
  filterMangas(); // toujours appliquer les filtres visuels
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
    filterMangas();
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

function displayGroupedByStatus(items) {
  container.innerHTML = '';
  items.forEach(item => {
    if (item.isTitle) {
      const titleElem = document.createElement('div');
      titleElem.textContent = `— ${capitalizeFirstLetter(item.title)} —`;
      titleElem.style.fontWeight = 'bold';
      titleElem.style.fontSize = '1.2em';
      titleElem.style.margin = '20px 0 10px';
      titleElem.style.textAlign = 'center';
      container.appendChild(titleElem);
    } else {
      const id = Object.keys(mangaData).find(key => mangaData[key] === item);
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
    <div class="col-4"><strong>Dernière lecture:</strong> ${manga.dernierLecture || '—'}</div>
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

function filterMangas() {
  const search = searchInput.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const selectedGenres = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

  document.querySelectorAll('.manga').forEach(card => {
    const title = card.getAttribute('data-title').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const genresStr = card.getAttribute('data-genres') || "";
    const genres = genresStr
      .split(',')
      .map(g => g.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      .filter(g => g.length > 0);

    const otherTitles = (card.getAttribute('data-othertitles') || "")
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const matchesTitle = title.includes(search) || otherTitles.includes(search);
    const matchesGenres = selectedGenres.every(g => genres.includes(g));

    card.style.display = matchesTitle && matchesGenres ? 'block' : 'none';
  });
}

function resetFilters() {
  searchInput.value = '';
  checkboxes.forEach(cb => cb.checked = false);

  const minChapitresInput = document.getElementById("minChapitresInput");
  if (minChapitresInput) minChapitresInput.value = '';

  displayMangas(Object.values(mangaData));
  filterMangas(); // ✅ Ajout important pour appliquer les filtres
}


document.getElementById("openSidebarBtn").addEventListener("click", () => {
  document.getElementById("genreSidebar").classList.add("open");
});

document.getElementById("closeSidebarBtn").addEventListener("click", () => {
  document.getElementById("genreSidebar").classList.remove("open");
});

window.addEventListener("click", (e) => {
  const sidebar = document.getElementById("genreSidebar");
  if (!sidebar.contains(e.target) && e.target.id !== "openSidebarBtn") {
    sidebar.classList.remove("open");
  }
});

document.getElementById("openSortSidebarBtn").addEventListener("click", () => {
  document.getElementById("sortSidebar").classList.add("open");
});

document.getElementById("closeSortSidebarBtn").addEventListener("click", () => {
  document.getElementById("sortSidebar").classList.remove("open");
});

window.addEventListener("click", (e) => {
  const sortSidebar = document.getElementById("sortSidebar");
  if (!sortSidebar.contains(e.target) && e.target.id !== "openSortSidebarBtn") {
    sortSidebar.classList.remove("open");
  }
});

searchInput.addEventListener('input', filterMangas);
checkboxes.forEach(cb => cb.addEventListener('change', filterMangas));

document.addEventListener("DOMContentLoaded", () => {
  displayMangas(Object.values(mangaData));
  filterMangas();
});

document.querySelector('.dropdown-toggle').addEventListener('click', (e) => {
  e.stopPropagation();
  document.querySelector('.sort-dropdown').classList.toggle('open');
});

window.addEventListener('click', () => {
  document.querySelector('.sort-dropdown').classList.remove('open');
});





