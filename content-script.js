"use strict";

(async function () {
	function loadFavicon() {
		return (typeof browser === "undefined" ? chrome : browser).runtime.getURL(
			"favicon.png"
		);
	}
	async function createIconElement() {
		let icon = document.createElement("link");
		icon.rel = "icon";
		icon.type = "image/png";
		icon.sizes = "64x64";
		icon.href = await generateTabIcon(0);

		document.head.appendChild(icon);

		return icon;
	}

	async function generateTabIcon(number) {
		const canvas = document.createElement("canvas");
		canvas.width = 64;
		canvas.height = 64;
		const ctx = canvas.getContext("2d");
		const img = new Image();
		await new Promise((r) => {
			img.onload = r;
			img.src = favicon;
		});
		ctx.drawImage(img, 0, 0, 64, 64);

		if (number) {
			ctx.fillStyle = "#ff0000";
			ctx.beginPath();
			ctx.rect(32, 0, 32, 32);
			ctx.fill();

			// draw the number in center
			ctx.font = "bold 32px monospace";
			ctx.textAlign = "center";
			ctx.fillStyle = "white";
			const metrics = ctx.measureText(number);
			const textHeight =
				metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
			ctx.fillText(number, 48, 32 - (32 - textHeight) / 2);
		}

		const url = canvas.toDataURL("image/png");
		return url;
	}

	async function updatePage(count) {
		await updateIcon(count);
		document.title = (count > 0 ? `(${count}) ` : "") + title;
	}

	async function updateIcon(count) {
		const nr = count > 99 ? "99+" : count;
		document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
		owaIcon.href = await generateTabIcon(nr);
		document.head.appendChild(owaIcon);
	}

	function getOffice365CountFromNodes(nodes) {
		return Array.from(nodes)
			.filter((e) => e.textContent === "unread" && e.offsetParent !== null)
			.map((e) => parseInt(e.previousSibling.textContent, 10))
			.filter((v) => !isNaN(v))
			.reduce((acc, curr) => {
				return acc + curr;
			}, 0);
	}

	function countUnreadEmails() {
		const nodes = document
			.querySelector("div[title='Folders']")
			?.parentElement?.nextElementSibling?.querySelectorAll(
				"span span span.screenReaderOnly"
			);
		if (nodes?.length > 0) {
			return getOffice365CountFromNodes(nodes);
		}

		return 0;
	}

	function waitForEl(selector) {
		return new Promise((res) => {
			const interval = setInterval(() => {
				if (document.querySelector(selector)) {
					clearInterval(interval);
					res();
				}
			}, 100);
		});
	}

	await waitForEl("div[title='Folders']");
	const favicon = loadFavicon();
	const owaIcon = await createIconElement();
	const title = document.title;
	await updatePage(countUnreadEmails());

	setInterval(async () => {
		await updatePage(countUnreadEmails());
	}, 1000);
})();
