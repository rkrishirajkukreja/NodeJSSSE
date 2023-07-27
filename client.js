const eventButton = document.getElementById('eventButton');
const eventSource = new EventSource('/events');

eventButton.addEventListener('click', () => {
  // Send a custom event to the server
  fetch('/send-event', { method: 'POST' });
});
