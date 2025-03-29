const express = require("express");
const apiDoc = require("./src/index.js");
const app = express();

app.use(express.json());

// --- ROUTES définies manuellement ---
app.get("/hello", (req, res) => {
  res.status(200).json({ message: "Hello, World!" });
});

app.post("/usere", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Le nom est requis" });
  }
  res.status(201).json({ message: "User created", name });
});

// --- Initialisation de la documentation ---
const doc = apiDoc(app, {
  name: "Documentation API",
  endpoint: "/docse",
  requireDocs: {
    hotReload: true,   // ✅ Hot reload ciblé sur requireDocs()
    openapi: false     // ❌ Pas de chargement automatique du fichier openapi.json
  }
});

// --- Enregistrement des docs ---
doc.requireDocs("/hello", {
  description: "Renvoiel un message de bienvenue.",
  responses: {
    "200": `{ "message": "Hello, World!" }`,
    "500": "Erreur serveur"
  }
});

doc.requireDocs("/user", {
  description: "Crée un utilisateur.",
  parameters: [
    {
      name: "name",
      type: "string",
      description: "Nom de l'utilisateur",
      required: true
    }
  ],
  responses: {
    "201": `{ "message": "User created", "name": "John" }`,
    "400": `{ "error": "Le nom est requis" }`
  }
});

// --- Démarrage du serveur ---
app.listen(3000, () => {
  console.log("✅ Serveur démarré : http://localhost:3000");
  console.log("📚 Documentation : http://localhost:3000/docse");
});
