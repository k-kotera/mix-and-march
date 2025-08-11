// Simple screen manager
export const Screens = {
  current: 'title',
  show(id){
    for(const s of document.querySelectorAll('[data-screen]')){
      s.hidden = s.id !== `screen-${id}`;
    }
    this.current = id;
  }
};
