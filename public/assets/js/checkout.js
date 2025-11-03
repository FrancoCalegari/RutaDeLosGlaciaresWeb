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

	let currentProductId = null;

	const showError = (message) => {
		if (!errorBox) return;
		errorBox.textContent = message;
		errorBox.hidden = false;
	};

	const hideError = () => {
		if (!errorBox) return;
		errorBox.hidden = true;
	};

	const showModal = () => {
		if (!modal) return;
		modal.classList.add("is-visible");
		modal.setAttribute("aria-hidden", "false");
		hideError();
	};

	const hideModal = () => {
		if (!modal) return;
		modal.classList.remove("is-visible");
		modal.setAttribute("aria-hidden", "true");
		if (form) {
			form.reset();
		}
		hideError();
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
