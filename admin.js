/*
 * Admin dashboard logic
 *
 * Handles authentication via Firebase Auth, image uploads to Storage,
 * CRUD operations on Firestore documents, and a simple UI for
 * managing gallery items (edit captions/tags and delete entries).
 */
(function () {
  // Ensure Firebase has been initialized (see admin.html for config)
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  // Login elements
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginStatus = document.getElementById('loginStatus');
  // Panels
  const loginPanel = document.getElementById('admin-login');
  const dashboardPanel = document.getElementById('admin-dashboard');
  // Upload form elements
  const uploadInput = document.getElementById('uploadInput');
  const uploadCaption = document.getElementById('uploadCaption');
  const uploadTags = document.getElementById('uploadTags');
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadStatus = document.getElementById('uploadStatus');
  // Gallery list
  const galleryItems = document.getElementById('galleryItems');
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');

  /**
   * Listen for login form submissions. Attempts to sign in the user with
   * email/password. Displays errors if sign‑in fails.
   */
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loginStatus.textContent = '';
      const email = loginEmail.value.trim();
      const pwd = loginPassword.value;
      if (!email || !pwd) {
        loginStatus.textContent = 'Please enter your email and password.';
        return;
      }
      loginStatus.textContent = 'Signing in…';
      auth
        .signInWithEmailAndPassword(email, pwd)
        .then(() => {
          loginForm.reset();
          loginStatus.textContent = '';
        })
        .catch((err) => {
          loginStatus.textContent = err.message;
        });
    });
  }

  /**
   * Observe auth state changes to toggle UI. When a user is logged in,
   * show the dashboard and load gallery items. Otherwise, show the login form.
   */
  auth.onAuthStateChanged((user) => {
    if (user) {
      loginPanel.classList.add('hidden');
      dashboardPanel.classList.remove('hidden');
      loadGallery();
    } else {
      dashboardPanel.classList.add('hidden');
      loginPanel.classList.remove('hidden');
      galleryItems.innerHTML = '';
    }
  });

  /**
   * Log out the current user.
   */
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.signOut();
    });
  }

  /**
   * Upload selected files to Firebase Storage and add entries to Firestore.
   * Allows multiple files; after each upload, it creates a Firestore document
   * with the download URL, caption, tags and timestamp.
   */
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      if (!uploadInput.files || uploadInput.files.length === 0) {
        uploadStatus.textContent = 'Please select image(s) to upload.';
        return;
      }
      uploadStatus.textContent = 'Uploading…';
      const caption = uploadCaption.value.trim();
      const tags = uploadTags.value
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);
      const tasks = [];
      Array.from(uploadInput.files).forEach((file) => {
        const filename = Date.now() + '-' + file.name;
        const storageRef = storage.ref().child('gallery/' + filename);
        const uploadTask = storageRef
          .put(file)
          .then((snapshot) => snapshot.ref.getDownloadURL())
          .then((url) => {
            return db.collection('gallery').add({
              url: url,
              caption: caption,
              tags: tags,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          });
        tasks.push(uploadTask);
      });
      Promise.all(tasks)
        .then(() => {
          uploadStatus.textContent = 'Upload complete.';
          uploadInput.value = '';
          uploadCaption.value = '';
          uploadTags.value = '';
          loadGallery();
          setTimeout(() => {
            uploadStatus.textContent = '';
          }, 3000);
        })
        .catch((err) => {
          uploadStatus.textContent = err.message;
        });
    });
  }

  /**
   * Fetch gallery documents from Firestore and render them into the dashboard.
   */
  function loadGallery() {
    galleryItems.innerHTML = 'Loading…';
    db.collection('gallery')
      .orderBy('createdAt', 'desc')
      .get()
      .then((snapshot) => {
        galleryItems.innerHTML = '';
        if (snapshot.empty) {
          galleryItems.textContent = 'No images uploaded yet.';
          return;
        }
        snapshot.forEach((doc) => {
          renderItem(doc);
        });
      })
      .catch((err) => {
        galleryItems.textContent = 'Error loading items: ' + err.message;
      });
  }

  /**
   * Render a single gallery item with editable caption and tags plus delete option.
   * @param {firebase.firestore.QueryDocumentSnapshot} doc
   */
  function renderItem(doc) {
    const data = doc.data();
    const wrapper = document.createElement('div');
    wrapper.className = 'admin-item';
    // Image preview
    const img = document.createElement('img');
    img.src = data.url;
    img.alt = data.caption || '';
    // Controls container
    const controls = document.createElement('div');
    controls.style.flex = '1';
    // Caption field
    const captionLabel = document.createElement('label');
    captionLabel.textContent = 'Caption';
    const captionInput = document.createElement('input');
    captionInput.type = 'text';
    captionInput.value = data.caption || '';
    captionLabel.appendChild(captionInput);
    // Tags field
    const tagsLabel = document.createElement('label');
    tagsLabel.textContent = 'Tags';
    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.value = (data.tags || []).join(', ');
    tagsLabel.appendChild(tagsInput);
    // Action buttons
    const buttonRow = document.createElement('div');
    buttonRow.className = 'cta-row';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary';
    saveBtn.textContent = 'Save';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn ghost';
    deleteBtn.textContent = 'Delete';
    buttonRow.appendChild(saveBtn);
    buttonRow.appendChild(deleteBtn);
    // Assemble controls
    controls.appendChild(captionLabel);
    controls.appendChild(tagsLabel);
    controls.appendChild(buttonRow);
    // Add to wrapper
    wrapper.appendChild(img);
    wrapper.appendChild(controls);
    // Append to list
    galleryItems.appendChild(wrapper);
    // Save handler
    saveBtn.addEventListener('click', () => {
      const newCap = captionInput.value.trim();
      const newTags = tagsInput.value
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);
      db.collection('gallery')
        .doc(doc.id)
        .update({ caption: newCap, tags: newTags })
        .then(() => {
          saveBtn.textContent = 'Saved';
          setTimeout(() => {
            saveBtn.textContent = 'Save';
          }, 2000);
        })
        .catch((err) => {
          saveBtn.textContent = err.message;
        });
    });
    // Delete handler
    deleteBtn.addEventListener('click', () => {
      if (!confirm('Delete this item? This cannot be undone.')) return;
      // Delete image from storage
      if (data.url) {
        try {
          const fileRef = storage.refFromURL(data.url);
          fileRef.delete().catch(() => {});
        } catch (err) {
          // ignore if refFromURL fails (e.g., unsupported URL)
        }
      }
      // Delete Firestore document
      db.collection('gallery')
        .doc(doc.id)
        .delete()
        .then(() => {
          wrapper.remove();
        });
    });
  }
})();