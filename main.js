import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const menuDropdown = document.getElementById('menuDropdown');
  const emailBtn = document.getElementById('emailBtn');
  const googleBtn = document.getElementById('googleBtn');
  const phoneBtn = document.getElementById('phoneBtn');

  const emailModal = document.getElementById('emailModal');
  const phoneModal = document.getElementById('phoneModal');
  const googleModal = document.getElementById('googleModal');

  const closeEmailModal = document.getElementById('closeEmailModal');
  const closePhoneModal = document.getElementById('closePhoneModal');
  const closeGoogleModal = document.getElementById('closeGoogleModal');

  const emailForm = document.getElementById('emailForm');
  const phoneForm = document.getElementById('phoneForm');
  const googleContinue = document.getElementById('googleContinue');

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!menuDropdown.contains(e.target) && !menuBtn.contains(e.target)) {
      menuDropdown.classList.remove('active');
    }
  });

  emailBtn.addEventListener('click', () => {
    emailModal.classList.add('active');
  });

  googleBtn.addEventListener('click', () => {
    googleModal.classList.add('active');
  });

  phoneBtn.addEventListener('click', () => {
    phoneModal.classList.add('active');
  });

  closeEmailModal.addEventListener('click', () => {
    emailModal.classList.remove('active');
  });

  closePhoneModal.addEventListener('click', () => {
    phoneModal.classList.remove('active');
  });

  closeGoogleModal.addEventListener('click', () => {
    googleModal.classList.remove('active');
  });

  emailModal.addEventListener('click', (e) => {
    if (e.target === emailModal) {
      emailModal.classList.remove('active');
    }
  });

  phoneModal.addEventListener('click', (e) => {
    if (e.target === phoneModal) {
      phoneModal.classList.remove('active');
    }
  });

  googleModal.addEventListener('click', (e) => {
    if (e.target === googleModal) {
      googleModal.classList.remove('active');
    }
  });

  emailForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailForm.querySelector('input[type="email"]').value;
    const password = emailForm.querySelector('input[type="password"]').value;

    if (password.length < 8 || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      alert('Password must be at least 8 characters long and include a number and a special character');
      return;
    }

    console.log('Email login:', email, password);
    alert('Email login successful! Welcome to Tango.');
    emailModal.classList.remove('active');
  });

  phoneForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = phoneForm.querySelector('input[type="tel"]').value;

    if (!phone || phone.trim() === '') {
      alert('Please enter a valid phone number');
      return;
    }

    console.log('Phone login:', phone);
    alert('Verification code sent! Check your phone.');
    phoneModal.classList.remove('active');
  });

  googleContinue.addEventListener('click', () => {
    console.log('Google login initiated');
    alert('Google login successful! Welcome to Tango.');
    googleModal.classList.remove('active');
  });

  const livestreamCards = document.querySelectorAll('.livestream-card');
  livestreamCards.forEach(card => {
    card.addEventListener('click', () => {
      alert('Livestream feature coming soon!');
    });
  });

  const carousel = document.querySelector('.livestream-carousel');
  let isDown = false;
  let startX;
  let scrollLeft;

  carousel.addEventListener('mousedown', (e) => {
    isDown = true;
    carousel.style.cursor = 'grabbing';
    startX = e.pageX - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
  });

  carousel.addEventListener('mouseleave', () => {
    isDown = false;
    carousel.style.cursor = 'grab';
  });

  carousel.addEventListener('mouseup', () => {
    isDown = false;
    carousel.style.cursor = 'grab';
  });

  carousel.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carousel.offsetLeft;
    const walk = (x - startX) * 2;
    carousel.scrollLeft = scrollLeft - walk;
  });
});
