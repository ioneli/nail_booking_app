// functie categorie din nume
function extractCategory(filename) {
  return filename
    .toLowerCase()
    .split(".")[0]
    .replace(/[0-9]/g, "") // scoate numerele
    .trim(); // IMPORTANT: NU scoatem "-"
}
module.exports = { extractCategory };
