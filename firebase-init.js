let mangaData = {};
let lastVisible = null;
let isLoading = false;

let compteurData = getCompteurLectures();
let compteurLectures = compteurData.count;
saveCompteurLectures(compteurData);

const dejaComptes = getIdsDejaComptes();

function getCompteurLectures() {
  const data = JSON.parse(localStorage.getItem('compteurLecturesJournalier')) || { count: 0, lastReset: 0 };
  const maintenant = Date.now();
  if (maintenant - data.lastReset > 24 * 60 * 60 * 1000) {
    return { count: 0, lastReset: maintenant };
  }
  return data;
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

function saveCompteurLectures(data) {
  localStorage.setItem('compteurLecturesJournalier', JSON.stringify(data));
  const compteurEl = document.getElementById("compteurLecturesDisplay");
  if (compteurEl) compteurEl.textContent = `📖 ${data.count} lectures Firestore`;
}

function getIdsDejaComptes() {
  return new Set(JSON.parse(localStorage.getItem('idsDejaComptes') || '[]'));
}

function ajouterIdDejaCompte(id) {
  dejaComptes.add(id);
  localStorage.setItem('idsDejaComptes', JSON.stringify(Array.from(dejaComptes)));
}

async function chargerMangasDepuisFirestore(voirPlus = false) {
  if (isLoading) return;
  isLoading = true;

  let query = db.collection("mangas").orderBy("title");


  try {
    const snapshot = await query.get();
    if (snapshot.empty) {
      return;
    }

    let compteurModifie = false;

    snapshot.docs.forEach(doc => {
      const id = doc.id;
      const data = doc.data();
      mangaData[id] = data;

      if (!dejaComptes.has(id)) {
        ajouterIdDejaCompte(id);
        compteurLectures++;
        compteurModifie = true;
      }
    });

    if (compteurModifie) {
      compteurData.count = compteurLectures;
      saveCompteurLectures(compteurData);
    }

    
    afficherAvecFiltres();


  } catch (err) {
    console.error("❌ Erreur Firestore :", err);
  } finally {
    isLoading = false;
  }
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

// Activer la persistance Firestore
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn("Persistance non activée : plusieurs onglets Firestore ouverts");
    } else if (err.code == 'unimplemented') {
      console.warn("Persistance non supportée par ce navigateur");
    }
  });

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
  title: title || "(Sans titre)",
  otherTitles: Array.isArray(otherTitles) ? otherTitles : [],
  image: image || "",
  description: description || "",
  genres: Array.isArray(genres) ? genres : [],
  status: status || "",
  chTotal: parseInt(chTotal) || 0,
  chLus: chLus || "",
  chJade: parseInt(chJade) || 0,
  date: date || "",
  dernierLecture: dernierLecture || "",
  page: page || "",
  similaires: Array.isArray(similaires) ? similaires : [],
  externalLinks: externalLinks || {}
};

 try {
  await db.collection("mangas").doc(id).set(data);

  // Succès Firestore
  alert("✅ Manga ajouté !");
  // Remise à zéro du formulaire natif
document.getElementById("formAjout").reset();

// Réinitialiser les genres sélectionnés manuellement
document.querySelectorAll("#formGenresTagsContainer .genre-tag").forEach(span => {
  span.classList.remove("selected");
});
document.getElementById("genres").value = "";
const selectedText = document.getElementById("formSelectedGenresText");
if (selectedText) selectedText.textContent = "Genres sélectionnés : Aucun";


// Réinitialiser la sélection de genres (rafraîchir la zone genre)
afficherGenresPourAjout();

// Vider les liens externes et ajouter une ligne vide
const externalLinksContainer = document.getElementById("externalLinksContainer");
if (externalLinksContainer) {
  externalLinksContainer.innerHTML = '';
  ajouterChampLienExterne();
}

// Vider le champ similaires
const similairesInput = document.getElementById("similaires");
if (similairesInput) similairesInput.value = "";

// Remettre le focus sur le premier champ (optionnel)
document.getElementById("title").focus();

// Mettre à jour les données locales
mangaData[id] = data;

// Rafraîchir l'affichage des mangas
try {
  afficherAvecFiltres();
} catch (e) {
  console.error("Erreur d'affichage après ajout :", e);
  alert("⚠️ Manga ajouté, mais affichage impossible (champ invalide ?)");
}

// Mettre à jour le compteur total mangas dans Firestore
await mettreAJourTotalMangas(1);


} catch (err) {
  console.error("Erreur Firebase :", err);
  alert("❌ Erreur lors de l'ajout !");
}


});

function activerEditionManga(id) {
  const manga = mangaData[id];
  if (!manga) return;

// Image editable 
document.getElementById('popupImage').innerHTML = `
  <label for="edit-image"><strong>URL de l'image :</strong></label>
  <input type="text" id="edit-image" value="${manga.image || ''}">
`;



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
  
  // Contenu HTML des genres
const selectedGenres = (manga.genres || []).join(', ') || 'Aucun';
let genresHtml = `
  <label><strong>Genres sélectionnés :</strong></label>
  <div id="selectedGenresText" style="margin-bottom:10px; font-style: italic;">${selectedGenres}</div>

  <label><strong>Genres :</strong></label>
  <div id="genresTagsContainer" style="margin-bottom:10px;">
`;

genresPossibles.forEach(genre => {
  const actif = (manga.genres || []).includes(genre);
  genresHtml += `<span class="genre-tag ${actif ? 'active' : ''}" data-genre="${genre}">${genre}</span>`;
});
genresHtml += `</div>`;


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
    <button onclick="enregistrerModifications('${id}')">Enregistrer</button>
    <button onclick="annulerModifications('${id}')">Annuler</button>

  `;
  document.getElementById('popup').classList.add('editing');
}

function annulerModifications(id) {
  closePopup();
  document.getElementById('popup').classList.remove('editing');
  setTimeout(() => {
    openPopup(id);
  }, 200);
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
  const image = document.getElementById("edit-image")?.value.trim() || '';


const modifs = {
  image,
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
  mangaData[id] = { ...mangaData[id], ...modifs };
  afficherAvecFiltres();
  closePopup();
  document.getElementById('popup').classList.remove('editing');
  setTimeout(() => {
    openPopup(id);
  }, 200);
})

    .catch(error => {
      console.error("Erreur lors de l'enregistrement :", error);
      alert("Erreur lors de l'enregistrement.");
    });

}


function supprimerManga(id) {
  if (!confirm("⚠️ Es-tu sûr(e) de vouloir supprimer ce manga ?")) return;

  db.collection("mangas").doc(id).delete()
  .then(async () => {
    alert("✅ Manga supprimé !");
    closePopup();
    delete mangaData[id];
    afficherAvecFiltres();

    // <-- Ajoute cette ligne pour décrémenter le compteur dans Firestore :
    await mettreAJourTotalMangas(-1);
  })
  .catch(error => {
    console.error("Erreur lors de la suppression :", error);
    alert("❌ Erreur lors de la suppression.");
  });
}

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

function afficherGenresPourAjout() {
  const container = document.getElementById("formGenresTagsContainer");
  const hiddenInput = document.getElementById("genres");
  const selected = new Set();

  // Réinitialiser le contenu
  container.innerHTML = '';

  // Vérifier si le résumé existe déjà
  let selectedText = document.getElementById("formSelectedGenresText");
  if (!selectedText) {
    selectedText = document.createElement("div");
    selectedText.id = "formSelectedGenresText";
    selectedText.style.fontStyle = "italic";
    selectedText.style.marginBottom = "8px";
    container.parentNode.insertBefore(selectedText, container);
  }

  // Réinitialiser le texte du résumé
  selectedText.textContent = "Genres sélectionnés : Aucun";

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

function afficherNombreTotalMangas() {
  db.collection("meta").doc("stats").get()
    .then(doc => {
      console.log("Doc snapshot:", doc);
      if (doc.exists) {
        const total = doc.data().totalMangas || 0;
        console.log("Total mangas récupéré:", total);
        const el = document.getElementById("totalMangasDisplay");
        if (el) el.textContent = `📚 Total mangas : ${total}`;
      } else {
        console.log("Document stats introuvable");
        const el = document.getElementById("totalMangasDisplay");
        if (el) el.textContent = "Aucun total mangas trouvé";
      }
    })
    .catch(err => {
      console.error("Erreur lecture total mangas:", err);
      const el = document.getElementById("totalMangasDisplay");
      if (el) el.textContent = "Erreur chargement total mangas";
    });
}



firebase.auth().onAuthStateChanged(async (user) => {
  afficherEtatConnexion(user);

  try {
    // Attendre un peu pour éviter certains cas Safari
    await new Promise(resolve => setTimeout(resolve, 100));

    await chargerMangasDepuisFirestore();
    afficherGenresPourAjout();
    afficherNombreTotalMangas();
  } catch (e) {
    console.error("Erreur chargement après connexion :", e);
    alert("❌ Erreur lors du chargement des mangas.");
  }
});

async function mettreAJourTotalMangas(delta) {
  const metaRef = db.collection("meta").doc("stats");
  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(metaRef);
      if (!doc.exists) {
        transaction.set(metaRef, { totalMangas: Math.max(0, delta) });
      } else {
        const total = doc.data().totalMangas || 0;
        const nouveauTotal = Math.max(0, total + delta);
        transaction.update(metaRef, { totalMangas: nouveauTotal });
      }
    });
  } catch (err) {
    console.error("Erreur mise à jour total mangas :", err);
  }
}






