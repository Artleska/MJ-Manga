function chargerMangasDepuisFirestore() {
  db.collection("mangas").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      mangaData[doc.id] = doc.data();
    });

    afficherAvecFiltres(); // ou afficherTousLesMangas(), selon ton site
  }).catch((error) => {
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
  auth.signInWithPopup(provider)
    .then(result => {
      const email = result.user.email;
      if (utilisateursAutorises.includes(email)) {
        document.getElementById("userEmail").textContent = email;
        alert("Connecté !");
      } else {
        auth.signOut();
        alert("Accès refusé");
      }
    })
    .catch(error => {
      console.error("Erreur de connexion :", error);
      alert("Erreur de connexion.");
    });
}

// Déconnexion
function seDeconnecter() {
  auth.signOut().then(() => {
    document.getElementById("userEmail").textContent = "";
    alert("Déconnecté");
  });
}

// Utilisateur connecté ?
auth.onAuthStateChanged(user => {
  if (user && utilisateursAutorises.includes(user.email)) {
    document.getElementById("userEmail").textContent = user.email;
  } else {
    document.getElementById("userEmail").textContent = "";
  }
});

// Transformer textarea liens externes en objet
function parseLiensExternes(input) {
  const lignes = input.split('\n');
  const liens = {};
  lignes.forEach(ligne => {
    const [nom, url] = ligne.split(":").map(part => part.trim());
    if (nom && url) {
      liens[nom] = url;
    }
  });
  return liens;
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
  const externalLinks = parseLiensExternes(document.getElementById("externalLinks").value);

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
  } catch (err) {
    console.error("Erreur Firebase :", err);
    alert("❌ Erreur lors de l'ajout !");
  }
});

function activerEditionManga(id) {
  const manga = mangaData[id];
  if (!manga) return;

  // Title editable
  document.getElementById('popupTitle').innerHTML = `<input type="text" id="edit-title" value="${manga.title}">`;

  // Description editable
  document.getElementById('popupDescription').innerHTML = `<textarea id="edit-description" rows="4">${manga.description || ''}</textarea>`;

  // Genres (affichage non modifiable dans ce cas, à complexifier si besoin)
  // Tu peux aussi envisager un champ texte simple
  const genresString = (manga.genres || []).join(', ');
  const popupGenres = document.getElementById('popupGenres');
  popupGenres.innerHTML = `<input type="text" id="edit-genres" value="${genresString}">`;

  // Status / Date / DernierLecture
  document.getElementById('popupDateStatus').innerHTML = `
    <input type="text" id="edit-status" value="${manga.status || ''}" placeholder="Status">
    <input type="text" id="edit-date" value="${manga.date || ''}" placeholder="Date">
    <input type="text" id="edit-dernierLecture" value="${manga.dernierLecture || ''}" placeholder="Dernière lecture">
  `;

  // Chapitres
  document.getElementById('popupChContainer').innerHTML = `
    <input type="number" id="edit-chTotal" value="${manga.chTotal || 0}" placeholder="Chapitres total" min="0">
    <input type="text" id="edit-chLus" value="${manga.chLus || ''}" placeholder="Chapitres lus">
    <input type="number" id="edit-chJade" value="${manga.chJade || 0}" placeholder="Ch (Jade)" min="0">
  `;

  // Autres titres
  document.getElementById('popupOtherTitles').innerHTML = `<input type="text" id="edit-otherTitles" value="${(manga.otherTitles || []).join(', ')}">`;

  // Page
  document.getElementById('popupPageValue').innerHTML = `<input type="text" id="edit-page" value="${manga.page || ''}">`;

  // Liens externes
  const liens = Object.entries(manga.externalLinks || {}).map(([nom, url]) => `${nom}:${url}`).join('\n');
  document.getElementById('popupExternalLinks').innerHTML = `<textarea id="edit-externalLinks" rows="3">${liens}</textarea>`;

  // Similaires
const similairesEl = document.getElementById('popup-similaires');
if (similairesEl) {
  // 🔍 uniquement les similaires définis manuellement (avant génération auto)
  const similairesManuels = mangaData[id]?.similaires || [];

  similairesEl.innerHTML = `
    <label for="edit-similaires"><strong>Similaires définis manuellement :</strong></label>
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
  const genres = (document.getElementById("edit-genres")?.value || '').split(',').map(g => g.trim().toLowerCase()).filter(g => g);
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
  genres,
  externalLinks,
  similaires: (document.getElementById("edit-similaires")?.value || "")
    .split(",")
    .map(s => s.trim())
    .filter(s => s !== "")
};


  docRef.update(modifs)
    .then(() => {
      alert("Modifications enregistrées !");
      closePopup();
      chargerMangasDepuisFirestore(); // Recharge les mangas avec les données à jour
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
      location.reload();
    })
    .catch(error => {
      console.error("Erreur lors de la suppression :", error);
      alert("❌ Erreur lors de la suppression.");
    });
}

function parseLiensExternes(input) {
  const lignes = input.split('\n');
  const liens = {};
  lignes.forEach(ligne => {
    const [nom, url] = ligne.split(":").map(part => part.trim());
    if (nom && url) {
      liens[nom] = url;
    }
  });
  return liens;
}

document.addEventListener("DOMContentLoaded", () => {
  chargerMangasDepuisFirestore();
});