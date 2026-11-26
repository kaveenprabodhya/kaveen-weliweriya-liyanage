const menu=document.querySelector('.menu'), links=document.querySelector('.navlinks');
menu.addEventListener('click',()=>{const open=links.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
links.addEventListener('click',e=>{if(e.target.matches('a')){links.classList.remove('open');menu.setAttribute('aria-expanded','false');}});
const nav=[...links.querySelectorAll('a')];
function highlight(){let current='home';for(const a of nav){const el=document.querySelector(a.hash);if(el&&el.getBoundingClientRect().top<=125)current=el.id;}if(window.scrollY+innerHeight>=document.documentElement.scrollHeight-10)current='contact';nav.forEach(a=>{const active=a.hash==='#'+current;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
window.addEventListener('scroll',highlight,{passive:true});highlight();
const photo=document.querySelector('#profile-photo');
const placeholder=document.querySelector('.profile-placeholder');
photo.addEventListener('load',()=>{photo.hidden=false;placeholder.hidden=true;});
photo.addEventListener('error',()=>{photo.hidden=true;placeholder.hidden=false;});
photo.src=photo.dataset.src;
