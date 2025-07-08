let mangaData = {};

async function chargerMangas() {
  try {
    const snapshot = await firestore.collection("mangas").get();
    snapshot.forEach(doc => {
      mangaData[doc.id] = doc.data();
    });

    afficherAvecFiltres(); // Affiche les mangas une fois chargés
  } catch (error) {
    console.error("Erreur lors du chargement des mangas depuis Firestore :", error);
  }
}


document.addEventListener("DOMContentLoaded", () => {
  chargerMangas();

  // Bouton "Genres similaires"
  const btnSimilaires = document.getElementById("btnGenresSimilaires");
  if (btnSimilaires) {
    btnSimilaires.addEventListener("click", () => {
      setSort("genres");
    });
  }
});



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
  "arts-martiaux": [5, 9],
  "aventure": 1,
  "badass": 5,
  "beast world": [5, 7],
  "business": 3,
  "caretaker": 3,
  "child lead": [5, 2],
  "comédie": 1,
  "cooking": 5,
  "crossdressing": 2,
  "cultivation": 4,
  "drame": 2,
  "disciple": 2,
  "dungeon":[5, 10],
  "enfant": 3,
  "fantasy": [5, 7],
  "father": 4,
  "female lead": 1,
  "food": 3,
  "jeux vidéo": 3,
  "ghosts": 2,
  "harem": 2,
  "historical": [5, 5],
  "horreur": 3,
  "isekai": 3,
  "idol": 4,
  "long life": 2,
  "magie": 2,
  "male lead": 1,
  "manga": [5, 1],
  "mature": 2,
  "mécanique": 2,
  "médicale": [5, 11],
  "militaire": 2,
  "moderne": [5, 4],
  "monstre": 1,
  "mother": 3,
  "murim": 4,
  "multi world": [5, 6],
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
  "sick": [5, 2],
  "sport": 1,
  "suicide":1,
  "superhero": 1,
  "surnaturel": 2,
  "system": [5, 12],
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

  document.querySelectorAll('.sort-buttons button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase().includes(type)) {
      btn.classList.add('active');
    }
  });

  if (type === 'genres') {
    trierParGenresSimilaires();
  } else if (type === 'alphabetique') {
    trierParAZAvecSections();
  } else {
    // Supprime la barre alphabétique si présente
    const nav = document.getElementById("alphabetNav");
    if (nav) nav.remove();
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
  line.setAttribute('data-letter', item.title);      // ajoute la lettre
  line.setAttribute('data-count', item.count || 0);  // ajoute le nombre

  const mainTitle = document.createElement('div');
  mainTitle.textContent = capitalizeFirstLetter(item.title);
  mainTitle.className = 'divider-title';

  const count = document.createElement('div');
  count.textContent = `${item.count || 0} manga${item.count > 1 ? 's' : ''}`;
  count.className = 'divider-count';

  line.appendChild(mainTitle);
  line.appendChild(count);
  container.appendChild(line);
}

 else {
const id = Object.keys(mangaData).find(key => mangaData[key] === item);
if (!id) return;

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
  document.getElementById('popupDescription').innerHTML = manga.description || '';
const popupGenres = document.getElementById('popupGenres');
popupGenres.innerHTML = '';
(manga.genres || []).forEach(genre => {
  const span = document.createElement('span');
  span.className = 'genre-tag';
  span.textContent = genre.trim();
  popupGenres.appendChild(span);
});
  document.getElementById('popupOtherTitles').innerText = manga.otherTitles?.join(', ') || "Aucun";
  document.getElementById('popupPageValue').textContent = manga.page || 'N/A';


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

if (
  !Array.isArray(manga.similaires) ||
  manga.similaires.length === 0 ||
  manga.similaires.every(val => typeof val !== 'string' || val.trim() === "")
) {
  const autoSimilaires = trouverMangasSimilairesAuto(manga);
  manga.similaires = autoSimilaires;
  mangaData[id].similaires = autoSimilaires;
}


const user = firebase.auth().currentUser;
const email = user?.email;

const adminEmails = [
  "megane.lavoie24@gmail.com",
  "adresse.de.lautre.jadelavoie51@gmail.com"
];

const boutonAdmin = document.getElementById("boutonsAdmin");

if (user && adminEmails.includes(email)) {
  boutonAdmin.innerHTML = `
    <button onclick="activerEditionManga('${id}')">✏️ Modifier</button>
  `;
} else {
  boutonAdmin.innerHTML = "";
}




// À la fin de openPopup
document.getElementById('popup').style.display = 'flex';
afficherCartesSimilaires(manga);  


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
  // 1. Réinitialiser la recherche
  searchInput.value = '';

  // 2. Décoche tous les genres
  checkboxes.forEach(cb => cb.checked = false);

  // 3. Réinitialise les filtres de lecture et jade
  const lectureFilter = document.getElementById("lectureFilter");
  if (lectureFilter) lectureFilter.value = 'tous';

  const jadeFilter = document.getElementById("jadeFilter");
  if (jadeFilter) jadeFilter.value = 'tous';

  // 4. Vide le champ de chapitres minimum
  const minChapitresInput = document.getElementById("minChapitresInput");
  if (minChapitresInput) minChapitresInput.value = '';

  // 5. Supprime le tri actif
  currentSort = null;
  document.querySelectorAll('.sort-buttons button').forEach(btn => btn.classList.remove('active'));

  // 6. Supprime la barre alphabétique si elle existe
  const nav = document.getElementById("alphabetNav");
  if (nav) nav.remove();

  // 7. Réaffiche tout
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
  }else if (!search) {
    // Mélange aléatoire si aucun tri activé
    mangas.sort(() => Math.random() - 0.5);
  }


  // 6. Affichage final
  displayMangas(mangas);

}

document.querySelector('.dropdown-toggle').addEventListener('click', (e) => {
  e.stopPropagation();
  document.querySelector('.sort-dropdown').classList.toggle('open');
});

window.addEventListener('click', () => {
  document.querySelector('.sort-dropdown').classList.remove('open');
});

document.querySelector('.sort-dropdown').addEventListener('click', (e) => {
  e.stopPropagation();
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


function trierParSimilariteLocale(mangas) {
  return mangas
    .map(manga => {
      const score = mangas.reduce((acc, other) => {
        if (manga === other) return acc;
        return acc + calculerSimilariteGenres(manga, other);
      }, 0);
      return { manga, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(obj => obj.manga);
}


function trierParGenresSimilaires() {
  const regroupes = {
    female: [],
    male: [],
    autres: []
  };

  const mangasFiltres = Object.values(mangaData).filter(manga => {
    const genres = normalizeGenresArray(manga.genres || []);
    return !genres.includes("doujinshi");
  });

  // Séparation par type de protagoniste
  mangasFiltres.forEach(manga => {
    const genres = normalizeGenresArray(manga.genres || []);
    if (genres.includes("female lead")) {
      regroupes.female.push(manga);
    } else if (genres.includes("male lead")) {
      regroupes.male.push(manga);
    } else {
      regroupes.autres.push(manga);
    }
  });

  const resultat = [];
  const genreCounts = calculerGenresPopulaires(mangaData, 5);

  Object.entries(regroupes).forEach(([type, liste]) => {
  if (liste.length === 0) return;

  const titreType = type === "female" ? "Protagoniste féminine"
                  : type === "male" ? "Protagoniste masculine"
                  : "Autres";

  const titre = document.createElement('h2');
  titre.className = 'section-title mt-5 mb-3 border-bottom pb-2';
  titre.textContent = titreType;

  // ✅ Ajout de l'id pour permettre le scroll via le menu déroulant
  titre.id = `section-${type}`;

    resultat.push({ isTitle: true, title: titreType });

    const groupesParGenre = {};
    const autres = [];

    // Étape 1 — Déterminer le genre dominant
    liste.forEach(manga => {
      const genres = normalizeGenresArray(manga.genres || []);
      let genreDominant = null;
      let poidsMax = 0;

      const candidats = genres.filter(g => {
        const val = genreImportance[g];
        const poids = Array.isArray(val) ? val[0] : val || 1;
        return poids >= 5;
      });

      if (candidats.length > 0) {
        genreDominant = candidats.sort((a, b) => {
          const [poidsA, prioA = 99] = Array.isArray(genreImportance[a]) ? genreImportance[a] : [genreImportance[a] || 1, 99];
          const [poidsB, prioB = 99] = Array.isArray(genreImportance[b]) ? genreImportance[b] : [genreImportance[b] || 1, 99];
          return poidsB - poidsA || prioA - prioB;
        })[0];

        const dominantVal = genreImportance[genreDominant];
        poidsMax = Array.isArray(dominantVal) ? dominantVal[0] : dominantVal || 1;
      }

      if (poidsMax >= 5 && genreDominant) {
        if (!groupesParGenre[genreDominant]) groupesParGenre[genreDominant] = [];
        groupesParGenre[genreDominant].push(manga);
      } else {
        autres.push(manga);
      }
    });

    // Étape 2 — Ajouter les mangas sans genre dominant dans les groupes
    autres.forEach(manga => {
      const genres = normalizeGenresArray(manga.genres || []);
      let placé = false;

      for (const genre of genres) {
        if (groupesParGenre[genre]) {
          groupesParGenre[genre].push(manga);
          placé = true;
          break;
        }
      }

      // Si aucun groupe ne correspond, on peut choisir d’ignorer ou de les ajouter à un groupe par défaut
      if (!placé) {
        // Optionnel : on peut les mettre dans le groupe le plus populaire
        const [genrePlusPopulaire] = Object.entries(groupesParGenre).sort((a, b) => b[1].length - a[1].length)[0] || [];
        if (genrePlusPopulaire) {
          groupesParGenre[genrePlusPopulaire].push(manga);
        }
      }
    });

    // Étape 3 — Afficher les groupes triés
    Object.entries(groupesParGenre)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([genre, mangas]) => {
        const similaires = trierParSimilariteLocale(mangas);
        resultat.push(...similaires);
      });
  });

  displayGroupedByStatus(resultat);
}

function displayGroupedByLetter(items) {
  const container = document.getElementById('mangaContainer');

  container.innerHTML = '';

  items.forEach(item => {
    if (item.isTitle) {
      const line = document.createElement('div');
      line.className = 'status-divider';
      line.setAttribute('data-letter', item.title);      // ← utile pour scrollToLetter
      line.setAttribute('data-count', item.count || 0);

      const mainTitle = document.createElement('div');
      mainTitle.textContent = item.title;
      mainTitle.className = 'divider-title';

      const count = document.createElement('div');
      count.textContent = `${item.count || 0} manga${item.count > 1 ? 's' : ''}`;
      count.className = 'divider-count';

      line.appendChild(mainTitle);
      line.appendChild(count);
      container.appendChild(line);
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


function trierParAZAvecSections() {
  afficherAvecFiltres();
  const cards = Array.from(document.querySelectorAll('.manga'));
  const idsAffiches = cards.map(card => card.getAttribute('data-id'));
  let mangas = idsAffiches.map(id => mangaData[id]);


  // Appliquer tous les filtres existants
  const lectureVal = document.getElementById("lectureFilter")?.value || "tous";
  const jadeVal = document.getElementById("jadeFilter")?.value || "tous";
  const selectedGenres = Array.from(document.querySelectorAll("#genreSidebar input[type='checkbox']:checked"))
    .map(cb => cb.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  const search = searchInput.value.trim();
  const minInput = document.getElementById("minChapitresInput");
  const minCh = parseInt(minInput?.value) || 0;

  // Filtres combinés
  mangas = mangas.filter(m => {
    const chTotal = parseInt(m.chTotal || 0);
    const lusArray = (m.chLus || "").replace(/[^\d.]/g, '').split('.').filter(x => x !== '').map(Number);
    const jade = parseInt(m.chJade) || 0;
    const maxLu = Math.max(...lusArray, 0);
    const status = (m.status || "").toLowerCase();

    let lectureOK = true, jadeOK = true;
    if (lectureVal === "nonCommence") lectureOK = lusArray.length === 0;
    else if (lectureVal === "enCours") lectureOK = lusArray.length > 0 && maxLu < chTotal;
    else if (lectureVal === "termine") lectureOK = maxLu === chTotal && (status === "complet" || status === "abandonné");

    if (jadeVal === "nonCommence") jadeOK = jade === 0;
    else if (jadeVal === "enCours") jadeOK = jade > 0 && jade < chTotal;
    else if (jadeVal === "termine") jadeOK = jade === chTotal && (status === "complet" || status === "abandonné");

    if (lectureVal !== "tous" && !lectureOK) return false;
    if (jadeVal !== "tous" && !jadeOK) return false;

    if (selectedGenres.length > 0) {
      const genres = normalizeGenresArray(m.genres);
      if (!selectedGenres.every(g => genres.includes(g))) return false;
    }

    if (search) {
      const haystack = [m.title, ...(m.otherTitles || [])].join(' ').toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }

    if (minCh > 0 && chTotal < minCh) return false;

    return true;
  });

  // Tri alphabétique
  mangas.sort((a, b) => a.title.localeCompare(b.title));

  // Grouper par lettre
  const grouped = {};
  mangas.forEach(m => {
    const firstLetter = (m.title || "?").charAt(0).toUpperCase();
    if (!grouped[firstLetter]) grouped[firstLetter] = [];
    grouped[firstLetter].push(m);
  });

  // Fusionner en tableau final
  const resultat = [];
  Object.keys(grouped).sort().forEach(letter => {
    resultat.push({ isTitle: true, title: letter, count: grouped[letter].length });
    resultat.push(...grouped[letter]);
  });
displayGroupedByLetter(resultat);
  // Mise à jour des boutons A-Z après affichage
const btnContainer = document.getElementById("letterButtonsContainer");
btnContainer.innerHTML = ''; // Vider l'ancien contenu

const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
lettres.forEach(lettre => {
  const section = document.querySelector(`.status-divider[data-letter="${lettre}"]`);
  const count = section ? parseInt(section.dataset.count || 0) : 0;

  const btn = document.createElement("button");
  btn.innerHTML = `
    <span class="lettre">${lettre}</span>
    <span class="count">${count > 0 ? count : ''}</span>
  `;
  btn.onclick = () => scrollToLetter(lettre);
  btnContainer.appendChild(btn);
});
  
}

function allerA(value) {
  let cible = null;

  if (value === 'protagoniste : female lead') {
    cible = document.getElementById('section-female');
  } else if (value === 'protagoniste : male lead') {
    cible = document.getElementById('section-male');
  } else if (value === 'protagoniste : autres') {
    cible = document.getElementById('section-autres');
  }

  if (cible) {
    cible.scrollIntoView({ behavior: 'smooth', block: 'start' });
    cible.style.backgroundColor = "#fffae6";
    setTimeout(() => cible.style.backgroundColor = "", 1000);
  }
}



document.getElementById("jadeFilter").addEventListener("change", afficherAvecFiltres);

function toggleLetterDropdown() {
  const dropdown = document.getElementById("letterDropdownContent");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function filtrerLettres(lettre) {
  const buttons = document.querySelectorAll('#letterButtonsContainer button');
  const lettreRecherche = lettre.trim().toUpperCase();

  buttons.forEach(btn => {
    if (!lettreRecherche || btn.textContent.includes(lettreRecherche)) {
      btn.style.display = 'inline-block';
    } else {
      btn.style.display = 'none';
    }
  });
}

function scrollToLetter(lettre) {
  const section = document.querySelector(`.status-divider[data-letter="${lettre}"]`);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section.style.backgroundColor = "#fffae6";
    setTimeout(() => section.style.backgroundColor = "", 1000);
  }

  // Ferme le dropdown
  const dropdown = document.getElementById("letterDropdownContent");
  if (dropdown) dropdown.style.display = "none";
}

// Ouvre / ferme le menu des lettres
function toggleLetterDropdown() {
  const dropdown = document.getElementById("letterDropdownContent");
  dropdown.classList.toggle("show");
}

// Ouvre / ferme le menu des statuts
function toggleStatusDropdown() {
  const statusMenu = document.querySelector(".sort-dropdown .dropdown-menu");
  statusMenu.classList.toggle("show");
}

// Fermer les dropdowns quand on clique en dehors
document.addEventListener("click", function (event) {
  const letterBtn = document.querySelector(".letter-dropdown .dropdown-toggle");
  const letterContent = document.getElementById("letterDropdownContent");
  const statusBtn = document.querySelector(".sort-dropdown .dropdown-toggle");
  const statusMenu = document.querySelector(".sort-dropdown .dropdown-menu");

  if (!letterBtn.contains(event.target) && !letterContent.contains(event.target)) {
    letterContent.classList.remove("show");
  }

  if (!statusBtn.contains(event.target) && !statusMenu.contains(event.target)) {
    statusMenu.classList.remove("show");
  }
});

function afficherCartesSimilaires(manga) {
  const container = document.getElementById('popupSimilairesContainer');
  container.innerHTML = '';

  const similairesManuels = (manga.similaires || []).filter(id => mangaData[id]);
  const similairesUniques = new Set();
  const cartesAAfficher = [];

  // Ajouter les similaires définis manuellement
  similairesManuels.forEach(id => {
    const similaire = mangaData[id];
    if (!similaire || similaire.protagoniste !== manga.protagoniste || similairesUniques.has(id)) return;

    const card = document.createElement('div');
    card.className = 'similaire-card';
    card.setAttribute('data-id', id);

    const imageSrc = similaire.image?.trim() || 'image/fond.jpg';

    card.innerHTML = `
      <img src="${imageSrc}" alt="${similaire.title}" />
      <p>${similaire.title}</p>
    `;

    card.addEventListener('click', () => openPopup(id));
    container.appendChild(card);
    cartesAAfficher.push(id);
    similairesUniques.add(id);
  });

  // Compléter automatiquement si moins de 6
  if (cartesAAfficher.length < 6) {
    const similairesAuto = trouverMangasSimilairesAuto(manga);

    for (let id of similairesAuto) {
      if (cartesAAfficher.length >= 6) break;
      if (similairesUniques.has(id)) continue;

      const similaire = mangaData[id];
      if (!similaire || similaire.protagoniste !== manga.protagoniste) continue;

      const card = document.createElement('div');
      card.className = 'similaire-card';
      card.setAttribute('data-id', id);

      const imageSrc = similaire.image?.trim() || 'image/fond.jpg';

      card.innerHTML = `
        <img src="${imageSrc}" alt="${similaire.title}" />
        <p>${similaire.title}</p>
      `;

      card.addEventListener('click', () => openPopup(id));
      container.appendChild(card);
      cartesAAfficher.push(id);
      similairesUniques.add(id);
    }
  }

  // Si encore vide, message
  if (cartesAAfficher.length === 0) {
    container.innerHTML = '<p>Aucun manga similaire trouvé.</p>';
  }
}




function trouverMangasSimilairesAuto(manga) {
  const scores = [];

  const typeProtagoniste = manga.genres.includes("female lead") ? "female lead" :
                           manga.genres.includes("male lead") ? "male lead" : "autre";

  const genrePrincipal = getGenreDominant(manga);

  for (const id in mangaData) {
    if (id === manga.id) continue;

    const autre = mangaData[id];
    if (!autre.genres || autre.genres.length === 0) continue;

    // Vérifie type de protagoniste
    const autreType = autre.genres.includes("female lead") ? "female lead" :
                      autre.genres.includes("male lead") ? "male lead" : "autre";
    if (autreType !== typeProtagoniste) continue;

    // Calcule score de similarité
    let score = 0;
    let genreCommun = false;
    for (const genre of manga.genres) {
      if (autre.genres.includes(genre)) {
        const importance = genreImportance[genre];
        if (typeof importance === 'number') {
          score += importance;
        } else if (Array.isArray(importance)) {
          score += importance[0]; // pondération
        } else {
          score += 1;
        }

        if (genre === genrePrincipal) {
          genreCommun = true; // genre dominant en commun
        }
      }
    }

    // Bonus si même genre dominant
    if (getGenreDominant(autre) === genrePrincipal) {
      score += 5;
    }

    if (score > 0) {
      scores.push({ id, score, genreCommun });
    }
  }

  // Trie par score DESC puis genre dominant commun
  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.genreCommun && !a.genreCommun) return 1;
    if (!b.genreCommun && a.genreCommun) return -1;
    return 0;
  });

  return scores.slice(0, 6).map(obj => obj.id);
}




function calculerGenresPopulaires(mangaData, seuil = 5) {
  const genreCounts = {};

  Object.values(mangaData).forEach(manga => {
    const genres = normalizeGenresArray(manga.genres || []);
    genres.forEach(g => {
      if ((genreImportance[g] || 1) >= seuil) {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
    });
  });

  return genreCounts;
}

function calculerSimilariteGenres(m1, m2) {
  const genres1 = normalizeGenresArray(m1.genres || []);
  const genres2 = normalizeGenresArray(m2.genres || []);
  let score = 0;

  genres1.forEach(g => {
    if (genres2.includes(g)) {
      score += genreImportance[g] || 1;
    }
  });

  return score;
}

function getGenreDominant(manga) {
  if (!manga.genres || manga.genres.length === 0) return null;

  let maxPoids = -Infinity;
  let meilleurGenre = null;
  let meilleurePriorite = Infinity;

  for (const genre of manga.genres) {
    const valeur = genreImportance[genre];
    if (!valeur) continue;

    let poids = 0;
    let priorite = 999;

    if (typeof valeur === "number") {
      poids = valeur;
      priorite = 999;
    } else if (Array.isArray(valeur)) {
      [poids, priorite] = valeur;
    }

    if (poids > maxPoids || (poids === maxPoids && priorite < meilleurePriorite)) {
      maxPoids = poids;
      meilleurePriorite = priorite;
      meilleurGenre = genre;
    }
  }

  return maxPoids >= 5 ? meilleurGenre : null;
}

chargerMangas();

document.addEventListener("DOMContentLoaded", () => {
  chargerMangas();

  // Lier le bouton "Genres similaires"
  const btnSimilaires = document.getElementById("btnGenresSimilaires");
  if (btnSimilaires) {
    btnSimilaires.addEventListener("click", () => {
      setSort("genres");
    });
  }
});













