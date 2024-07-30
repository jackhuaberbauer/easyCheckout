const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000;
const wss = new WebSocket.Server({ noServer: true });
app.use(express.static('public'));

let sessions = {};
let orderNo = 1;

const server = app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
	const url = new URL(request.url, `http://${request.headers.host}`);
	const sessionId = url.pathname.split('/')[2];

	wss.handleUpgrade(request, socket, head, (ws) => {
		wss.emit('connection', ws, request, sessionId);
	});
});

wss.on('connection', (ws, request, sessionId) => {
	if (!sessions[sessionId]) {
		sessions[sessionId] = { clients: [], sessionData: { orders: [], articles: [], nextOrderNo: orderNo } };
	}

	ws.on('message', (message) => {
		const data = JSON.parse(message);
		handleWebSocketMessage(ws, data, sessionId);
	});

	sessions[sessionId].clients.push(ws);
	broadcastToSession(sessionId, 'sessionJoined');
});

function handleWebSocketMessage(ws, data, sessionId) {
	switch (data.type) {
		case 'addOrder':
			handleAddOrder(sessionId, data.cart);
			break;
		case 'markOrderAsDone':
			handleMarkOrderAsDone(sessionId, data.cartId);
			break;
		case 'updateArticles':
			handleUpdateArticles(sessionId, data.articles);
			break;
		default:
			console.error(`Unknown message type: ${data.type}`);
			break;
	}
}

function handleUpdateArticles(sessionId, articles) {
	const session = getSession(sessionId);
	if (session) {
		session.sessionData.articles = articles;
		broadcastToSession(sessionId, 'updateArticles');
	} else {
		console.error(`Session ID ${sessionId} not found for updating articles.`);
	}
}

function handleAddOrder(sessionId, cart) {
	const session = getSession(sessionId);
	if (session) {
		session.sessionData.orders = session.sessionData.orders || [];
		session.sessionData.orders.push({ id: uuidv4(), orderNo: orderNo++, articles: cart });
		broadcastToSession(sessionId, 'updateOrders');
	} else {
		console.error(`Session ID ${sessionId} not found for completing cart.`);
	}
}

function handleMarkOrderAsDone(sessionId, cartId) {
	const session = getSession(sessionId);
	if (session) {
		session.sessionData.orders = session.sessionData.orders.filter((cart) => cart.id !== cartId);
		broadcastToSession(sessionId, 'updateOrders');
	} else {
		console.error(`Session ID ${sessionId} not found for marking cart as done.`);
	}
}

function getSession(sessionId) {
	return sessions[sessionId];
}

function broadcastToSession(sessionId, type) {
	const session = getSession(sessionId);
	session.sessionData.nextOrderNo = orderNo;
	session.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify({ sessionId, type, sessionData: session.sessionData }));
		}
	});
}

app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

/**
 * @typedef {Object} SessionData
 * @property {Object[]} orders
 * @property {Object[]} articles
 */
