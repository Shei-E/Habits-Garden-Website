import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
    import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
    import { initializeFirestore, doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
      // ignoreUndefinedProperties: a stray undefined in a
      // garden bundle must never sink the whole save — the
      // database otherwise refuses the write outright.
      const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
      let user = null;
      let saveTimer = null;
      // The newest bundle handed to save() that has not been
      // written yet, bound to the account that made it. When
      // the write lands, the game code is told (its unlanded-
      // save record can go); flush() writes it immediately
      // instead of waiting out the debounce.
      let pendingSave = null;
      function writePendingSave() {
        if (!pendingSave) return;
        const uid = pendingSave.uid;
        const bundle = pendingSave.bundle;
        if (!user || user.uid !== uid) return;
        setDoc(doc(db, 'gardens', uid), { garden: bundle, updatedAt: serverTimestamp() })
          .then(() => {
            if (pendingSave && pendingSave.bundle === bundle) {
              pendingSave = null;
              if (window.hgCloudSaveLanded) { try { window.hgCloudSaveLanded(uid); } catch (e) { } }
            }
          })
          .catch(err => { try { console.warn('Habits Garden: cloud save failed', err); } catch (e) { } });
      }

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
        // Tutorial flags live in the account's own cloud row,
        // alongside the garden, so they follow the account to
        // any device (a browser-local flag cannot). They are
        // separate fields, not part of the garden bundle.
        loadTutorialFlags() {
          if (!user) return Promise.resolve(null);
          return getDoc(doc(db, 'gardens', user.uid)).then(snap => {
            if (!snap.exists()) return null;
            const data = snap.data() || {};
            return { binTutorialDone: !!data.binTutorialDone };
          });
        },
        saveBinTutorialDone() {
          if (!user) return;
          // Bound to the account that finished the tutorial,
          // like save(): a sign-in change must not deliver it
          // to a different account's row. Merge, so the garden
          // field in the same row is left untouched.
          const uid = user.uid;
          setDoc(doc(db, 'gardens', uid), { binTutorialDone: true }, { merge: true })
            .catch(err => { try { console.warn('Habits Garden: tutorial flag save failed', err); } catch (e) { } });
        },
        save(bundle) {
          if (!user) return;
          // The row is bound NOW, to the account that made this
          // garden: if the sign-in changes before the write
          // lands, the write is dropped rather than delivered
          // to the new account's row.
          pendingSave = { uid: user.uid, bundle };
          if (saveTimer) clearTimeout(saveTimer);
          saveTimer = setTimeout(() => {
            saveTimer = null;
            writePendingSave();
          }, 1200);
        },
        flush() {
          if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
          writePendingSave();
        },
      };

      // A tab that closes (or is hidden) inside the debounce
      // window must not take a pending save with it: write it
      // immediately. The game code's unlanded-save record
      // covers the rest — if even this write is cut off, the
      // recorded garden is kept and sent up again on the
      // next visit instead of being undone by the cloud's
      // older copy.
      window.addEventListener('pagehide', () => { try { window.hgCloud.flush(); } catch (e) { } });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') { try { window.hgCloud.flush(); } catch (e) { } }
      });

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
