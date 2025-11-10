const express = require("express");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

const { sendPurchaseEmail } = require("../../utils/mailer");
const { validateCoupon, CouponError } = require("../../utils/coupons");
const products = require("../../public/data/productos.json");

const router = express.Router();

const accessToken = process.env.MP_ACCESS_TOKEN;
const appUrl = process.env.APP_URL || "http://localhost:3000";

if (!accessToken) {
	console.warn("[mercadopago] Falta MP_ACCESS_TOKEN en variables de entorno.");
}

const mercadopagoClient = accessToken
	? new MercadoPagoConfig({ accessToken })
	: null;

const preferenceClient = mercadopagoClient ? new Preference(mercadopagoClient) : null;
const paymentClient = mercadopagoClient ? new Payment(mercadopagoClient) : null;

router.post("/checkout", async (req, res) => {
	if (!preferenceClient) {
		return res.status(500).json({
			error: "Mercado Pago no está configurado. Contacta al administrador.",
		});
	}

	try {
		const { productId, quantity = 1, buyer = {}, couponCode } = req.body;

		const product = products.find((p) => Number(p.id) === Number(productId));
		if (!product) {
			return res.status(404).json({ error: "Producto no encontrado" });
		}

		const price = Number(product.precioProducto) || 0;
		if (price <= 0) {
			return res
				.status(400)
				.json({ error: "El producto no tiene un precio válido" });
		}

		if (!buyer.email) {
			return res
				.status(400)
				.json({ error: "Necesitamos un correo electrónico para continuar" });
		}

		const parsedQuantity = Number(quantity) || 1;
		const safeQuantity = Math.max(1, Math.min(parsedQuantity, 10));
		const discountPercentage = Number(product.descuentoProducto) || 0;
		const baseUnitPrice =
			discountPercentage > 0
				? price * (1 - discountPercentage / 100)
				: price;
		const unitPrice = Math.round(baseUnitPrice * 100) / 100;
		const originalTotal = unitPrice * safeQuantity;

		let couponSummary = null;
		let finalTotal = originalTotal;

		if (couponCode) {
			try {
				couponSummary = validateCoupon({
					code: couponCode,
					productId: product.id,
					amount: originalTotal,
				});
			} catch (error) {
				if (error instanceof CouponError) {
					return res.status(400).json({ error: error.message });
				}
				console.error("[mercadopago] Error al validar cupón:", error);
				return res.status(500).json({ error: "No se pudo validar el cupón" });
			}
		}

		const couponDiscount = couponSummary ? couponSummary.discount : 0;
		finalTotal = originalTotal - couponDiscount;

		if (finalTotal <= 0) {
			return res.status(400).json({
				error:
					"El cupón aplicado supera el total de la compra. Ajusta la cantidad o usa otro cupón.",
			});
		}

		const finalUnitPrice = Math.round((finalTotal / safeQuantity) * 100) / 100;

		const preference = await preferenceClient.create({
			body: {
				items: [
					{
						id: String(product.id),
						title: product.nombreProducto,
						description: product.detalleProducto,
						unit_price: finalUnitPrice,
						quantity: safeQuantity,
						currency_id: "ARS",
					},
				],
				additional_info: {
					items: [
						{
							id: String(product.id),
							title: product.nombreProducto,
							description: product.detalleProducto,
							unit_price: finalUnitPrice,
							quantity: safeQuantity,
						},
					],
				},
				metadata: {
					productId: String(product.id),
					productName: product.nombreProducto,
					originalUnitPrice: unitPrice,
					quantity: safeQuantity,
					couponCode: couponSummary ? couponSummary.coupon.code : null,
					couponDiscount,
					originalTotal,
					finalTotal,
				},
				payer: {
					name: buyer.name,
					surname: buyer.lastName,
					email: buyer.email,
					phone: {
						area_code: buyer.areaCode,
						number: buyer.phone,
					},
				},
				back_urls: {
					success: `${appUrl}/checkout/success`,
					failure: `${appUrl}/checkout/failure`,
					pending: `${appUrl}/checkout/pending`,
				},
				auto_return: "approved",
				coupon_code: couponSummary ? couponSummary.coupon.code : undefined,
				coupon_amount: couponSummary ? couponDiscount : undefined,
				notification_url: `${appUrl}/api/mercadopago/webhook`,
				external_reference: `product-${product.id}-${Date.now()}`,
			},
		});

		return res.json({
			preferenceId: preference.id,
			detail: {
				productId: product.id,
				productName: product.nombreProducto,
				quantity: safeQuantity,
				originalTotal: Number(originalTotal.toFixed(2)),
				finalTotal: Number(finalTotal.toFixed(2)),
				coupon: couponSummary
					? {
							code: couponSummary.coupon.code,
							discount: Number(couponDiscount.toFixed(2)),
							description: couponSummary.description,
					  }
					: null,
			},
		});
	} catch (error) {
		console.error("[mercadopago] Error al crear preferencia:", error);
		return res
			.status(500)
			.json({ error: "No se pudo generar la preferencia de pago" });
	}
});

router.post("/coupon/validate", async (req, res) => {
	try {
		const { couponCode, productId, quantity = 1 } = req.body;

		const product = products.find((p) => Number(p.id) === Number(productId));
		if (!product) {
			return res.status(404).json({ error: "Producto no encontrado" });
		}

		const price = Number(product.precioProducto) || 0;
		if (price <= 0) {
			return res
				.status(400)
				.json({ error: "El producto no tiene un precio válido" });
		}

		const parsedQuantity = Number(quantity) || 1;
		const safeQuantity = Math.max(1, Math.min(parsedQuantity, 10));
		const discountPercentage = Number(product.descuentoProducto) || 0;
		const baseUnitPrice =
			discountPercentage > 0
				? price * (1 - discountPercentage / 100)
				: price;
		const unitPrice = Math.round(baseUnitPrice * 100) / 100;
		const originalTotal = unitPrice * safeQuantity;

		const couponSummary = validateCoupon({
			code: couponCode,
			productId: product.id,
			amount: originalTotal,
		});

		const couponDiscount = couponSummary.discount;
		const finalTotal = originalTotal - couponDiscount;

		if (finalTotal <= 0) {
			return res.status(400).json({
				error:
					"El cupón aplicado supera el total de la compra. Ajusta la cantidad o usa otro cupón.",
			});
		}

		return res.json({
			valid: true,
			code: couponSummary.coupon.code,
			discount: Number(couponDiscount.toFixed(2)),
			originalTotal: Number(originalTotal.toFixed(2)),
			finalTotal: Number(finalTotal.toFixed(2)),
			description: couponSummary.description,
		});
	} catch (error) {
		if (error instanceof CouponError) {
			return res.status(400).json({ error: error.message });
		}
		console.error("[mercadopago] Error al validar cupón:", error);
		return res.status(500).json({ error: "No se pudo validar el cupón" });
	}
});

router.post("/webhook", async (req, res) => {
	if (!paymentClient) {
		return res.status(200).send("mp not configured");
	}

	try {
		const eventType = req.body.type || req.query.type;
		if (eventType !== "payment") {
			return res.status(200).send("ignored");
		}

		const paymentId = req.body.data?.id || req.query["data.id"];
		if (!paymentId) {
			return res.status(400).send("missing payment id");
		}

		const payment = await paymentClient.get({ id: paymentId });

		if (payment.status === "approved") {
			const purchaseItem = payment.additional_info?.items?.[0];
			const couponCode = payment.metadata?.couponCode || payment.coupon?.id;
			const couponDiscount =
				typeof payment.metadata?.couponDiscount === "number"
					? payment.metadata.couponDiscount
					: payment.coupon_amount;

			await sendPurchaseEmail({
				to: payment.payer?.email,
				name: payment.payer?.first_name,
				product: purchaseItem,
				total: payment.transaction_amount,
				originalTotal: payment.metadata?.originalTotal,
				coupon: couponCode
					? {
							code: couponCode,
							discount: couponDiscount,
					  }
					: null,
				paymentId,
			});
		}

		return res.status(200).send("ok");
	} catch (error) {
		console.error("[mercadopago] Error en webhook:", error);
		return res.status(500).send("error");
	}
});

module.exports = router;
