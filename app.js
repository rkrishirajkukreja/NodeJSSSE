const express = require('express');
const { createServer } = require('http');
const app = express();
const axios = require('axios');

// An in-memory variable to store the data
let eventData = null;
let eventSent = false; // To track if the event has been sent

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// SSE implementation
app.get('/events2', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!eventSent) {
    // Send the event data to the client
    if (eventData) {
      res.write(`data: ${eventData}\n\n`);
    }
    eventSent = true;

    // End the SSE connection after sending the data
    res.end();
  }
});

// Endpoint to handle button click and update the data
app.post('/send-event', (req, res) => {
  // Generate the message to send to the client
  const currentTimeStamp = new Date().toISOString();
  eventData = `Hello From Server (Button Click) - ${currentTimeStamp}`;

  // Send the response to the client
  res.sendStatus(200);
  res.end(); // End the response after sending the response data
});

const clients = new Map();
let clientIdCounter = 1;

app.get('/events', (req, res) => {
  // Set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Generate a unique ID for the client
  const clientId = clientIdCounter++;

  // Store the response object to send data later
  clients.set(clientId, res);

  // Send initial data to the client
  res.write(`data: Initial Data from Server\n\n`);

  // Remove client from the list when the connection is closed
  req.on('close', () => {
    clients.delete(clientId);
  });
});

app.post('/send', express.json(), (req, res) => {
  const { firstName, lastName, mobile, appointmenttime, operatory } = req.body;
  const message = `Hello From Server - First Name: ${firstName}, Last Name: ${lastName}, Mobile: ${mobile}, ApptDateTime: ${appointmenttime}, Operatory: ${operatory} \n`;
  clients.forEach((client) => {
    client.write(`data: ${message}\n\n`);
  });
  res.status(200).send('Data sent to clients.');
});

// Start the server
const server = createServer(app);
server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
