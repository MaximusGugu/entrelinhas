const firebaseConfig = {
  apiKey: "AIzaSyCIBYKQhrkAM3LDfVizPzEAVhG9_ppHMOI",
  authDomain: "catalogo-leitura.firebaseapp.com",
  projectId: "catalogo-leitura",
  storageBucket: "catalogo-leitura.firebasestorage.app",
  messagingSenderId: "297756251742",
  appId: "1:297756251742:web:1aabded2dd75ea607646cf"
};

firebase.initializeApp(firebaseConfig);
const firebaseAuth = firebase.auth();
const firebaseDb = firebase.firestore();

window.FirebaseBackend = {
  auth: firebaseAuth,
  register(email, password) {
    return firebaseAuth.createUserWithEmailAndPassword(email, password);
  },
  login(email, password) {
    return firebaseAuth.signInWithEmailAndPassword(email, password);
  },
  logout() {
    return firebaseAuth.signOut();
  },
  async loadState(uid) {
    const snapshot = await firebaseDb.doc(`users/${uid}/data/library`).get();
    return snapshot.exists ? snapshot.data() : null;
  },
  saveState(uid, data) {
    return firebaseDb.doc(`users/${uid}/data/library`).set(data);
  },
  savePublicCollection(uid, collectionId, data) {
    return firebaseDb.doc(`publicCollections/${uid}_${collectionId}`).set(data);
  },
  deletePublicCollection(uid, collectionId) {
    return firebaseDb.doc(`publicCollections/${uid}_${collectionId}`).delete();
  },
  async loadPublicCollection(uid, collectionId) {
    const snapshot = await firebaseDb.doc(`publicCollections/${uid}_${collectionId}`).get();
    return snapshot.exists ? snapshot.data() : null;
  }
};
