const express = require("express");
const path = require("path");
const morgan = require("morgan");
const session = require("express-session");
const bodyParser = require("body-parser");

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

// ===== Rutas =====
app.use("/", require("./routes/publicRoutes"));
app.use("/", require("./routes/adminRoutes"));
app.use("/api/services", require("./routes/api/services"));
app.use("/api/advantages", require("./routes/api/advantages"));
app.use("/api/costs", require("./routes/api/costs"));
app.use("/api/productos", require("./routes/api/productos"));
app.use("/api/images", require("./routes/api/images"));

// ✅ Importante en Vercel
module.exports = app;
