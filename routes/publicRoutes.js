const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

router.get("/", (req, res) => {
	const dataDir = path.join(__dirname, "..", "public", "data");

	const readJSON = (file) => {
		try {
			const data = fs.readFileSync(path.join(dataDir, file), "utf-8");
			return JSON.parse(data);
		} catch (err) {
			console.error(`Error al leer ${file}:`, err);
			return null;
		}
	};

	const images = readJSON("images.json") || [];
	const summary = readJSON("summary.json") || {};
	const services = readJSON("services.json") || [];
	const advantages = readJSON("advantages.json") || {};
	const costs = readJSON("costs.json") || {};
	const background = readJSON("background.json") || {};
	const products = readJSON("productos.json") || [];

	res.render("index", {
		title: "Inicio",
		images,
		summary,
		services,
		advantages,
		costs,
		background,
		products,
	});
});

module.exports = router;
