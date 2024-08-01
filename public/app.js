const pathParts = window.location.pathname.split('/');
const workplaceType = pathParts[1]; // 'kasse' or 'ausgabe'
const sessionId = pathParts[2];
const webSocketUrl =
	window.location.host == 'localhost:4000' ? `ws://${window.location.host}/${workplaceType}/${sessionId}` : `wss://${window.location.host}/${workplaceType}/${sessionId}`;
const ws = new WebSocket(webSocketUrl);
let cart = [];
let articles = [];

if (workplaceType === 'ausgabe') {
	document.getElementById('kasse').style.display = 'none';
	document.getElementById('admin').style.display = 'none';
} else if (workplaceType === 'kasse') {
	document.getElementById('ausgabe').style.display = 'none';
	document.getElementById('admin').style.display = 'none';
}

ws.onopen = () => {
	console.log(`Joined session: ${sessionId}`);
};

function beep() {
	var snd = new Audio(
		'data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU='
	);
	snd.play();
}

ws.onmessage = (event) => {
	console.log('WebSocket message:', event.data);
	const message = JSON.parse(event.data);
	if (message.sessionId != sessionId) return;
	articles = message.sessionData.articles;
	articles = message.sessionData.articles;
	if (message.type === 'sessionJoined' || message.type === 'updateOrders') {
		beep();
		showOrders(message.sessionData.orders);
		showArticleButtons(message.sessionData.articles);
	}
	if (message.type === 'updateArticles') {
		showArticleButtons(message.sessionData.articles);
	}

	const nextOrderNoDiv = document.getElementById('nextOrderNo');
	nextOrderNoDiv.textContent = `Nächste Bestellung: #${message.sessionData.nextOrderNo}`;
};

document.getElementById('addArticle').onclick = addArticle;
document.getElementById('price').onkeydown = (event) => {
	if (event.key === 'Enter') {
		addArticle();
		document.getElementById('article').focus();
	}
};

function addArticle() {
	// @ts-ignore
	const articleTitle = document.getElementById('article').value;
	// @ts-ignore
	const price = document.getElementById('price').value;

	if (!articleTitle || !price) {
		alert('Bitte fülle alle Felder aus.');
		return;
	}

	const existingArticle = articles.find((article) => article.title === articleTitle);
	if (!existingArticle) {
		articles.push({ title: articleTitle, price: parseFloat(price) });
		ws.send(JSON.stringify({ type: 'updateArticles', sessionId, articles: articles }));
	}
	// @ts-ignore
	document.getElementById('article').value = '';
	// @ts-ignore
	document.getElementById('price').value = '';
}

document.getElementById('addOrder').onclick = () => {
	ws.send(JSON.stringify({ type: 'addOrder', sessionId, cart: cart }));
	clearCart();
};

document.getElementById('clearCart').onclick = clearCart;

function clearCart() {
	cart = [];
	updateCart();
	// @ts-ignore
	document.getElementById('addOrder').disabled = true;
}

function showArticleButtons(articles) {
	const articleList = document.getElementById('articleButtons');
	articleList.innerHTML = '';
	articles.forEach((article) => {
		const button = document.createElement('button');
		button.textContent = `${article.title} - ${article.price.toFixed(2)} €`;
		button.onclick = () => {
			const item = { article: article.title, price: article.price, id: generateUUID() };
			cart.push(item);
			updateCart();
			// @ts-ignore
			document.getElementById('addOrder').disabled = false;
		};
		articleList.appendChild(button);
	});

	const articleAdminDiv = document.getElementById('articles');
	articleAdminDiv.innerHTML = '';
	articles.forEach((article) => {
		const button = document.createElement('button');
		button.textContent = `${article.title} - ${article.price.toFixed(2)} € (ENTFERNEN)`;
		button.onclick = () => {
			removeArticle(article);
		};
		articleAdminDiv.appendChild(button);
	});
}

function removeArticle(article) {
	articles = articles.filter((existingArticle) => existingArticle.title !== article.title);
	ws.send(JSON.stringify({ type: 'updateArticles', sessionId, articles: articles }));
}

function updateCart() {
	const cartList = document.getElementById('cart');
	cartList.innerHTML = '';
	const groupedArticles = getGroupedArticles(cart);
	groupedArticles.forEach((item) => {
		const li = document.createElement('li');
		li.textContent = `${item.count}x ${item.article} - ${item.sum.toFixed(2)} €`;
		cartList.appendChild(li);
	});
	const sum = getArticlesSum(cart);
	const totalDiv = document.getElementById('total');
	totalDiv.textContent = `Summe: ${sum.toFixed(2)} €`;
}

function showOrders(orders) {
	if (!orders) {
		orders = [];
	}
	const completedCartList = document.getElementById('orders');
	completedCartList.innerHTML = '';
	orders.forEach((cart, index) => {
		const div = document.createElement('div');
		const orderNo = document.createElement('div');
		orderNo.classList.add('orderNo');
		orderNo.textContent = `Bestellung #${cart.orderNo}`;
		div.classList.add('order');
		const ul = document.createElement('ul');
		const groupedArticles = getGroupedArticles(cart.articles);
		groupedArticles.forEach((item) => {
			const itemLi = document.createElement('li');
			itemLi.textContent = `${item.count}x ${item.article}`;
			ul.appendChild(itemLi);
		});
		const button = document.createElement('button');
		button.textContent = 'Erledigt';
		button.onclick = () => {
			ws.send(JSON.stringify({ type: 'markOrderAsDone', sessionId, cartId: cart.id }));
		};
		div.appendChild(orderNo);
		div.appendChild(ul);
		div.appendChild(button);
		completedCartList.appendChild(div);
	});
}

function getGroupedArticles(articles) {
	return articles.reduce((acc, item) => {
		const existingItem = acc.find((groupedItem) => groupedItem.article === item.article);
		if (existingItem) {
			existingItem.count++;
			existingItem.sum += item.price;
		} else {
			acc.push({ article: item.article, count: 1, price: item.price, sum: item.price });
		}
		return acc;
	}, []);
}

function getArticlesSum(articles) {
	return articles.reduce((acc, item) => acc + item.price, 0);
}

function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * @type {Object} Article
 *  @property {string} title
 *  @property {number} price
 */
