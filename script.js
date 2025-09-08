
// Mobile nav
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle?.addEventListener('click', () => {
  if (navLinks.style.display === 'flex') navLinks.style.display = 'none';
  else { navLinks.style.display = 'flex'; navLinks.style.gap = '16px'; }
});

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Conditional logic for head size (wide brims & fedoras typically need exact size)
const hatType = document.getElementById('hatType');
const sizeField = document.getElementById('sizeField');
hatType?.addEventListener('change', () => {
  const val = hatType.value;
  if (val === 'Wide Brim' || val === 'Fedora') sizeField.classList.remove('hidden');
  else sizeField.classList.add('hidden');
});

// Drag & drop uploader with previews
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const thumbs = document.getElementById('thumbs');
const chooseBtn = document.getElementById('chooseBtn');

const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
['dragenter','dragover','dragleave','drop'].forEach(ev => {
  dropArea.addEventListener(ev, preventDefaults, false);
});
dropArea.addEventListener('dragover', () => dropArea.style.background = '#fff');
dropArea.addEventListener('dragleave', () => dropArea.style.background = '#fafafa');
dropArea.addEventListener('drop', (e) => {
  dropArea.style.background = '#fafafa';
  const dt = e.dataTransfer;
  handleFiles(dt.files);
});
chooseBtn?.addEventListener('click', () => fileInput.click());
fileInput?.addEventListener('change', () => handleFiles(fileInput.files));

function handleFiles(files) {
  thumbs.innerHTML = '';
  [...files].forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 8 * 1024 * 1024) { // 8 MB limit
      alert(`${file.name} is larger than 8MB.`);
      return;
    }
    const img = document.createElement('img');
    img.alt = file.name;
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.readAsDataURL(file);
    thumbs.appendChild(img);
  });
}

// Simple client-side validation + email draft handoff
const form = document.getElementById('orderForm');
const successMsg = document.getElementById('successMsg');

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll('input[required], select[required]').forEach(el => {
    const errorEl = el.parentElement.querySelector('.error');
    if (!el.value) { valid = false; errorEl.textContent = 'This field is required.'; }
    else errorEl.textContent = '';
  });
  if (!valid) return;

  // Build an email body with key fields (images cannot be attached via mailto programmatically).
  const data = new FormData(form);
  const summary = `
Name: ${data.get('name')}
Email: ${data.get('email')}
Phone: ${data.get('phone')}
Event Date: ${data.get('eventDate')}
Hat Type: ${data.get('hatType')}
Head Size: ${data.get('headSize') || 'N/A'}
Colours: ${data.get('colours') || 'N/A'}
Materials: ${data.getAll('materials').join(', ') || 'N/A'}
Notes: ${data.get('notes') || '—'}
  `.trim();

  const mailto = `mailto:orders@jamiehilz.com?subject=${encodeURIComponent('Custom Hat Request')}&body=${encodeURIComponent(summary + '\n\nI will send outfit photos via reply or WhatsApp.')}`;
  successMsg.classList.remove('hidden');
  window.location.href = mailto;
});

// Reference Photo Uploader
const dArea = document.getElementById('dropArea');
const fInput = document.getElementById('fileInput');
const thumbs = document.getElementById('thumbs');
const chooseBtn = document.getElementById('chooseBtn');
if (dArea) {
  const stop = (e)=>{e.preventDefault();e.stopPropagation();};
  ['dragenter','dragover','dragleave','drop'].forEach(ev => dArea.addEventListener(ev, stop));
  dArea.addEventListener('dragover', ()=> dArea.style.background='#fff');
  dArea.addEventListener('dragleave', ()=> dArea.style.background='#fafafa');
  dArea.addEventListener('drop', (e)=>{ dArea.style.background='#fafafa'; fInput.files = e.dataTransfer.files; renderThumbs(); });
}
chooseBtn?.addEventListener('click', ()=> fInput?.click());
fInput?.addEventListener('change', renderThumbs);
function renderThumbs(){
  if (!thumbs || !fInput) return;
  thumbs.innerHTML='';
  [...fInput.files].forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 8*1024*1024) { alert(file.name + ' is larger than 8MB.'); return; }
    const img = document.createElement('img');
    const r = new FileReader();
    r.onload = e => img.src = e.target.result;
    r.readAsDataURL(file);
    thumbs.appendChild(img);
  });
}
