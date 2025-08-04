AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: true
});

const burger = document.querySelector('.burger');
  const navLinks = document.querySelector('.nav-links');

  burger.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });