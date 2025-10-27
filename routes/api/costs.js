const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../../utils/fileHandler");
const { checkAdmin } = require("../../middleware/auth");

const FILE = "costs.json";

router.get("/", checkAdmin, (req, res) => {
	const current = readJSON(FILE, { title: "Costos", items: [] });
	res.json(current);
});

router.post("/", checkAdmin, (req, res) => {
	const current = readJSON(FILE, { title: "Costos", items: [] });
	if (req.body.item) current.items.push(req.body.item);
	if (req.body.title) current.title = req.body.title;
	writeJSON(FILE, current);
	res.status(201).json({ message: "Costo agregado", data: current });
});

router.put("/:index", checkAdmin, (req, res) => {
	const index = parseInt(req.params.index);
	const current = readJSON(FILE, { title: "Costos", items: [] });
	if (index < 0 || index >= current.items.length)
		return res.status(404).json({ error: "No encontrado" });
	if (req.body.value) current.items[index] = req.body.value;
	writeJSON(FILE, current);
	res.json({ message: "Costo actualizado", data: current.items[index] });
});

router.delete("/:index", checkAdmin, (req, res) => {
	const index = parseInt(req.params.index);
	const current = readJSON(FILE, { title: "Costos", items: [] });
	if (index < 0 || index >= current.items.length)
		return res.status(404).json({ error: "No encontrado" });
	const removed = current.items.splice(index, 1);
	writeJSON(FILE, current);
	res.json({ message: "Costo eliminado", data: removed[0] });
});

module.exports = router;
