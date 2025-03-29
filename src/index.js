const express = require("express");
const path = require("path");
const fs = require("fs");

class ExpressApiDoc {
  constructor(app, options = {}) {
    this.app = app;
    this.routes = [];
    this.docs = {};
    this._docsCallbacks = [];
    this._reloadQueue = false;

    this.options = options;
    this.endpoint = options.endpoint || "/docs";
    this.name = options.name || "Documentation API";
    this.openapiPath = options.openapi || path.join(process.cwd(), "openapi.json");

    this._hookRoutes(app._router);

    if (this.options.requireDocs?.openapi !== false) {
      this.loadFromOpenApi(this.openapiPath);
    }

    this.serveDocumentation();

    if (options.requireDocs?.autoload) {
      this._setupFastWatchers();
    }

    if (options.requireDocs?.hotReload) {
      this._startHotReload();
    }
  }

  requireDocs(endpoint, methodOrSpec, maybeSpec) {
    const method = typeof methodOrSpec === "string" ? methodOrSpec.toUpperCase() : null;
    const spec = method ? maybeSpec : methodOrSpec;
    const normalizedPath = this._normalizePath(endpoint);

    if (!this.docs[normalizedPath]) this.docs[normalizedPath] = {};
    if (method) this.docs[normalizedPath][method] = spec;
    else this.docs[normalizedPath]["ALL"] = spec;

    if (this.options.requireDocs?.autoload) {
      this._docsCallbacks.push(() => {
        if (!this.docs[normalizedPath]) this.docs[normalizedPath] = {};
        if (method) this.docs[normalizedPath][method] = spec;
        else this.docs[normalizedPath]["ALL"] = spec;
      });
    }
  }

  async loadFromOpenApi(openApiPath) {
    if (!fs.existsSync(openApiPath)) return;
    try {
      const raw = await fs.promises.readFile(openApiPath, "utf8");
      const spec = JSON.parse(raw);
      if (!spec.paths) return;

      Object.entries(spec.paths).forEach(([path, methods]) => {
        const normalizedPath = this._normalizePath(path);
        Object.entries(methods).forEach(([method, data]) => {
          const upperMethod = method.toUpperCase();
          const parameters = (data.parameters || []).map(p => ({
            name: p.name,
            type: p.schema?.type || "string",
            description: p.description || ""
          }));
          const responses = {};
          if (data.responses) {
            Object.entries(data.responses).forEach(([code, res]) => {
              responses[code] = typeof res === "string"
                ? res
                : res.description || JSON.stringify(res.content || {}, null, 2);
            });
          }
          this.requireDocs(normalizedPath, upperMethod, {
            description: data.description || "Aucune description",
            parameters,
            responses
          });
        });
      });
    } catch (err) {
      console.error("[apibooks] ❌ Erreur chargement openapi.json:", err.message);
    }
  }

  _hookRoutes(router, prefix = "") {
    if (!router || !router.stack) return;
    router.stack.forEach((layer) => {
      if (layer.route) {
        const fullPath = this._normalizePath(prefix + layer.route.path);
        const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
        this.routes.push({ path: fullPath, methods });
      } else if (layer.name === "router" && layer.handle.stack) {
        const pathFromRegexp = this._extractPathFromRegexp(layer.regexp);
        const newPrefix = this._normalizePath(prefix + "/" + pathFromRegexp);
        this._hookRoutes(layer.handle, newPrefix);
      }
    });
  }

  _extractPathFromRegexp(regexp) {
    const match = regexp?.source?.match(/\\\/([^\\]+)\\?\??/);
    return match ? `/${match[1]}` : "";
  }

  _normalizePath(pathStr) {
    return pathStr.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  }

  generateHTML() {
    let html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${this.name}</title>
      <link rel="stylesheet" href="${this.endpoint}/output.css">
    </head>
    <body>
      <button id="toggleSidebar" class="hamburger" aria-label="Menu">&#9776;</button>
      <div class="sidebar">
        <h1>📌 ${this.name}</h1>
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
      const safeId = route.path.replace(/\//g, "_").replace(/:/g, "_");
      html += `<div class="route" data-path="${route.path}">
        <span class="methods">${route.methods.join(" | ")}</span>
        <span class="path">${route.path}</span>
        <div class="details hidden" id="${safeId}">`;

      route.methods.forEach((method) => {
        const doc = this.docs[route.path]?.[method] || this.docs[route.path]?.["ALL"] || {
          description: "Aucune documentation fournie.",
        };

        html += `<h3>${method}</h3>`;
        html += `<p><strong>Description :</strong> ${doc.description}</p>`;

        if (doc.parameters?.length) {
          html += `<p><strong>Paramètres :</strong></p><ul>`;
          doc.parameters.forEach((param) => {
            html += `<li><strong>${param.name}</strong> (${param.type}) - ${param.description}</li>`;
          });
          html += `</ul>`;
        }

        if (doc.responses && typeof doc.responses === "object") {
          html += `<p><strong>Réponses possibles :</strong></p><ul>`;
          Object.entries(doc.responses).forEach(([code, message]) => {
            html += `<li><strong>${code} :</strong><pre><code>${message}</code></pre></li>`;
          });
          html += `</ul>`;
        }
      });

      html += `</div></div>`;
    });

    html += `
        </div>
      </div>
      <script src="${this.endpoint}/script.js"></script>
    </body>
    </html>
    `;

    return html;
  }

  serveDocumentation() {
    this.app.get(this.endpoint, (req, res) => {
      res.send(this.generateHTML());
    });

    this.app.use(this.endpoint, express.static(path.join(__dirname)));
  }

  _startHotReload() {
    const target = process.argv[1];
    console.log("[apibooks] 🧪 Watching file:", target);

    const reload = async () => {
      console.log("[apibooks] 🔁 Reload déclenché...");
      try {
        const raw = await fs.promises.readFile(target, "utf8");
        const matches = [...raw.matchAll(/doc\.requireDocs\(([\s\S]*?)\);/g)];
        const blocks = matches.map(m => m[0]);

        console.log(`[apibooks] 📦 Blocs détectés : ${blocks.length}`);

        this.docs = {};

        for (let code of blocks) {
          try {
            code = code.replace(/doc\./g, "this."); // remplace doc.requireDocs() par this.requireDocs()
            eval(code);
          } catch (err) {
            console.warn("[apibooks] ⚠️ Erreur d’exécution dans requireDocs:", err.message);
          }
        }

        console.log(`[apibooks] ✅ ${blocks.length} bloc(s) requireDocs rechargé(s).`);
      } catch (err) {
        console.error("[apibooks] ❌ Erreur lecture fichier :", err.message);
      }
    };

    if (fs.existsSync(target)) {
      console.log("[apibooks] 👀 Watch activé !");
      fs.watch(target, { persistent: true }, () => reload());
    } else {
      console.warn("[apibooks] ❌ Fichier introuvable pour le hot reload.");
    }
  }

  _setupFastWatchers() {
    const targetFile = path.join(process.cwd(), process.argv[1]);
    const openapiFile = this.openapiPath;

    const reload = async (source) => {
      if (this._reloadQueue) return;
      this._reloadQueue = true;

      setTimeout(async () => {
        this.docs = {};

        if (this.options.requireDocs?.openapi !== false && fs.existsSync(openapiFile)) {
          await this.loadFromOpenApi(openapiFile);
        }

        for (const callback of this._docsCallbacks) {
          try {
            callback();
          } catch (err) {
            console.error("[apibooks] ❌ Erreur requireDocs:", err);
          }
        }

        console.log(`[apibooks] 🔄 Reload déclenché (${source}) ✔`);
        this._reloadQueue = false;
      }, 100);
    };

    if (fs.existsSync(targetFile)) {
      fs.watch(targetFile, () => reload("server.js"));
    }

    if (this.options.requireDocs?.openapi !== false && fs.existsSync(openapiFile)) {
      fs.watch(openapiFile, () => reload("openapi.json"));
    }
  }
}

module.exports = (app, options = {}) => {
  return new ExpressApiDoc(app, options);
};
