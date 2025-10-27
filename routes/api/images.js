const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../../utils/fileHandler");
const { checkAdmin } = require("../../middleware/auth");

const FILE = "images.json";

// 🟢 GET todas las imágenes
router.get("/", (req, res) => {
  const images = readJSON(FILE, []);
  let changed = false;

  // asignar id si falta
  let nextId = (images.length ? Math.max(...images.map(i => i.id || 0)) : 0) + 1;
  for (let i = 0; i < images.length; i++) {
    if (typeof images[i].id !== 'number') {
      images[i].id = nextId++;
      changed = true;
    }
  }
  if (changed) writeJSON(FILE, images);
  res.json(images);
});


// 🟢 POST - Agregar nueva imagen
router.post("/", checkAdmin, (req, res) => {
  const images = readJSON(FILE, []);

  const newId = images.length
    ? Math.max(...images.map((img) => img.id || 0)) + 1
    : 1;

  const newImage = {
    id: newId,
    src: req.body.src,
    alt: req.body.alt,
  };

  images.push(newImage);
  writeJSON(FILE, images);

  res.status(201).json({
    ok: true,
    message: "Imagen agregada correctamente",
    image: newImage,
  });
});

// 🟡 PUT - Editar imagen existente por ID
router.put("/:id", checkAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const images = readJSON(FILE, []);

  const index = images.findIndex((img) => img.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Imagen no encontrada" });
  }

  images[index] = {
    ...images[index],
    src: req.body.src ?? images[index].src,
    alt: req.body.alt ?? images[index].alt,
  };

  writeJSON(FILE, images);
  res.json({
    ok: true,
    message: "Imagen actualizada correctamente",
    image: images[index],
  });
});

// 🔴 DELETE - Eliminar imagen por ID
router.delete("/:id", checkAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const images = readJSON(FILE, []);

  const index = images.findIndex((img) => img.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Imagen no encontrada" });
  }

  const removed = images.splice(index, 1)[0];
  writeJSON(FILE, images);

  res.json({
    ok: true,
    message: "Imagen eliminada correctamente",
    image: removed,
  });
});

module.exports = router;
