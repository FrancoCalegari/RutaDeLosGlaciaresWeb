const ADMIN_USER = { username: "admin", password: "admin123" };

function checkAdmin(req, res, next) {
	if (req.session && req.session.user === ADMIN_USER.username) {
		return next();
	}
	res.redirect("/login");
}

module.exports = { checkAdmin, ADMIN_USER };
