const express = require("express");
const apiDoc = require("apibooks");

const app = express();

// --- ROUTES ---
app.get("/hello", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.post("/user", (req, res) => {
  res.json({ message: "User created" });
});

// --- DOC API (génération automatique et accessible sur /docs) ---
const doc = apiDoc(app, {
  name: "Documentation API",
  endpoint: "/docs" // accessible ici : http://localhost:3000/docs
});

// --- Ajout de documentation ---
doc.requireDocs("/hello", {
  description: "Renvoie un message de bienvenue.",
  responses: {
    "200": `{ "message": "Hello, World!" }`,
    "500": "Erreur serveur"
  }
});

doc.requireDocs("/user", {
  description: "Crée un utilisateur.",
  parameters: [
    { name: "name", type: "string", description: "Nom de l'utilisateur" }
  ],
  responses: {
    "201": `{ "message": "User created" }`,
    "400": "Requête invalide"
  }
});

// --- Lancement du serveur ---
app.listen(3000, () => {
  console.log("✅ Serveur démarré : http://localhost:3000");
  console.log("📚 Documentation : http://localhost:3000/docs");
});
