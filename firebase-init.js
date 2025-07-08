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
