const express = require("express");
const apiDoc = require("./src/index");

const app = express();

// Define routes
app.get("/hello", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.post("/user", (req, res) => {
  res.json({ message: "Utilisateur créé" });
});

// Initialize documentation after routes are defined
const doc = apiDoc(app);

doc.requireDocs("/hello", {
  description: "Renvoie un message de bienvenue.",
  responses: {
    "200": `{
      "message": "Hello, World!"
    }`,
    "500": "Erreur serveur"
  }
});

doc.requireDocs("/user", {
  description: "Crée un nouvel utilisateur.",
  parameters: [{ name: "name", type: "string", description: "Nom de l'utilisateur" }],
  responses: {
    "201": `{
      "message": "Utilisateur créé"
    }`,
    "400": "Mauvaise requête"
  }
});

app.listen(3000, () => console.log("Serveur sur http://localhost:3000/api-docs"));
