import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
    import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
    import { getFirestore, doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

    const firebaseConfig = {
      apiKey: 'AIzaSyDu0TofMptHrwVYgQqzowfZRFL8q48y9Dk',
      authDomain: 'habits-garden-ee7af.firebaseapp.com',
      projectId: 'habits-garden-ee7af',
      storageBucket: 'habits-garden-ee7af.firebasestorage.app',
      messagingSenderId: '615005752278',
      appId: '1:615005752278:web:d2cb5923808d43d7a63277',
    };

    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      // Per-tab sign-in: the session lives in this tab's
      // session storage, not the browser-wide local storage,
      // so several tabs can be open on DIFFERENT accounts at
      // once. (The default persistence shares one sign-in
      // across every tab — signing in anywhere used to switch
      // all the other tabs to that account.) A tab keeps its
      // account across reloads; closing the tab ends it.
      setPersistence(auth, browserSessionPersistence).catch(() => { });
      const db = getFirestore(app);
      let user = null;
      let saveTimer = null;

      window.hgCloud = {
        signIn() {
          signInWithPopup(auth, new GoogleAuthProvider()).catch(err => {
            const code = err && err.code ? err.code : '';
            if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
              // Cancelled: just clear the "opening…" note.
              if (window.hgCloudStatus) window.hgCloudStatus('', false);
              return;
            }
            if (window.hgCloudStatus) window.hgCloudStatus('Google sign-in did not work — please try again', true);
          });
        },
        signOut() { signOut(auth).catch(() => { }); },
        load() {
          if (!user) return Promise.resolve(null);
          return getDoc(doc(db, 'gardens', user.uid)).then(snap => {
            if (!snap.exists()) return null;
            const data = snap.data();
            return data && Array.isArray(data.garden) ? data.garden : null;
          });
        },
        save(bundle) {
          if (!user) return;
          // The row is bound NOW, to the account that made this
          // garden: if the sign-in changes before the write
          // lands, the write is dropped rather than delivered
          // to the new account's row.
          const uid = user.uid;
          if (saveTimer) clearTimeout(saveTimer);
          saveTimer = setTimeout(() => {
            if (!user || user.uid !== uid) return;
            setDoc(doc(db, 'gardens', uid), { garden: bundle, updatedAt: serverTimestamp() })
              .catch(() => { });
          }, 1200);
        },
      };

      let unwatch = null;
      onAuthStateChanged(auth, u => {
        user = u;
        if (window.hgCloudHook) {
          window.hgCloudHook(u ? { email: u.email, uid: u.uid } : null);
        }
        // Watch the account's garden row: when another device
        // saves (collecting dew there, say), the new garden is
        // handed to the game code to put on this shelf too.
        if (unwatch) { unwatch(); unwatch = null; }
        if (u) {
          unwatch = onSnapshot(doc(db, 'gardens', u.uid), snap => {
            if (!snap.exists()) return;
            const data = snap.data();
            if (data && Array.isArray(data.garden) && window.hgRemoteGarden) {
              window.hgRemoteGarden(data.garden, u.uid);
            }
          }, () => { });
        }
      });
    } catch (e) {
      // The cloud is unreachable (offline, blocked): the game
      // simply runs signed-out, exactly as before.
      if (window.hgCloudStatus) window.hgCloudStatus('', false);
    }
