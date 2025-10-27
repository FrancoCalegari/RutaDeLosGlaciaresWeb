const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../../utils/fileHandler");
const { checkAdmin } = require("../../middleware/auth");

const FILE = "productos.json";

router.get("/", (req, res) => res.json(readJSON(FILE)));

router.post("/", checkAdmin, (req, res) => {
	const productos = readJSON(FILE);
	const newProducto = {
		id: productos.length ? productos[productos.length - 1].id + 1 : 1,
		...req.body,
	};
	productos.push(newProducto);
	writeJSON(FILE, productos);
	res.json({ ok: true, producto: newProducto });
});

router.put("/:id", checkAdmin, (req, res) => {
	const productos = readJSON(FILE);
	const id = parseInt(req.params.id);
	const index = productos.findIndex((p) => p.id === id);
	if (index === -1) return res.status(404).json({ error: "Producto no encontrado" });

	productos[index] = { ...productos[index], ...req.body };
	writeJSON(FILE, productos);
	res.json({ ok: true, producto: productos[index] });
});

router.delete("/:id", checkAdmin, (req, res) => {
	const productos = readJSON(FILE);
	const id = parseInt(req.params.id);
	const index = productos.findIndex((p) => p.id === id);
	if (index === -1) return res.status(404).json({ error: "Producto no encontrado" });

	const eliminado = productos.splice(index, 1)[0];
	writeJSON(FILE, productos);
	res.json({ ok: true, producto: eliminado });
});

module.exports = router;
