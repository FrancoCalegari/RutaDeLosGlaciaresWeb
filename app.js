const express = require("express");
const path = require("path");
const morgan = require("morgan");
const session = require("express-session");
const bodyParser = require("body-parser");

const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const servicesAPI = require("./routes/api/services");
const advantagesAPI = require("./routes/api/advantages");
const costsAPI = require("./routes/api/costs");
const productosAPI = require("./routes/api/productos");
const imagesAPI = require("./routes/api/images");

const app = express();

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

// ===== EJS =====
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===== Montar rutas =====
app.use("/", publicRoutes);
app.use("/", adminRoutes);
app.use("/api/services", servicesAPI);
app.use("/api/advantages", advantagesAPI);
app.use("/api/costs", costsAPI);
app.use("/api/productos", productosAPI);
app.use("/api/images", imagesAPI);

// ===== Servidor =====
const PORT = process.env.PORT || 3000;
if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Servidor escuchando en http://localhost:${PORT}`);
	});
}

// ✅ Exportar express para Vercel
module.exports = app;
