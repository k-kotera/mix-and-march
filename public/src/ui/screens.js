// Screen manager using .active class (robust even if 'hidden' is ignored)
export const Screens = {
  current: 'title',
  show(id){
    const wanted = `screen-${id}`;
    document.querySelectorAll('[data-screen]').forEach(s=>{
      if(s.id===wanted){ s.classList.add('active'); s.removeAttribute('hidden'); }
      else { s.classList.remove('active'); s.setAttribute('hidden',''); }
    });
    this.current = id;
  }
};
