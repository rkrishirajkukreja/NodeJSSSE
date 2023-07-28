// server.js
const express = require('express');
const http = require('http');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

app.use(express.json()); // Parse JSON body in requests

// Serve the HTML page with the "Send Data to Client" button
app.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  fs.createReadStream('index.html').pipe(res);
});

const clients = new Map();

const registeredClientsFile = './registeredClients.txt';

// Function to read the registered clients from the file
function loadRegisteredClients() {
  try {
    const data = fs.readFileSync(registeredClientsFile, 'utf8');
    const registeredClients = data.split(',');
    registeredClients.forEach(clientId => clients.set(clientId, null));
  } catch (err) {
    console.error('Error reading registered clients file:', err);
  }
}

// Function to save the registered clients to the file
function saveRegisteredClients() {
  try {
    const registeredClients = Array.from(clients.keys()).join(',');
    fs.writeFileSync(registeredClientsFile, registeredClients);
  } catch (err) {
    console.error('Error saving registered clients file:', err);
  }
}

function isClientNameRegistered(clientName) {
  return Array.from(clients.keys()).includes(clientName);
}

// Route to handle registering a new client
app.get('/register-client', (req, res) => {
  const clientName = req.query.clientName;
  if (!clientName) {
    res.status(400).send('Client name not specified.');
    return;
  }

  if (isClientNameRegistered(clientName)) {
    res.status(400).send('Client name already registered.');
    return;
  }

  clients.set(clientName, null);
  saveRegisteredClients(); // Save the updated client list to the file
  res.send(`Client "${clientName}" registered.`);
});
	
// Load the registered clients when the server starts
loadRegisteredClients();
// SSE endpoint for the clients to connect
app.get('/sse/:clientId', (req, res) => {
  const clientId = req.params.clientId;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Store the response object to send data later
  clients.set(clientId, res);

  // Close the SSE connection when the client disconnects
  req.on('close', () => {
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected.`);
  });
});

// Function to send data to a specific client
function sendDataToClient(clientId, data) {
  const clientResponse = clients.get(clientId);
  if (clientResponse) {
    clientResponse.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

// Route to handle sending data to the selected client
app.post('/send-data-to-client', (req, res) => {
  const selectedClient = req.query.client;
  if (!selectedClient) {
    res.status(400).send('Client not specified.');
    return;
  }

  const data = req.body;
  sendDataToClient(selectedClient, data);

  res.send('Data sent to client.');
});

// Route to get the list of registered clients
app.get('/get-registered-clients', (req, res) => {
  const registeredClients = Array.from(clients.keys());
  res.json({ clients: registeredClients });
});


const port = 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
