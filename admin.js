// Auth UI
const uploaderCard = document.getElementById('uploaderCard');
const listCard = document.getElementById('listCard');
const email = document.getElementById('email');
const password = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authMsg = document.getElementById('authMsg');

loginBtn?.addEventListener('click', async () => {
  authMsg.textContent = 'Signing in...';
  try {
    await auth.signInWithEmailAndPassword(email.value, password.value);
  } catch (e) {
    authMsg.textContent = e.message;
  }
});

logoutBtn?.addEventListener('click', async () => {
  await auth.signOut();
});

auth.onAuthStateChanged(user => {
  if (user) {
    authMsg.textContent = `Signed in as ${user.email}`;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    uploaderCard.classList.remove('hidden');
    listCard.classList.remove('hidden');
    loadItems();
  } else {
    authMsg.textContent = '';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    uploaderCard.classList.add('hidden');
    listCard.classList.add('hidden');
  }
});

// Uploader
const adminDrop = document.getElementById('adminDrop');
const pickFiles = document.getElementById('pickFiles');
const filesInput = document.getElementById('files');
const preview = document.getElementById('preview');
const uploadBtn = document.getElementById('uploadBtn');
const uploadMsg = document.getElementById('uploadMsg');

const preventDefaults = e => { e.preventDefault(); e.stopPropagation(); };
['dragenter','dragover','dragleave','drop'].forEach(ev => adminDrop?.addEventListener(ev, preventDefaults));
adminDrop?.addEventListener('dragover', () => adminDrop.style.background = '#fff');
adminDrop?.addEventListener('dragleave', () => adminDrop.style.background = '#fafafa');
adminDrop?.addEventListener('drop', (e) => { adminDrop.style.background = '#fafafa'; filesInput.files = e.dataTransfer.files; renderPreview(); });

pickFiles?.addEventListener('click', () => filesInput.click());
filesInput?.addEventListener('change', renderPreview);

function renderPreview() {
  preview.innerHTML = '';
  [...filesInput.files].forEach(f => {
    if (!f.type.startsWith('image/')) return;
    const img = document.createElement('img');
    img.className = 'thumb-sm';
    const r = new FileReader();
    r.onload = e => img.src = e.target.result;
    r.readAsDataURL(f);
    preview.appendChild(img);
  });
}

uploadBtn?.addEventListener('click', async () => {
  const files = [...(filesInput.files || [])];
  if (!files.length) { uploadMsg.textContent = 'Please choose at least one image.'; return; }
  uploadMsg.textContent = 'Uploading...';
  const cap = document.getElementById('caption').value.trim();
  const tags = document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean);

  try {
    for (const file of files) {
      const path = `gallery/${Date.now()}-${file.name}`;
      const snap = await storage.ref(path).put(file);
      const url = await snap.ref.getDownloadURL();
      await db.collection('gallery').add({
        url, caption: cap || file.name, tags, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    filesInput.value = '';
    preview.innerHTML = '';
    document.getElementById('caption').value = '';
    document.getElementById('tags').value = '';
    uploadMsg.textContent = 'Upload complete.';
    loadItems();
  } catch (e) {
    uploadMsg.textContent = e.message;
  }
});

// List / Edit / Delete
async function loadItems() {
  const tbody = document.getElementById('itemsBody');
  tbody.innerHTML = '<tr><td colspan="4" class="muted">Loading…</td></tr>';
  const snap = await db.collection('gallery').orderBy('createdAt', 'desc').get();
  tbody.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img class="thumb-sm" src="${d.url}" alt=""></td>
      <td><input class="input" value="${d.caption || ''}" data-field="caption"></td>
      <td><input class="input" value="${(d.tags || []).join(', ')}" data-field="tags"></td>
      <td>
        <button class="btn primary" data-action="save">Save</button>
        <button class="btn" data-action="delete">Delete</button>
      </td>`;
    tr.querySelector('[data-action="save"]').addEventListener('click', async () => {
      const caption = tr.querySelector('[data-field="caption"]').value.trim();
      const tags = tr.querySelector('[data-field="tags"]').value.split(',').map(t => t.trim()).filter(Boolean);
      await db.collection('gallery').doc(doc.id).update({ caption, tags });
      alert('Saved.');
    });
    tr.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm('Delete this image?')) return;
      await db.collection('gallery').doc(doc.id).delete();
      tr.remove();
    });
    tbody.appendChild(tr);
  });
}
