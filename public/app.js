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

ws.onmessage = (event) => {
	console.log('WebSocket message:', event.data);
	const message = JSON.parse(event.data);
	if (message.sessionId != sessionId) return;
	articles = message.sessionData.articles;
	articles = message.sessionData.articles;
	if (message.type === 'sessionJoined' || message.type === 'updateOrders') {
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
