const socket = io();

socket.on('connect', () => {
  let id = document.getElementById('userId').value;
  socket.emit('joinNotificationsRoom', id);
});
