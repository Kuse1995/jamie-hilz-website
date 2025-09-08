//
// Client-side interactions for Jamie Hilz Hats & Things website
//

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('reference');
  const previewContainer = document.getElementById('preview');
  const form = document.getElementById('order-form');

  // Show a preview of selected image(s)
  fileInput?.addEventListener('change', event => {
    const files = event.target.files;
    previewContainer.innerHTML = '';
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);
        previewContainer.appendChild(img);
      });
    }
  });

  // Handle form submission. In a production site this would send data to a server.
  form?.addEventListener('submit', event => {
    event.preventDefault();
    // Basic validation could be added here
    alert(
      'Thank you for your request! We will review your submission and get back to you shortly.'
    );
    form.reset();
    previewContainer.innerHTML = '';
  });
});