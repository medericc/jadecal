self.addEventListener("install", (event) => {
  console.log("Service Worker installé");
});

self.addEventListener("fetch", (event) => {
  // Tu peux ajouter ici du cache plus tard si tu veux
});
