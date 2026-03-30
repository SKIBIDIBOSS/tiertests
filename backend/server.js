// Socket.io for real-time chat
const activeTests = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join-test', (testId) => {
    socket.join(`test-${testId}`);  // ← FIXED: Added backticks
    activeTests.set(socket.id, testId);
    console.log(`Client joined test-${testId}`);
  });
  
  socket.on('chat-message', (data) => {
    io.to(`test-${data.testId}`).emit('chat-message', {  // ← Also check this line
      user: data.user,
      message: data.message,
      timestamp: new Date()
    });
  });
