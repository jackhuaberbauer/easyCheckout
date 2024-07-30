const pathParts = window.location.pathname.split('/');
const workplaceType = pathParts[1]; // 'kasse' or 'ausgabe'
const sessionId = pathParts[2];
const ws = new WebSocket(`ws://${window.location.host}/${workplaceType}/${sessionId}`);
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
	if (message.type === 'sessionJoined' || message.type === 'updateOrders') {
		showOrders(message.sessionData.orders);
        articles = message.sessionData.articles;
        showArticleButtons(message.sessionData.articles);
	}
    if (message.type === 'updateArticles') {
        articles = message.sessionData.articles;
        showArticleButtons(message.sessionData.articles);
    }
};

document.getElementById('addArticle').onclick = () => {
	
    // @ts-ignore
	const articleTitle = document.getElementById('article').value;
	// @ts-ignore
	const price = document.getElementById('price').value;
	
    const existingArticle = articles.find((article) => article.title === articleTitle);
    if (!existingArticle) {
        articles.push({title: articleTitle, price: parseFloat(price)});
    	ws.send(JSON.stringify({ type: 'updateArticles', sessionId, articles: articles }));
    }
	// @ts-ignore
	document.getElementById('article').value = '';
	// @ts-ignore
	document.getElementById('price').value = '';
};

document.getElementById('addOrder').onclick = () => {
	ws.send(JSON.stringify({ type: 'addOrder', sessionId, cart: cart }));
	cart = [];
	updateCart();
};

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
        };
        articleList.appendChild(button);
    });

	const articleAdminDiv = document.getElementById('articles');
    articleAdminDiv.innerHTML = '';
    articles.forEach((article) => {
        const button = document.createElement('button');
        button.textContent = `${article.title} - ${article.price.toFixed(2)} € (ENTFERNEN)`;
        button.onclick = () => {
            removeArticle(article)
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
	cart.forEach((item) => {
		const li = document.createElement('li');
		li.textContent = `${item.article} - ${item.price.toFixed(2)} €`;
		cartList.appendChild(li);
	});
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
		orderNo.textContent = `Bestellung ${cart.orderNo}`;
		div.classList.add('order');
		const ul = document.createElement('ul');
		console.log(cart.articles);
		// group articles with same name and add count
		const groupedArticles = cart.articles.reduce((acc, item) => {
			const existingItem = acc.find((groupedItem) => groupedItem.article === item.article);
			if (existingItem) {
				existingItem.count++;
			} else {
				acc.push({ article: item.article, count: 1 });
			}
			return acc;
		}, []);
		console.log(groupedArticles);

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
		div.appendChild(ul)
		div.appendChild(button);
		completedCartList.appendChild(div);
	});
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
