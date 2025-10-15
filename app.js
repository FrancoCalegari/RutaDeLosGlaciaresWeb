const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret_key_admin',
    resave: false,
    saveUninitialized: false
}));

// Configuración EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Simulación de login admin
const ADMIN_USER = { username: 'admin', password: 'admin123' };

function checkAdmin(req, res, next) {
    if (req.session && req.session.user === ADMIN_USER.username) {
        return next();
    }
    res.redirect('/login');

}

const readJSONFile = (fileName, defaultValue) => {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'public', 'data', fileName), 'utf-8');
    const data = JSON.parse(raw);
    return data || defaultValue;
  } catch (err) {
    console.error(`Error leyendo ${fileName}:`, err);
    return defaultValue;
  }
};

// JSON con imágenes
const imagesFile = path.join(__dirname, 'public','data', 'images.json');

// Rutas

// Index público
app.get('/', (req, res) => {
  const dataDir = path.join(__dirname, 'public', 'data');
  const readJSON = (file) => {
    try {
      const data = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error al leer ${file}:`, err);
      return null;
    }
  };

  const images = readJSON('images.json') || [];
  const summary = readJSON('summary.json') || {};
  const services = readJSON('services.json') || [];
  const advantages = readJSON('advantages.json') || {};
  const costs = readJSON('costs.json') || {};
  const background = readJSON('background.json') || {};

  res.render('index', {
    title: 'Inicio',
    images,
    summary,
    services,
    advantages,
    costs,
    background
  });
});




// Login admin
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

// Para admin
app.get('/admin', checkAdmin, (req, res) => {
  const basePath = path.join(__dirname, 'public', 'data');

  const images = readJSONFile('images.json', []);
  const background = readJSONFile('background.json', {});
  const summary = readJSONFile('summary.json', {});
  
  // Validar que sean arrays
  const servicesRaw = readJSONFile('services.json', []);
  const services = Array.isArray(servicesRaw) ? servicesRaw : [];

  const advantagesRaw = readJSONFile('advantages.json', { title: '', items: [] });
  const advantages = {
    title: advantagesRaw.title || '',
    items: Array.isArray(advantagesRaw.items) ? advantagesRaw.items : []
  };

  const costsRaw = readJSONFile('costs.json', { title: '', items: [] });
  const costs = {
    title: costsRaw.title || '',
    items: Array.isArray(costsRaw.items) ? costsRaw.items : []
  };

  res.render('admin', { title: 'Dashboard', images, background, summary, services, advantages, costs });
});

// ===============================
// API para editar JSON desde admin
// ===============================
const dataDir = path.join(__dirname, 'public', 'data');

// Helper para leer/escribir JSON
function readJSON(file) {
  const filePath = path.join(dataDir, file);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data, null, 2));
}

// ---- SERVICES ----
app.get('/api/services', checkAdmin, (req, res) => {
  res.json(readJSON('services.json'));
});

app.post('/api/services', checkAdmin, (req, res) => {
  const current = readJSON('services.json') || [];
  const newItem = req.body; // { title, content }
  current.push(newItem);
  writeJSON('services.json', current);
  res.status(201).json({ message: 'Servicio agregado', data: newItem });
});

app.put('/api/services/:index', checkAdmin, (req, res) => {
  const index = parseInt(req.params.index);
  const current = readJSON('services.json') || [];
  if (index < 0 || index >= current.length) return res.status(404).json({ error: 'No encontrado' });

  current[index] = req.body; // { title, content }
  writeJSON('services.json', current);
  res.json({ message: 'Servicio actualizado', data: current[index] });
});

app.delete('/api/services/:index', checkAdmin, (req, res) => {
  const index = parseInt(req.params.index);
  const current = readJSON('services.json') || [];
  if (index < 0 || index >= current.length) return res.status(404).json({ error: 'No encontrado' });

  const removed = current.splice(index, 1);
  writeJSON('services.json', current);
  res.json({ message: 'Servicio eliminado', data: removed[0] });
});


// ---- ADVANTAGES ----
app.get('/api/advantages', checkAdmin, (req, res) => {
  const current = readJSON('advantages.json') || { title: 'Ventajas', items: [] };
  // asegurar que items es array
  if (!Array.isArray(current.items)) current.items = [];
  res.json(current);
});

app.post('/api/advantages', checkAdmin, (req, res) => {
  const current = readJSON('advantages.json') || { title: 'Ventajas', items: [] };
  if (!Array.isArray(current.items)) current.items = [];
  current.items.push(req.body); // { strong, text }
  writeJSON('advantages.json', current);
  res.status(201).json({ message: 'Ventaja agregada', data: req.body });
});

app.put('/api/advantages/:index', checkAdmin, (req, res) => {
  const index = parseInt(req.params.index);
  const current = readJSON('advantages.json') || { title: 'Ventajas', items: [] };
  if (!Array.isArray(current.items)) current.items = [];
  if (index < 0 || index >= current.items.length) return res.status(404).json({ error: 'No encontrado' });

  current.items[index] = req.body; // { strong, text }
  writeJSON('advantages.json', current);
  res.json({ message: 'Ventaja actualizada', data: current.items[index] });
});

app.delete('/api/advantages/:index', checkAdmin, (req, res) => {
  const index = parseInt(req.params.index);
  const current = readJSON('advantages.json') || { title: 'Ventajas', items: [] };
  if (!Array.isArray(current.items)) current.items = [];
  if (index < 0 || index >= current.items.length) return res.status(404).json({ error: 'No encontrado' });

  const removed = current.items.splice(index, 1);
  writeJSON('advantages.json', current);
  res.json({ message: 'Ventaja eliminada', data: removed[0] });
});


// ---- COSTS ----
app.get('/api/costs', checkAdmin, (req, res) => {
  const current = readJSON('costs.json') || { title: 'Costos', items: [] };
  if (!Array.isArray(current.items)) current.items = [];
  res.json(current);
});

app.post('/api/costs', checkAdmin, (req, res) => {
  const current = readJSON('costs.json') || { title: 'Costos', items: [] };
  if (!Array.isArray(current.items)) current.items = [];

  if (req.body.item) current.items.push(req.body.item);
  if (req.body.title) current.title = req.body.title;

  writeJSON('costs.json', current);
  res.status(201).json({ message: 'Costo agregado', data: current });
});

app.put('/api/costs/:index', checkAdmin, (req, res) => {
  const index = parseInt(req.params.index);
  const current = readJSON('costs.json') || { title: 'Costos', items: [] };
  if (!Array.isArray(current.items)) current.items = [];
  if (index < 0 || index >= current.items.length) return res.status(404).json({ error: 'No encontrado' });

  if (req.body.value) current.items[index] = req.body.value;
  writeJSON('costs.json', current);
  res.json({ message: 'Costo actualizado', data: current.items[index] });
});

app.delete('/api/costs/:index', checkAdmin, (req, res) => {
  const index = parseInt(req.params.index);
  const current = readJSON('costs.json') || { title: 'Costos', items: [] };
  if (!Array.isArray(current.items)) current.items = [];
  if (index < 0 || index >= current.items.length) return res.status(404).json({ error: 'No encontrado' });

  const removed = current.items.splice(index, 1);
  writeJSON('costs.json', current);
  res.json({ message: 'Costo eliminado', data: removed[0] });
});




app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
        req.session.user = username;
        return res.redirect('/admin');
    }
    res.render('login', { error: 'Usuario o contraseña incorrectos' });
});



// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
