const express = require("express");
const path = require("path");
const morgan = require("morgan");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// ===== Middleware =====
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
	session({
		secret: "4455asjodiejsi4kn",
		resave: false,
		saveUninitialized: false,
	})
);

// ===== Configuración EJS =====
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===== Importar rutas =====
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const servicesAPI = require("./routes/api/services");
const advantagesAPI = require("./routes/api/advantages");
const costsAPI = require("./routes/api/costs");
const productosAPI = require("./routes/api/productos");

// ===== Montar rutas =====
app.use("/", publicRoutes);
app.use("/", adminRoutes);
app.use("/api/services", servicesAPI);
app.use("/api/advantages", advantagesAPI);
app.use("/api/costs", costsAPI);
app.use("/api/productos", productosAPI);

// ===== Iniciar servidor =====
app.listen(PORT, () => {
	console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
