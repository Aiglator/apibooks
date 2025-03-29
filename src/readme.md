## 📘 Apibooks - Open Source Documentation for Everyone
[![npm version](https://img.shields.io/npm/v/apibooks.svg)](https://www.npmjs.com/package/apibooks)
[![License](https://img.shields.io/npm/l/apibooks)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E=14.0.0-green)](https://nodejs.org/)

**Apibooks** is a lightweight and easy-to-use Express.js module that auto-generates API documentation by capturing route information and developer-submitted specs. It was built to simplify the **UI/UX** of open source backend projects by making documentation accessible and clear.

---

### 🚀 Installation

```bash
npm install apibooks
```

---

### 🔁 Update

```bash
npm install apibooks@latest
```

---

### 🧠 How It Works

Apibooks automatically scans your Express app routes and optionally loads an `openapi.json` file for more detailed documentation. You can also manually attach documentation to your endpoints using `requireDocs()`.

The documentation will be served as an interactive web page at the endpoint of your choice (default is `/docs`).

---

### ✍️ Usage Example

```js
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

// --- DOC API (automatic generation accessible at /docs) ---
const doc = apiDoc(app, {
  name: "Documentation API",
  endpoint: "/docs",
  requireDocs: {
    hotReload: true, // 🚀 Reloads requireDocs when this file changes
    openapi: false   // ❌ Disable OpenAPI file loading
  }
});

// --- Add custom documentation ---
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

// --- Start server ---
app.listen(3000, () => {
  console.log("✅ Serveur démarré : http://localhost:3000");
  console.log("📚 Documentation : http://localhost:3000/docs");
});
```

---

### 📂 Features

- ✅ Auto-detect Express routes
- ✅ Supports OpenAPI JSON files
- ✅ Clean UI with Dark Mode toggle
- ✅ Sidebar navigation of endpoints
- ✅ Expandable endpoint details
- ✅ Easy to integrate and configure
- ✅ Hot reload support for `requireDocs()` (optional)

---

### 📌 Options

| Option                   | Type      | Default         | Description                                          |
|--------------------------|-----------|------------------|------------------------------------------------------|
| `endpoint`               | `string`  | `/docs`          | URL path where the documentation appears            |
| `name`                   | `string`  | `Documentation API` | Title shown at the top                        |
| `openapi`                | `string`  | `openapi.json`   | Path to OpenAPI file (if available)                 |
| `requireDocs.hotReload` | `boolean` | `false`          | Enable hot reload of `requireDocs()` blocks         |
| `requireDocs.autoload`  | `boolean` | `false`          | Use in-code callback-based reload (slower fallback) |

---

### ❤️ Contribution

This project is open-source and made for the community. Feel free to submit issues, pull requests, or ideas!

---

### 📃 License

MIT

---

💡 **Are you using apibooks?**  
Support the project by [⭐️ starring the repo](https://github.com/Aiglator/apibooks) — it means a lot!

---

Happy documenting! ✨

