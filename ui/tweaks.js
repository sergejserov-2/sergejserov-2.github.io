const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (
        node.nodeType === 1 &&
        node.tagName !== "CANVAS" &&
        node.tagName !== "IFRAME" &&
        node.children.length === 0 &&
        node.textContent.includes("For development purposes only")
      ) {
        node.style.display = "none";
      }
    });
  });
});
  
const observer2 = new MutationObserver(() => {
  const el = document.querySelector('.mapsImagerySceneScene__root.widget-scene');

  if (el) {
    el.style.filter = 'invert(1)';
  }
});

export class Tweaks() {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  observer2.observe(document.body, {
    childList: true,
    subtree: true
  });
}
