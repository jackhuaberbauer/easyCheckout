const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = process.env.PORT || 4000;
const wss = new WebSocket.Server({ noServer: true });
app.use(express.static('public'));

let sessions = {};

const server = app.listen(port, () => {
	console.log(`Server is running on port  ${port}`);
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
		console.log(`Creating new session with ID ${sessionId}`);
		/** @type {Session} */
		const newSession = { clients: [], sessionData: { orders: [], articles: [], nextOrderNo: 1 } };
		sessions[sessionId] = newSession;
	}

	ws.on('message', (message) => {
		const data = JSON.parse(message);
		handleWebSocketMessage(ws, data, sessionId);
	});

	sessions[sessionId].clients.push(ws);
	broadcastToClients(sessionId, 'sessionJoined');
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
		broadcastToClients(sessionId, 'updateArticles');
	} else {
		console.error(`Session ID ${sessionId} not found for updating articles.`);
	}
}

function handleAddOrder(sessionId, cart) {
	const session = getSession(sessionId);
	if (session) {
		session.sessionData.orders = session.sessionData.orders || [];
		session.sessionData.orders.push({ id: uuidv4(), orderNo: session.sessionData.nextOrderNo++, articles: cart });
		broadcastToClients(sessionId, 'updateOrders');
	} else {
		console.error(`Session ID ${sessionId} not found for completing cart.`);
	}
}

function handleMarkOrderAsDone(sessionId, cartId) {
	const session = getSession(sessionId);
	if (session) {
		session.sessionData.orders = session.sessionData.orders.filter((cart) => cart.id !== cartId);
		broadcastToClients(sessionId, 'updateOrders');
	} else {
		console.error(`Session ID ${sessionId} not found for marking cart as done.`);
	}
}

/**
 * Get a session by its id
 * @param {*} sessionId
 * @returns {Session}
 */
function getSession(sessionId) {
	return sessions[sessionId];
}

function broadcastToClients(sessionId, type) {
	const session = getSession(sessionId);
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
 * @typedef {Object} Session
 * @property {Object[]}	clients
 * @property {SessionData} sessionData
 */

/**
 * @typedef {Object} SessionData

 * @property {Object[]} orders
 * @property {Object[]} articles
 * @property {number} nextOrderNo
 */
