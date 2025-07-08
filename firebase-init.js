const firebaseConfig = {
    apiKey: "AIzaSyB8kcRDh17HoysCnUT9rzDR9IDkhfEENR4",
    authDomain: "site-manga-da5cc.firebaseapp.com",
    databaseURL: "https://site-manga-da5cc-default-rtdb.firebaseio.com",
    projectId: "site-manga-da5cc",
    storageBucket: "site-manga-da5cc.firebasestorage.app",
    messagingSenderId: "546213461662",
    appId: "1:546213461662:web:f1a7d06ef2dc930d38458f"
  };

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);

// Authentification et Firestore
const auth = firebase.auth();
const firestore = firebase.firestore();


const utilisateursAutorises = [
  "megane.lavoie24@gmail.com",
  "jadelavoie51@gmail.com"
];

function seConnecter() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    const email = result.user.email;

    if (utilisateursAutorises.includes(email)) {
      document.getElementById("userEmail").textContent = email;
      alert("Connecté avec succès !");
    } else {
      auth.signOut();
      alert("Accès refusé : vous n'avez pas l'autorisation de modifier ce site.");
    }
  }).catch(error => {
    console.error("Erreur de connexion :", error);
  });
}
auth.onAuthStateChanged(user => {
  if (user) {
    const email = user.email;

    if (utilisateursAutorises.includes(email)) {
      document.getElementById("userEmail").textContent = email;

      // Tu peux ici débloquer les boutons de modification/ajout
      console.log("Utilisateur autorisé :", email);
    } else {
      auth.signOut();
      alert("Accès refusé : vous n'avez pas l'autorisation.");
    }
  } else {
    document.getElementById("userEmail").textContent = "";
  }
});
function seDeconnecter() {
  auth.signOut().then(() => {
    document.getElementById("userEmail").textContent = "";
    alert("Déconnecté avec succès.");
  }).catch(error => {
    console.error("Erreur lors de la déconnexion :", error);
  });
}function activerEditionManga(id) {
  const manga = mangaData[id];
  if (!manga) return;

  const champs = ['title', 'status', 'chTotal', 'chLus', 'chJade'];
  champs.forEach(champ => {
    const el = document.getElementById(`popup-${champ}`);
    if (el) {
      const valeur = manga[champ] || '';
      el.innerHTML = `<input type="text" id="edit-${champ}" value="${valeur}">`;
    }
  });

  const liensEl = document.getElementById('popup-externalLinks');
  if (liensEl) {
    const lignes = Object.entries(manga.externalLinks || {}).map(([nom, url]) => `${nom}:${url}`).join('\n');
    liensEl.innerHTML = `<textarea id="edit-externalLinks" rows="3">${lignes}</textarea>`;
  }

  const btnZone = document.getElementById('boutonsAdmin');
  if (btnZone) {
    btnZone.innerHTML = `
      <button onclick="enregistrerModifications('${id}')">💾 Enregistrer</button>
      <button onclick="location.reload()">❌ Annuler</button>
    `;
  }
}

function enregistrerModifications(id) {
  const docRef = firestore.collection("mangas").doc(id);
  const modifs = {
    title: document.getElementById("edit-title")?.value.trim() || '',
    status: document.getElementById("edit-status")?.value.trim() || '',
    chTotal: parseInt(document.getElementById("edit-chTotal")?.value) || 0,
    chLus: document.getElementById("edit-chLus")?.value.trim() || '',
    chJade: parseInt(document.getElementById("edit-chJade")?.value) || 0,
    externalLinks: parseLiensExternes(document.getElementById("edit-externalLinks")?.value || "")
  };

  docRef.update(modifs)
    .then(() => {
      alert("Modifications enregistrées !");
      location.reload(); // Recharge les données mises à jour
    })
    .catch(error => {
      console.error("Erreur lors de l'enregistrement :", error);
      alert("Erreur lors de l'enregistrement.");
    });
}

  const db = firebase.firestore();

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

  document.getElementById("formAjout").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Récupérer tous les inputs
    const mangaId = document.getElementById("mangaId").value.trim();
    const title = document.getElementById("title").value.trim();
    const otherTitles = document.getElementById("otherTitles").value.split(",").map(t => t.trim()).filter(t => t);
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

    // Générer un ID : soit avec mangaId, soit à partir du titre
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
      alert("✅ Manga ajouté avec succès !");
      document.getElementById("formAjout").reset();
    } catch (err) {
      console.error("❌ Erreur lors de l’ajout :", err);
      alert("Erreur lors de l’ajout du manga");
    }
  });