function chargerMangasDepuisFirestore() {
  db.collection("mangas").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(change => {
      const id = change.doc.id;
      if (change.type === "added" || change.type === "modified") {
        mangaData[id] = change.doc.data();
      } else if (change.type === "removed") {
        delete mangaData[id];
      }
    });

    afficherAvecFiltres(); // rafraîchit l'affichage à chaque changement
  }, (error) => {
    console.error("Erreur lors du chargement des mangas :", error);
  });
}



// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB8kcRDh17HoysCnUT9rzDR9IDkhfEENR4",
  authDomain: "site-manga-da5cc.firebaseapp.com",
  projectId: "site-manga-da5cc",
  storageBucket: "site-manga-da5cc.appspot.com",
  messagingSenderId: "546213461662",
  appId: "1:546213461662:web:f1a7d06ef2dc930d38458f"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Emails autorisés
const utilisateursAutorises = [
  "megane.lavoie24@gmail.com",
  "jadelavoie51@gmail.com"
];

// Connexion
function seConnecter() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      const email = result.user.email.toLowerCase();
      if (!utilisateursAutorises.includes(email)) {
        alert("Accès refusé : utilisateur non autorisé.");
        firebase.auth().signOut();
      }
    })
    .catch(error => {
      console.error("Erreur connexion :", error);
      alert("Erreur lors de la connexion.");
    });
}

// Déconnexion
function seDeconnecter() {
  firebase.auth().signOut()
    .then(() => {
      afficherEtatConnexion(null);
    })
    .catch(error => {
      console.error("Erreur déconnexion :", error);
      alert("Erreur lors de la déconnexion.");
    });
}

function afficherEtatConnexion(user) {
  const userEmailEl = document.getElementById("userEmail");
  const loginBtn = document.getElementById("btnLogin");
  const logoutBtn = document.getElementById("btnLogout");

  if (user && utilisateursAutorises.includes(user.email)) {
    // Affichage personnalisé selon l'utilisateur
    if (user.email === "megane.lavoie24@gmail.com") {
      userEmailEl.textContent = "Connectée en tant que Megane";
    } else if (user.email === "jadelavoie51@gmail.com") {
      userEmailEl.textContent = "Connectée en tant que Jade";
    } else {
      userEmailEl.textContent = "Connecté";
    }

    userEmailEl.style.display = "inline";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    userEmailEl.textContent = "";
    userEmailEl.style.display = "none";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
}

auth.onAuthStateChanged(user => {
  afficherEtatConnexion(user);
});



// Transformer textarea liens externes en objet
function parseLiensExternes(input) {
  const result = {};
  const lignes = input.split('\n');

  for (const ligne of lignes) {
    const [nom, ...rest] = ligne.split(':');
    if (!nom || rest.length === 0) continue;

    const urlBrute = rest.join(':').trim(); // Pour gérer les cas où l'URL contient des ":"
    let url = urlBrute;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const testUrl = new URL(url);
      result[nom.trim()] = testUrl.href;
    } catch (e) {
      console.warn("❌ Lien invalide ignoré :", ligne);
    }
  }

  return result;
}





// Soumission du formulaire d'ajout
document.getElementById("formAjout").addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailConnecte = auth.currentUser?.email;
  if (!utilisateursAutorises.includes(emailConnecte)) {
    alert("Vous n'avez pas l'autorisation.");
    return;
  }

  // Récupération des champs
  const mangaId = document.getElementById("mangaId").value.trim();
  const title = document.getElementById("title").value.trim();
  const otherTitles = document.getElementById("otherTitles").value.split("/").map(t => t.trim()).filter(t => t);
  const image = document.getElementById("image").value.trim();
  const description = document.getElementById("description").value.trim();
  const genres = document.getElementById("genres").value.split(",").map(g => g.trim().toLowerCase()).filter(g => g);
  const status = document.getElementById("status").value.trim();
  const chTotal = parseInt(document.getElementById("chTotal").value) || 0;
  const chLus = document.getElementById("chLus").value.trim();
  const chJade = parseInt(document.getElementById("chJade").value) || 0;
  const date = document.getElementById("date").value.trim();
  const dernierLecture = document.getElementById("dernierLecture").value.trim();
  const page = document.getElementById("page").value.trim();
  const similaires = document.getElementById("similaires").value.split(",").map(s => s.trim()).filter(s => s);
  const noms = document.querySelectorAll(".external-link-name");
const urls = document.querySelectorAll(".external-link-url");
const externalLinks = {};

for (let i = 0; i < noms.length; i++) {
  const nom = noms[i].value.trim();
  const url = urls[i].value.trim();
  if (nom && url) {
    externalLinks[nom] = url;
  }
}


  const id = mangaId !== "" ? mangaId : title.replace(/\s+/g, '').replace(/[^\w]/g, '');

  const data = {
    title,
    otherTitles,
    image,
    description,
    genres,
    status,
    chTotal,
    chLus,
    chJade,
    date,
    dernierLecture,
    page,
    similaires,
    externalLinks
  };

  try {
await db.collection("mangas").doc(id).set(data);
alert("✅ Manga ajouté !");
document.getElementById("formAjout").reset();

mangaData[id] = data;        // ajoute localement
afficherAvecFiltres();       // rafraîchit l'affichage


} catch (err) {
  console.error("Erreur Firebase :", err);
  alert("❌ Erreur lors de l'ajout !");
}

});

function activerEditionManga(id) {
  const manga = mangaData[id];
  if (!manga) return;

  // Title editable
  document.getElementById('popupTitle').innerHTML = `
    <label for="edit-title"><strong>Titre :</strong></label>
    <input type="text" id="edit-title" value="${manga.title}">
  `;

  // Description editable
  document.getElementById('popupDescription').innerHTML = `
    <label for="edit-description"><strong>Description :</strong></label>
    <textarea id="edit-description" rows="4">${manga.description || ''}</textarea>
  `;

  // Genres avec tags cliquables
  const genresPossibles = [
    
  "abu","academy","acting","action","adopted","androgine","animals","apocalypse","art","arts-martiaux","aventure",
  "badass","beast world","business","caretaker","child lead","comédie","cooking","crossdressing","cultivation","drame",
  "disciple","dungeon","enfant","fantasy","father","female lead","food","jeux vidéo","ghosts","harem","historical","horreur",
  "isekai","idol","long life","magie","male lead","manga","mature","mécanique","médicale","militaire","moderne","monstre",
  "mother","murim","multi world","multi life", "musique","mystère","novel","omegaverse","power","prof","psychologique","réincarnation",
  "return","revenge","rich","romance","saint","school life","seconde chance","secret identity","sick","sport","suicide",
  "superhero","surnaturel","system","time travel","tower","tyrant","transmigration","transformation","vampire",
  "villainess","yaoi"];
  
  // Conteneur des tags genre
  let genresHtml = `<label><strong>Genres :</strong></label><div id="genresTagsContainer" style="margin-bottom:10px;">`;
  genresPossibles.forEach(genre => {
    const actif = (manga.genres || []).includes(genre);
    genresHtml += `<span class="genre-tag ${actif ? 'active' : ''}" data-genre="${genre}">${genre}</span>`;
  });
  genresHtml += `</div>`;

  // Liste texte des genres sélectionnés
  const selectedGenres = (manga.genres || []).join(', ');
  genresHtml += `
    <label><strong>Genres sélectionnés :</strong></label>
    <div id="selectedGenresText" style="margin-bottom:15px; font-style: italic;">${selectedGenres || 'Aucun'}</div>
  `;

  document.getElementById('popupGenres').innerHTML = genresHtml;

  // Ajout du gestionnaire de clic sur les tags genre (à faire après l'insertion dans le DOM)
  document.querySelectorAll('#genresTagsContainer .genre-tag').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('active');

      // Mise à jour de la liste sélectionnée
      const actifs = Array.from(document.querySelectorAll('#genresTagsContainer .genre-tag.active'))
        .map(span => span.getAttribute('data-genre'));

      const selectedTextEl = document.getElementById('selectedGenresText');
      if (actifs.length === 0) {
        selectedTextEl.textContent = 'Aucun';
      } else {
        selectedTextEl.textContent = actifs.join(', ');
      }
    });
  });


  // Status select
  const statusPossibles = ["En cours", "Complet", "Abandonné", "Pause"];
  const statusSelectHtml = `
    <label for="edit-status"><strong>Status :</strong></label>
    <select id="edit-status" style="width: 100%;">
      <option value="">-- Choisir un statut --</option>
      ${statusPossibles.map(stat => `
        <option value="${stat}" ${manga.status === stat ? 'selected' : ''}>${stat}</option>
      `).join('')}
    </select>
  `;

  // Date et dernierLecture + status
  document.getElementById('popupDateStatus').innerHTML = `
    ${statusSelectHtml}
    <label for="edit-date" style="margin-top: 8px; display: block;"><strong>Date :</strong></label>
    <input type="text" id="edit-date" value="${manga.date || ''}" placeholder="Date" style="width: 100%; margin-bottom: 8px;">

    <label for="edit-dernierLecture" style="display: block;"><strong>Dernière lecture :</strong></label>
    <input type="text" id="edit-dernierLecture" value="${manga.dernierLecture || ''}" placeholder="Dernière lecture" style="width: 100%;">
  `;

  // Chapitres
  document.getElementById('popupChContainer').innerHTML = `
    <label for="edit-chTotal"><strong>Chapitres total :</strong></label>
    <input type="number" id="edit-chTotal" value="${manga.chTotal || 0}" placeholder="Chapitres total" min="0">

    <label for="edit-chLus" style="margin-top: 8px;"><strong>Chapitres lus :</strong></label>
    <input type="text" id="edit-chLus" value="${manga.chLus || ''}" placeholder="Chapitres lus">

    <label for="edit-chJade" style="margin-top: 8px;"><strong>Ch (Jade) :</strong></label>
    <input type="number" id="edit-chJade" value="${manga.chJade || 0}" placeholder="Ch (Jade)" min="0">
  `;

  // Autres titres
  document.getElementById('popupOtherTitles').innerHTML = `
    <label for="edit-otherTitles"><strong>Autres titres (séparés par /) :</strong></label>
    <input type="text" id="edit-otherTitles" value="${(manga.otherTitles || []).join(' / ')}">
  `;

  // Page
  document.getElementById('popupPageValue').innerHTML = `
    <label for="edit-page"><strong>Page :</strong></label>
    <input type="text" id="edit-page" value="${manga.page || ''}">
  `;

  // Liens externes
  const liens = Object.entries(manga.externalLinks || {}).map(([nom, url]) => `${nom}:${url}`).join('\n');
  document.getElementById('popupExternalLinks').innerHTML = `
    <label for="edit-externalLinks"><strong>Liens externes (format nom:url par ligne) :</strong></label>
    <textarea id="edit-externalLinks" rows="3">${liens}</textarea>
  `;

  // Similaires
  const similairesEl = document.getElementById('popupSimilaires');
  if (similairesEl) {
    const similairesManuels = (manga.similaires || []).filter(s => typeof s === 'string' && s.trim());
    similairesEl.innerHTML = `
      <label for="edit-similaires"><strong>Similaires définis manuellement (séparés par une virgule) :</strong></label>
      <input type="text" id="edit-similaires" value="${similairesManuels.join(', ')}">
    `;
  }

  // Remplacer les boutons
  document.getElementById('boutonsAdmin').innerHTML = `
    <button onclick="enregistrerModifications('${id}')">💾 Enregistrer</button>
    <button onclick="closePopup()">❌ Annuler</button>
  `;
}




function enregistrerModifications(id) {
  const docRef = db.collection("mangas").doc(id);

  // Récupérer et formater les données modifiées
  const title = document.getElementById("edit-title")?.value.trim() || '';
  const description = document.getElementById("edit-description")?.value.trim() || '';
  const status = document.getElementById("edit-status")?.value.trim() || '';
  const date = document.getElementById("edit-date")?.value.trim() || '';
  const dernierLecture = document.getElementById("edit-dernierLecture")?.value.trim() || '';
  const chTotal = parseInt(document.getElementById("edit-chTotal")?.value) || 0;
  const chLus = document.getElementById("edit-chLus")?.value.trim() || '';
  const chJade = parseInt(document.getElementById("edit-chJade")?.value) || 0;
  const otherTitles = (document.getElementById("edit-otherTitles")?.value || '').split('/').map(t => t.trim()).filter(t => t);
  const page = document.getElementById("edit-page")?.value.trim() || '';
  const genresTags = document.querySelectorAll('#genresTagsContainer .genre-tag.active');
const selectedGenres = Array.from(genresTags).map(el => el.getAttribute('data-genre'));
  const externalLinks = parseLiensExternes(document.getElementById("edit-externalLinks")?.value || '');

const modifs = {
  title,
  description,
  status,
  date,
  dernierLecture,
  chTotal,
  chLus,
  chJade,
  otherTitles,
  page,
  genres: selectedGenres,
  externalLinks,
  similaires: (document.getElementById("edit-similaires")?.value || "")
    .split(",")
    .map(s => s.trim())
    .filter(s => s !== "")
};


  docRef.update(modifs)
    .then(() => {
      alert("Modifications enregistrées !");
      // Ne recharge pas toute la collection, mets juste à jour localement
      mangaData[id] = { ...mangaData[id], ...modifs };
      afficherAvecFiltres();
      closePopup();
    })
    .catch(error => {
      console.error("Erreur lors de l'enregistrement :", error);
      alert("Erreur lors de l'enregistrement.");
    });

}


function supprimerManga(id) {
  if (!confirm("⚠️ Es-tu sûr(e) de vouloir supprimer ce manga ?")) return;

  db.collection("mangas").doc(id).delete()
    .then(() => {
      alert("✅ Manga supprimé !");
      closePopup();
      delete mangaData[id];
afficherAvecFiltres();
closePopup();
alert("✅ Manga supprimé !");

    })
    .catch(error => {
      console.error("Erreur lors de la suppression :", error);
      alert("❌ Erreur lors de la suppression.");
    });
}


document.addEventListener("DOMContentLoaded", () => {
  chargerMangasDepuisFirestore();
});

function afficherSimilairesEdition(manga) {
  const container = document.getElementById('popupSimilairesContainer');
  container.innerHTML = '';

  // On affiche un textarea pour modifier uniquement les similaires manuels
  const similairesManuels = (manga.similaires || []).join(', ');
  
  const textarea = document.createElement('textarea');
  textarea.id = 'edit-similaires';
  textarea.rows = 2;
  textarea.style.width = '100%';
  textarea.placeholder = "Liste des mangas similaires, séparés par une virgule";
  textarea.value = similairesManuels;

  container.appendChild(textarea);
}

const genresPossibles = [
  "abu","academy","acting","action","adopted","androgine","animals","apocalypse","art","arts-martiaux","aventure",
  "badass","beast world","business","caretaker","child lead","comédie","cooking","crossdressing","cultivation","drame",
  "disciple","dungeon","enfant","fantasy","father","female lead","food","jeux vidéo","ghosts","harem","historical","horreur",
  "isekai","idol","long life","magie","male lead","manga","mature","mécanique","médicale","militaire","moderne","monstre",
  "mother","murim","multi world","multi life","musique","mystère","novel","omegaverse","power","prof","psychologique","réincarnation",
  "return","revenge","rich","romance","saint","school life","seconde chance","secret identity","sick","sport","suicide",
  "superhero","surnaturel","system","time travel","tower","tyrant","transmigration","transformation","vampire",
  "villainess","yaoi"
];

function afficherGenresPourAjout() {
  const container = document.getElementById("formGenresTagsContainer");
  const hiddenInput = document.getElementById("genres");
  const selected = new Set();

  // Réinitialiser le contenu
  container.innerHTML = '';

  // Créer et insérer le résumé des genres sélectionnés (au-dessus)
  const selectedText = document.createElement("div");
  selectedText.id = "formSelectedGenresText";
  selectedText.style.fontStyle = "italic";
  selectedText.style.marginBottom = "8px";
  selectedText.textContent = "Genres sélectionnés : Aucun";
  container.parentNode.insertBefore(selectedText, container);

  // Créer les genres cliquables
  genresPossibles.forEach(genre => {
    const span = document.createElement("span");
    span.className = "genre-tag";
    span.textContent = genre;

    span.addEventListener("click", () => {
      span.classList.toggle("selected");
      if (span.classList.contains("selected")) {
        selected.add(genre);
      } else {
        selected.delete(genre);
      }

      const selection = Array.from(selected);
      hiddenInput.value = selection.join(", ");
      selectedText.textContent = selection.length
        ? `Genres sélectionnés : ${selection.join(', ')}`
        : "Genres sélectionnés : Aucun";
    });

    container.appendChild(span);
  });
}

function ajouterChampLienExterne() {
  const container = document.getElementById("externalLinksContainer");

  const ligne = document.createElement("div");
  ligne.className = "external-link-line";
  ligne.innerHTML = `
    <input type="text" placeholder="Nom (ex: Mangadex)" class="external-link-name">
    <input type="text" placeholder="URL (ex: https://...)" class="external-link-url">
  `;
  container.appendChild(ligne);
}



document.addEventListener("DOMContentLoaded", afficherGenresPourAjout);

