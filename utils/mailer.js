const nodemailer = require("nodemailer");

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

let transporter = null;

if (smtpHost && smtpUser && smtpPass) {
	transporter = nodemailer.createTransport({
		host: smtpHost,
		port: smtpPort,
		secure: smtpPort === 465,
		auth: {
			user: smtpUser,
			pass: smtpPass,
		},
	});
} else {
	console.warn(
		"[mailer] SMTP no configurado. Define SMTP_HOST, SMTP_USER y SMTP_PASS para enviar correos."
	);
}

/**
 * Envía un correo de confirmación de compra al usuario.
 * @param {Object} options
 * @param {string} options.to
 * @param {string} [options.name]
 * @param {Object} [options.product]
 * @param {number|string} [options.total]
 * @param {number|string} [options.originalTotal]
 * @param {{code:string, discount:number}} [options.coupon]
 * @param {string|number} [options.paymentId]
 */
async function sendPurchaseEmail({
	to,
	name,
	product,
	total,
	originalTotal,
	coupon,
	paymentId,
}) {
	if (!transporter) {
		console.warn("[mailer] Intento de enviar correo sin transporter configurado.");
		return;
	}

	if (!to) {
		console.warn("[mailer] Dirección de correo vacía, se omite el envío.");
		return;
	}

	const safeTotal = typeof total === "number" ? total.toFixed(2) : total;
	const safeOriginalTotal =
		typeof originalTotal === "number" ? originalTotal.toFixed(2) : originalTotal;
	const safeDiscount =
		typeof coupon?.discount === "number" ? coupon.discount.toFixed(2) : null;

	const html = `
		<h1>¡Gracias por tu compra!</h1>
		<p>Hola ${name || ""}, confirmamos que recibimos tu pago.</p>
		<ul>
			<li><strong>ID de pago:</strong> ${paymentId || "No disponible"}</li>
			<li><strong>Producto:</strong> ${product?.title || "No disponible"}</li>
			<li><strong>Cantidad:</strong> ${product?.quantity || 1}</li>
			${safeOriginalTotal ? `<li><strong>Total antes de descuentos:</strong> $${safeOriginalTotal}</li>` : ""}
			${
				coupon && coupon.code
					? `<li><strong>Cupón aplicado (${coupon.code}):</strong> -$${safeDiscount || "No disponible"}</li>`
					: ""
			}
			<li><strong>Total pagado:</strong> $${safeTotal || "No disponible"}</li>
		</ul>
		<p>Nos pondremos en contacto para coordinar los detalles de tu experiencia.</p>
		<p>Ante cualquier consulta puedes escribirnos respondiendo este correo.</p>
	`;

	await transporter.sendMail({
		from: smtpFrom,
		to,
		subject: "Resumen de tu compra - Rutas de los Glaciares",
		html,
	});
}

module.exports = { sendPurchaseEmail };
