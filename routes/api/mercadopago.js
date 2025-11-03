const express = require("express");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

const { sendPurchaseEmail } = require("../../utils/mailer");
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
		const { productId, quantity = 1, buyer = {} } = req.body;

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
		const rawUnitPrice =
			discountPercentage > 0
				? price * (1 - discountPercentage / 100)
				: price;
		const unitPrice = Math.round(rawUnitPrice * 100) / 100;

		const preference = await preferenceClient.create({
			body: {
				items: [
					{
						id: String(product.id),
						title: product.nombreProducto,
						description: product.detalleProducto,
						unit_price: unitPrice,
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
							unit_price: unitPrice,
							quantity: safeQuantity,
						},
					],
				},
				metadata: {
					productId: String(product.id),
					productName: product.nombreProducto,
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
				notification_url: `${appUrl}/api/mercadopago/webhook`,
				external_reference: `product-${product.id}-${Date.now()}`,
			},
		});

		return res.json({ preferenceId: preference.id });
	} catch (error) {
		console.error("[mercadopago] Error al crear preferencia:", error);
		return res
			.status(500)
			.json({ error: "No se pudo generar la preferencia de pago" });
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

			await sendPurchaseEmail({
				to: payment.payer?.email,
				name: payment.payer?.first_name,
				product: purchaseItem,
				total: payment.transaction_amount,
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
