const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { readJSON, writeJSON } = require("../../utils/fileHandler");
const { checkAdmin } = require("../../middleware/auth");

const FILE = "images.json";
const uploadDir = path.join(__dirname, "../../public/uploads/gallery");

// Crear carpeta si no existe
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const upload = multer({ storage });

// === GET todas las imágenes ===
router.get("/", (req, res) => {
  const images = readJSON(FILE, []);
  res.json(images);
});

// === POST: agregar imagen (url externa o archivo local) ===
router.post("/", checkAdmin, upload.single("file"), (req, res) => {
  const images = readJSON(FILE, []);
  const newId = images.length
    ? Math.max(...images.map((img) => img.id || 0)) + 1
    : 1;

  let src = req.body.src;
  let alt = req.body.alt;

  // Si se subió un archivo, usar su ruta pública
  if (req.file) {
    const relativePath = `/uploads/gallery/${req.file.filename}`;
    src = relativePath;
  }

  if (!src) {
    return res.status(400).json({ error: "Debe enviar una URL o un archivo" });
  }

  const newImage = { id: newId, src, alt };
  images.push(newImage);
  writeJSON(FILE, images);

  res.status(201).json({ ok: true, message: "Imagen agregada", image: newImage });
});

// === PUT: editar ===
router.put("/:id", checkAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const images = readJSON(FILE, []);
  const index = images.findIndex((img) => img.id === id);
  if (index === -1) return res.status(404).json({ error: "Imagen no encontrada" });

  images[index] = {
    ...images[index],
    src: req.body.src ?? images[index].src,
    alt: req.body.alt ?? images[index].alt,
  };

  writeJSON(FILE, images);
  res.json({ ok: true, message: "Imagen actualizada", image: images[index] });
});

// === DELETE: eliminar ===
router.delete("/:id", checkAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const images = readJSON(FILE, []);
  const index = images.findIndex((img) => img.id === id);
  if (index === -1) return res.status(404).json({ error: "Imagen no encontrada" });

  const removed = images.splice(index, 1)[0];
  writeJSON(FILE, images);

  // Si era una imagen local, eliminar el archivo físico
  if (removed.src && removed.src.startsWith("/uploads/")) {
    const filePath = path.join(__dirname, "../../public", removed.src);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  res.json({ ok: true, message: "Imagen eliminada", image: removed });
});

module.exports = router;
