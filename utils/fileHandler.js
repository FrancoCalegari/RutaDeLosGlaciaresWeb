const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "public", "data");

function readJSON(fileName, defaultValue = []) {
	try {
		const raw = fs.readFileSync(path.join(dataDir, fileName), "utf-8");
		return JSON.parse(raw);
	} catch (err) {
		console.error(`Error leyendo ${fileName}:`, err);
		return defaultValue;
	}
}

function writeJSON(fileName, data) {
	try {
		fs.writeFileSync(
			path.join(dataDir, fileName),
			JSON.stringify(data, null, 2)
		);
	} catch (err) {
		console.error(`Error escribiendo ${fileName}:`, err);
	}
}

module.exports = { readJSON, writeJSON, dataDir };
