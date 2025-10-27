const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../../utils/fileHandler");
const { checkAdmin } = require("../../middleware/auth");

router.get("/", checkAdmin, (req, res) => res.json(readJSON("services.json")));

router.post("/", checkAdmin, (req, res) => {
	const current = readJSON("services.json") || [];
	current.push(req.body);
	writeJSON("services.json", current);
	res.status(201).json({ message: "Servicio agregado", data: req.body });
});

router.put("/:index", checkAdmin, (req, res) => {
	const current = readJSON("services.json") || [];
	const index = parseInt(req.params.index);
	if (index < 0 || index >= current.length)
		return res.status(404).json({ error: "No encontrado" });

	current[index] = req.body;
	writeJSON("services.json", current);
	res.json({ message: "Servicio actualizado", data: current[index] });
});

router.delete("/:index", checkAdmin, (req, res) => {
	const current = readJSON("services.json") || [];
	const index = parseInt(req.params.index);
	if (index < 0 || index >= current.length)
		return res.status(404).json({ error: "No encontrado" });

	const removed = current.splice(index, 1);
	writeJSON("services.json", current);
	res.json({ message: "Servicio eliminado", data: removed[0] });
});

module.exports = router;
