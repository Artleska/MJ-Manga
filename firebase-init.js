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
  "adresse.de.lautre.jadelavoie51@gmail.com"
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
