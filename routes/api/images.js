const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../../utils/fileHandler");
const { checkAdmin } = require("../../middleware/auth");

const FILE = "images.json";

// GET todas las imágenes
router.get("/", (req, res) => {
  const images = readJSON(FILE, []);
  res.json(images);
});

// POST nueva imagen
router.post("/", checkAdmin, (req, res) => {
  const images = readJSON(FILE, []);
  const newImage = {
    id: images.length ? (images[images.length - 1].id || images.length) + 1 : 1,
    src: req.body.src,
    alt: req.body.alt,
  };
  images.push(newImage);
  writeJSON(FILE, images);
  res.status(201).json({ ok: true, message: "Imagen agregada", image: newImage });
});

// PUT editar imagen
router.put("/:id", checkAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const images = readJSON(FILE, []);
  const index = images.findIndex((img) => img.id === id);
  if (index === -1) return res.status(404).json({ error: "Imagen no encontrada" });

  images[index] = { ...images[index], ...req.body };
  writeJSON(FILE, images);
  res.json({ ok: true, message: "Imagen actualizada", image: images[index] });
});

// DELETE eliminar imagen
router.delete("/:id", checkAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const images = readJSON(FILE, []);
  const index = images.findIndex((img) => img.id === id);
  if (index === -1) return res.status(404).json({ error: "Imagen no encontrada" });

  const removed = images.splice(index, 1)[0];
  writeJSON(FILE, images);
  res.json({ ok: true, message: "Imagen eliminada", image: removed });
});

module.exports = router;
