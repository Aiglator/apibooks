const express = require("express");
const path = require("path");

class ExpressApiDoc {
  constructor(app) {
    if (!app) {
      throw new Error("⚠️ Erreur : Une instance d'Express est requise !");
    }

    this.app = app;
    this.routes = [];
    this.docs = {};

    this._hookRoutes();
    this.serveDocumentation();
  }

  requireDocs(endpoint, specifications) {
    this.docs[endpoint] = specifications;
  }

  _hookRoutes() {
    const originalRouter = this.app._router;

    if (!originalRouter) {
      console.warn("⚠️ Aucune route définie dans Express au moment de l'initialisation.");
      return;
    }

    originalRouter.stack.forEach((middleware) => {
      if (middleware.route) {
        const routePath = middleware.route.path;
        const methods = Object.keys(middleware.route.methods).map((m) => m.toUpperCase());
        this.routes.push({ path: routePath, methods });
      }
    });
  }

  generateHTML() {
    let html = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documentation API</title>
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
        <div class="sidebar">
          <h1>📌 Documentation API</h1>
          <ul>
    `;

    this.routes.forEach((route) => {
      html += `<li data-path="${route.path}">${route.path}</li>`;
    });

    html += `
          </ul>
          <button id="darkModeToggle">🌙 Mode Sombre</button>
        </div>
        <div class="main-content">
          <h2>Endpoints</h2>
          <div class="routes">
    `;

    this.routes.forEach((route) => {
      const safeId = route.path.replace(/\//g, '_').replace(/:/g, '_');
      const doc = this.docs[route.path] || { description: "Aucune documentation fournie." };

      html += `
      <div class="route" data-path="${route.path}">
        <span class="methods">${route.methods.join(" | ")}</span>
        <span class="path">${route.path}</span>
        <div class="details hidden" id="${safeId}">
          <p><strong>Description :</strong> ${doc.description}</p>
      `;

      if (doc.parameters) {
        html += `<p><strong>Paramètres :</strong></p><ul>`;
        doc.parameters.forEach(param => {
          html += `<li><strong>${param.name}</strong> (${param.type}) - ${param.description}</li>`;
        });
        html += `</ul>`;
      }

      if (doc.responses) {
        html += `<p><strong>Réponses possibles :</strong></p><ul>`;
        Object.keys(doc.responses).forEach(code => {
          html += `<li><strong>${code} :</strong> <pre><code>${doc.responses[code]}</code></pre></li>`;
        });
        html += `</ul>`;
      }

      html += `</div></div>`;
    });

    html += `</div></div>
        <script src="script.js"></script>
      </body>
    </html>
    `;
    return html;
  }

  serveDocumentation() {
    this.app.get("/api-docs", (req, res) => {
      res.send(this.generateHTML());
    });

    // 📌 Correction : charge les fichiers statiques depuis le même dossier que `index.js`
    this.app.use("/api-docs", express.static(path.join(__dirname)));
  }
}

module.exports = (app) => new ExpressApiDoc(app);
