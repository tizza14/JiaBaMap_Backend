const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "swagger-output.json");

const defaultDocument = {
  swagger: "2.0",
  info: {
    title: "JiabaMap Backend API",
    description:
      "This is the API document of JiabaMap API which conforms to OpenAPI and rendered by Swagger UI.",
    version: "1.0.0",
  },
  host: "localhost:3200",
  basePath: "/",
  schemes: ["http"],
  paths: {},
};

let document = defaultDocument;

if (fs.existsSync(outputPath)) {
  document = JSON.parse(fs.readFileSync(outputPath, "utf8"));
}

document.host = document.host || defaultDocument.host;
document.basePath = document.basePath || defaultDocument.basePath;
document.schemes =
  document.schemes && document.schemes.length
    ? document.schemes
    : defaultDocument.schemes;
document.info = {
  ...defaultDocument.info,
  ...document.info,
};
document.paths = document.paths || {};

fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Swagger document is ready: ${outputPath}`);
