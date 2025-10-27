const express = require("express");
const router = express.Router();
const { readJSON } = require("../utils/fileHandler");
const { checkAdmin, ADMIN_USER } = require("../middleware/auth");

router.get("/login", (req, res) => {
	res.render("login", { title: "Login" });
});

router.post("/login", (req, res) => {
	const { username, password } = req.body;
	if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
		req.session.user = username;
		return res.redirect("/admin");
	}
	res.render("login", { error: "Usuario o contraseña incorrectos" });
});

router.get("/admin", checkAdmin, (req, res) => {
	const images = readJSON("images.json", []);
	const background = readJSON("background.json", {});
	const summary = readJSON("summary.json", {});
	const services = readJSON("services.json", []);
	const advantages = readJSON("advantages.json", { title: "", items: [] });
	const costs = readJSON("costs.json", { title: "", items: [] });
	const productos = readJSON("productos.json", []);

	res.render("admin", {
		title: "Dashboard",
		images,
		background,
		summary,
		services,
		advantages,
		costs,
		productos,
	});
});

router.get("/logout", (req, res) => {
	req.session.destroy();
	res.redirect("/");
});

module.exports = router;
