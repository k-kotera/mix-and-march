// Robust screen toggler: toggles .active only
export const Screens = {
  current: 'title',
  show(id){
    const target = `screen-${id}`;
    document.querySelectorAll('[data-screen]').forEach(s=>{
      s.classList.toggle('active', s.id===target);
    });
    this.current = id;
  }
};
