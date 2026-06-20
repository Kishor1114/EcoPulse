// Copies non-TypeScript build assets (currently just the SQL schema) into
// dist/ after compilation. A plain Node script keeps this portable across
// platforms without adding a dependency like cpx or rimraf.
const fs = require("fs");
const path = require("path");

const copies = [{ from: "src/db/schema.sql", to: "dist/db/schema.sql" }];

for (const { from, to } of copies) {
  const destDir = path.dirname(to);
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`Copied ${from} -> ${to}`);
}
