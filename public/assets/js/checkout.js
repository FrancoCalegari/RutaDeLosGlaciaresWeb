document.addEventListener("DOMContentLoaded", () => {
	const mpKey = window.__MP_PUBLIC_KEY__;

	if (!mpKey) {
		console.warn("Mercado Pago public key no definida. Revisa MP_PUBLIC_KEY.");
		return;
	}

	if (typeof MercadoPago === "undefined") {
		console.warn("SDK de Mercado Pago no disponible.");
		return;
	}

	const mp = new MercadoPago(mpKey, { locale: "es-AR" });

	const modal = document.getElementById("checkout-modal");
	const form = document.getElementById("checkout-form");
	const errorBox = document.getElementById("checkout-error");
	const closeButton = modal?.querySelector("[data-close='true']");
	const submitButton = form?.querySelector("button[type='submit']");
	const couponInput = document.getElementById("checkout-coupon");
	const couponButton = document.getElementById("checkout-apply-coupon");
	const couponFeedback = document.getElementById("checkout-coupon-feedback");

	let currentProductId = null;
	let appliedCoupon = null;

	const showError = (message) => {
		if (!errorBox) return;
		errorBox.textContent = message;
		errorBox.hidden = false;
	};

	const hideError = () => {
		if (!errorBox) return;
		errorBox.hidden = true;
	};

	const showCouponMessage = (type, message) => {
		if (!couponFeedback) return;

		couponFeedback.classList.remove("is-success", "is-error", "is-info");

		if (!message) {
			couponFeedback.hidden = true;
			return;
		}

		let className = "is-info";
		if (type === "success") className = "is-success";
		if (type === "error") className = "is-error";
		couponFeedback.classList.add(className);
		couponFeedback.textContent = message;
		couponFeedback.hidden = false;
	};

	const clearCouponState = () => {
		appliedCoupon = null;
		if (couponInput) {
			couponInput.value = "";
		}
		showCouponMessage(null, "");
	};

	const markCouponNeedsValidation = () => {
		appliedCoupon = null;
		if (couponInput && couponInput.value.trim().length > 0) {
			showCouponMessage(
				"info",
				"Vuelve a aplicar el cupón para confirmar el descuento."
			);
		} else {
			showCouponMessage(null, "");
		}
	};

	const showModal = () => {
		if (!modal) return;
		modal.classList.add("is-visible");
		modal.setAttribute("aria-hidden", "false");
		hideError();
		clearCouponState();
	};

	const hideModal = () => {
		if (!modal) return;
		modal.classList.remove("is-visible");
		modal.setAttribute("aria-hidden", "true");
		if (form) {
			form.reset();
		}
		hideError();
		clearCouponState();
		currentProductId = null;
	};

	document.querySelectorAll(".btn-mercadopago").forEach((button) => {
		button.addEventListener("click", () => {
			currentProductId = button.dataset.productId;
			showModal();
		});
	});

	modal?.addEventListener("click", (event) => {
		if (event.target === modal || event.target.dataset.close === "true") {
			hideModal();
		}
	});

	closeButton?.addEventListener("click", hideModal);

	couponInput?.addEventListener("input", () => {
		markCouponNeedsValidation();
	});

	const quantityInput = form?.elements.namedItem("quantity");
	quantityInput?.addEventListener("input", () => {
		markCouponNeedsValidation();
	});

	couponButton?.addEventListener("click", async () => {
		if (!currentProductId) {
			showCouponMessage("error", "Selecciona un producto antes de aplicar el cupón.");
			return;
		}

		const code = couponInput?.value.trim();
		if (!code) {
			showCouponMessage("error", "Ingresa un código de cupón válido.");
			return;
		}

		const quantity = Number(quantityInput?.value) || 1;

		try {
			couponButton.disabled = true;
			couponButton.classList.add("is-loading");
			showCouponMessage("info", "Validando cupón…");

			const response = await fetch("/api/mercadopago/coupon/validate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					couponCode: code,
					productId: Number(currentProductId),
					quantity,
				}),
			});

			if (!response.ok) {
				const errorResponse = await response.json().catch(() => ({}));
				throw new Error(errorResponse.error || "El cupón no es válido.");
			}

			const data = await response.json();
			appliedCoupon = { code: data.code };
			couponInput.value = data.code;

			const formatter = new Intl.NumberFormat("es-AR", {
				style: "currency",
				currency: "ARS",
				minimumFractionDigits: 2,
			});

			showCouponMessage(
				"success",
				`Cupón aplicado. Descuento: ${formatter.format(
					data.discount
				)} · Total final: ${formatter.format(data.finalTotal)}.`
			);
		} catch (error) {
			console.error("Error al validar cupón:", error);
			appliedCoupon = null;
			showCouponMessage("error", error.message || "No se pudo validar el cupón.");
		} finally {
			couponButton.disabled = false;
			couponButton.classList.remove("is-loading");
		}
	});

	form?.addEventListener("submit", async (event) => {
		event.preventDefault();

		if (!currentProductId) {
			showError("Selecciona un producto antes de continuar.");
			return;
		}

		const formData = new FormData(form);

		const payload = {
			productId: Number(currentProductId),
			quantity: Number(formData.get("quantity")) || 1,
			buyer: {
				name: formData.get("name"),
				lastName: formData.get("lastName"),
				email: formData.get("email"),
				areaCode: formData.get("areaCode"),
				phone: formData.get("phone"),
			},
		};

		const couponValue = (formData.get("coupon") || "").toString().trim();
		if (appliedCoupon?.code) {
			payload.couponCode = appliedCoupon.code;
		} else if (couponValue) {
			payload.couponCode = couponValue;
		}

		try {
			if (submitButton) {
				submitButton.disabled = true;
				submitButton.classList.add("is-loading");
			}

			const response = await fetch("/api/mercadopago/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				let errorMessage = "No se pudo iniciar el proceso de pago.";
				try {
					const errorResponse = await response.json();
					if (errorResponse?.error) {
						errorMessage = errorResponse.error;
					}
				} catch {
					// ignorar errores del parseo
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();
			if (!data.preferenceId) {
				throw new Error("Mercado Pago no devolvió una preferencia válida.");
			}

			hideModal();

			mp.checkout({
				preference: { id: data.preferenceId },
				autoOpen: true,
			});
		} catch (error) {
			console.error("Error al crear preferencia:", error);
			showError(error.message || "No se pudo iniciar el proceso de pago.");
		} finally {
			if (submitButton) {
				submitButton.disabled = false;
				submitButton.classList.remove("is-loading");
			}
		}
	});
});
