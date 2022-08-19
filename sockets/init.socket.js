module.exports = socket => {
  socket.on('joinNotificationsRoom', id => {
    socket.join(id);
    console.log('joined', id);
  });
}
