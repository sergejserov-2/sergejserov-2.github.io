export class UIState {
 constructor() {
  this.screen = "loading"; 
  // loading | round | result
 }

 setScreen(screen) {
  this.screen = screen;
 }

 getScreen() {
  return this.screen;
 }
}
