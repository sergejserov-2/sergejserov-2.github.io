export class UIState {
 constructor() {
  this.screen = "loading"; 
  // loading | round | result | transition

  this.listeners = [];
 }

 setScreen(screen) {
  const prev = this.screen;
  this.screen = screen;

  if (prev !== screen) {
   this.listeners.forEach(fn =>
    fn({ from: prev, to: screen })
   );
  }
 }

 getScreen() {
  return this.screen;
 }

 is(screen) {
  return this.screen === screen;
 }

 onChange(fn) {
  this.listeners.push(fn);
 }
}
