const fs = require("fs");
const path = require("path");

class CouponError extends Error {
	constructor(message) {
		super(message);
		this.name = "CouponError";
	}
}

const couponsPath = path.join(__dirname, "..", "public", "data", "coupons.json");

function loadCoupons() {
	try {
		const raw = fs.readFileSync(couponsPath, "utf-8");
		const coupons = JSON.parse(raw);
		return Array.isArray(coupons) ? coupons : [];
	} catch (error) {
		console.error("[coupons] No se pudieron cargar los cupones:", error);
		return [];
	}
}

/**
 * Busca y valida un cupón para un producto y monto concreto.
 * @param {Object} params
 * @param {string} params.code - Código del cupón
 * @param {number} params.productId - ID del producto seleccionado
 * @param {number} params.amount - Monto total antes de aplicar el cupón
 * @returns {{coupon: Object, discount: number, description: string}}
 */
function validateCoupon({ code, productId, amount }) {
	if (!code) {
		throw new CouponError("Ingresa un código de cupón.");
	}

	const normalizedCode = String(code).trim().toUpperCase();
	const coupons = loadCoupons();
	const coupon = coupons.find(
		(c) => String(c.code).trim().toUpperCase() === normalizedCode
	);

	if (!coupon) {
		throw new CouponError("El cupón ingresado no existe o no está disponible.");
	}

	if (coupon.expiresAt) {
		const expires = new Date(coupon.expiresAt);
		if (!Number.isNaN(expires.getTime()) && expires < new Date()) {
			throw new CouponError("El cupón ingresado está vencido.");
		}
	}

	if (Array.isArray(coupon.allowedProducts) && coupon.allowedProducts.length > 0) {
		const isAllowed = coupon.allowedProducts
			.map(Number)
			.includes(Number(productId));
		if (!isAllowed) {
			throw new CouponError("El cupón no aplica al producto seleccionado.");
		}
	}

	const minAmount = Number(coupon.minAmount) || 0;
	if (minAmount > 0 && amount < minAmount) {
		throw new CouponError(
			`El cupón requiere un mínimo de compra de $${minAmount.toLocaleString("es-AR")}.`
		);
	}

	const type = String(coupon.type || "").toLowerCase();
	const value = Number(coupon.value) || 0;

	if (!["percentage", "amount"].includes(type) || value <= 0) {
		throw new CouponError("El cupón no tiene una configuración válida.");
	}

	let discount = 0;
	if (type === "percentage") {
		discount = (amount * value) / 100;
	} else {
		discount = value;
	}

	const maxDiscount = amount;
	const finalDiscount = Math.min(discount, maxDiscount);

	return {
		coupon,
		discount: finalDiscount,
		description: coupon.description || "",
	};
}

module.exports = {
	validateCoupon,
	CouponError,
};
