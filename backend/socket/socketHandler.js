import Meeting from '../models/Meeting.js';
import Message from '../models/Message.js';

// In-memory store for active meeting rooms
const activeRooms = {};

export default function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins a room (either directly or after waiting room approval)
    socket.on('join-room', async ({ roomId, username, name, avatar }) => {
      console.log(`User ${username} (${name}) requesting to join room ${roomId}`);
      
      socket.join(roomId);
      
      // Initialize room in activeRooms if it doesn't exist
      if (!activeRooms[roomId]) {
        activeRooms[roomId] = {
          creatorUsername: null,
          startTime: Date.now(),
          participants: {},
          waitingList: {}
        };
        
        // Lookup meeting in DB to find creator
        try {
          const meeting = await Meeting.findOne({ roomId });
          if (meeting) {
            activeRooms[roomId].creatorUsername = meeting.creator;
          }
        } catch (err) {
          console.error('Error fetching meeting creator for socket room:', err);
        }
      }

      // Add user to participants list
      activeRooms[roomId].participants[socket.id] = {
        socketId: socket.id,
        username,
        name,
        avatar: avatar || 'avatar1',
        audio: true,
        video: true,
        screenShare: false,
        handRaised: false,
        networkQuality: 'excellent',
        joinedAt: Date.now()
      };

      const participants = activeRooms[roomId].participants;
      const participantList = Object.values(participants);

      // Save user to the Meeting record participants list in MongoDB
      try {
        const meeting = await Meeting.findOne({ roomId });
        if (meeting) {
          if (!meeting.participants.includes(username)) {
            const updatedParticipants = [...meeting.participants, username];
            await Meeting.raw.updateOne(
              { roomId },
              { $set: { participants: updatedParticipants } }
            ).catch(() => {}); // Fallback support if using memoryDb
          }
        }
      } catch (err) {
        console.error('Error updating meeting participants in DB:', err);
      }

      // 1. Tell the joining user who else is in the room
      // Exclude current socket
      const otherPeers = participantList.filter(p => p.socketId !== socket.id);
      socket.emit('all-peers', otherPeers);

      // 2. Broadcast to other users in the room that this user joined
      socket.to(roomId).emit('peer-joined', {
        socketId: socket.id,
        username,
        name,
        avatar: avatar || 'avatar1',
        audio: true,
        video: true,
        screenShare: false,
        handRaised: false,
        networkQuality: 'excellent'
      });

      // Update room participant count
      io.to(roomId).emit('room-info', {
        roomId,
        participantCount: participantList.length,
        participants: participantList
      });
    });

    // WebRTC Signaling: SDP Offer
    socket.on('send-offer', ({ targetSocketId, offer }) => {
      console.log(`Forwarding offer from ${socket.id} to ${targetSocketId}`);
      io.to(targetSocketId).emit('receive-offer', {
        senderSocketId: socket.id,
        offer
      });
    });

    // WebRTC Signaling: SDP Answer
    socket.on('send-answer', ({ targetSocketId, answer }) => {
      console.log(`Forwarding answer from ${socket.id} to ${targetSocketId}`);
      io.to(targetSocketId).emit('receive-answer', {
        senderSocketId: socket.id,
        answer
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('send-ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('receive-ice-candidate', {
        senderSocketId: socket.id,
        candidate
      });
    });

    // Media and status toggles (Audio, Video, ScreenShare, Raise Hand, etc.)
    socket.on('toggle-media', ({ roomId, type, status }) => {
      if (activeRooms[roomId] && activeRooms[roomId].participants[socket.id]) {
        activeRooms[roomId].participants[socket.id][type] = status;
        
        // Broadcast change to other users in the room
        socket.to(roomId).emit('peer-media-toggled', {
          socketId: socket.id,
          type,
          status
        });

        // Send updated participants list
        io.to(roomId).emit('room-info', {
          roomId,
          participantCount: Object.keys(activeRooms[roomId].participants).length,
          participants: Object.values(activeRooms[roomId].participants)
        });
      }
    });

    // Network quality update
    socket.on('update-network-quality', ({ roomId, quality }) => {
      if (activeRooms[roomId] && activeRooms[roomId].participants[socket.id]) {
        activeRooms[roomId].participants[socket.id].networkQuality = quality;
        socket.to(roomId).emit('peer-network-updated', {
          socketId: socket.id,
          quality
        });
      }
    });

    // Active Speaker update
    socket.on('active-speaker', ({ roomId, isSpeaking }) => {
      socket.to(roomId).emit('peer-speaking', {
        socketId: socket.id,
        isSpeaking
      });
    });

    // Send emoji reaction
    socket.on('send-reaction', ({ roomId, emoji }) => {
      if (activeRooms[roomId] && activeRooms[roomId].participants[socket.id]) {
        const senderName = activeRooms[roomId].participants[socket.id].name;
        io.to(roomId).emit('receive-reaction', {
          socketId: socket.id,
          senderName,
          emoji
        });
      }
    });

    // Real-time Chat message
    socket.on('send-chat-message', async ({ roomId, text }) => {
      if (activeRooms[roomId] && activeRooms[roomId].participants[socket.id]) {
        const participant = activeRooms[roomId].participants[socket.id];
        
        try {
          // Save message in MongoDB
          const message = await Message.create({
            roomId,
            sender: participant.username,
            text,
            timestamp: new Date()
          });

          // Broadcast message to everyone in the room
          io.to(roomId).emit('receive-chat-message', {
            _id: message._id,
            roomId,
            sender: participant.username,
            senderName: participant.name,
            text: message.text,
            timestamp: message.timestamp
          });
        } catch (err) {
          console.error('Error saving chat message:', err);
        }
      }
    });

    // Typing indicator
    socket.on('typing', ({ roomId, isTyping }) => {
      if (activeRooms[roomId] && activeRooms[roomId].participants[socket.id]) {
        const username = activeRooms[roomId].participants[socket.id].username;
        const name = activeRooms[roomId].participants[socket.id].name;
        socket.to(roomId).emit('peer-typing', {
          socketId: socket.id,
          username,
          name,
          isTyping
        });
      }
    });

    // --- WAITING ROOM LOGIC ---

    // Join waiting room queue
    socket.on('join-waiting-room', ({ roomId, username, name, avatar }) => {
      console.log(`User ${username} joined waiting room for room ${roomId}`);
      
      socket.join(`${roomId}-waiting`);

      if (!activeRooms[roomId]) {
        activeRooms[roomId] = {
          creatorUsername: null,
          startTime: Date.now(),
          participants: {},
          waitingList: {}
        };
      }

      activeRooms[roomId].waitingList[socket.id] = {
        socketId: socket.id,
        username,
        name,
        avatar: avatar || 'avatar1'
      };

      // Notify the meeting room (specifically the creator/participants) about the waiting user
      io.to(roomId).emit('waiting-room-update', {
        waitingList: Object.values(activeRooms[roomId].waitingList)
      });
      
      // Let the waiting user know they are in the waiting queue
      socket.emit('waiting-room-status', { status: 'waiting' });
    });

    // Creator fetches waiting list
    socket.on('get-waiting-list', ({ roomId }) => {
      if (activeRooms[roomId]) {
        socket.emit('waiting-room-update', {
          waitingList: Object.values(activeRooms[roomId].waitingList)
        });
      }
    });

    // Action on waiting user (approve or deny)
    socket.on('waiting-room-action', ({ roomId, targetSocketId, action }) => {
      if (activeRooms[roomId] && activeRooms[roomId].waitingList[targetSocketId]) {
        const waitingUser = activeRooms[roomId].waitingList[targetSocketId];
        delete activeRooms[roomId].waitingList[targetSocketId];

        // Notify room about updated waiting list
        io.to(roomId).emit('waiting-room-update', {
          waitingList: Object.values(activeRooms[roomId].waitingList)
        });

        if (action === 'approve') {
          // Tell the specific socket that they are approved
          io.to(targetSocketId).emit('waiting-room-status', { status: 'approved' });
        } else {
          // Tell the specific socket that they are denied
          io.to(targetSocketId).emit('waiting-room-status', { status: 'denied' });
        }
      }
    });

    // Leaving the room manually
    socket.on('leave-room', ({ roomId }) => {
      console.log(`User ${socket.id} leaving room ${roomId}`);
      handleRoomCleanup(socket, roomId, io);
      socket.leave(roomId);
    });

    // Disconnection
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Find which room this user was in
      for (const roomId in activeRooms) {
        if (activeRooms[roomId].participants[socket.id]) {
          handleRoomCleanup(socket, roomId, io);
        }
        if (activeRooms[roomId].waitingList[socket.id]) {
          delete activeRooms[roomId].waitingList[socket.id];
          io.to(roomId).emit('waiting-room-update', {
            waitingList: Object.values(activeRooms[roomId].waitingList)
          });
        }
      }
    });
  });
}

// Helper to handle user removal and room duration saving
async function handleRoomCleanup(socket, roomId, io) {
  const room = activeRooms[roomId];
  if (!room) return;

  const participant = room.participants[socket.id];
  if (!participant) return;

  console.log(`Cleaning up user ${participant.username} from room ${roomId}`);

  // Delete participant
  delete room.participants[socket.id];

  // Notify other peers in the room
  socket.to(roomId).emit('peer-left', {
    socketId: socket.id,
    username: participant.username,
    name: participant.name
  });

  const remainingParticipants = Object.values(room.participants);

  // Update room info
  io.to(roomId).emit('room-info', {
    roomId,
    participantCount: remainingParticipants.length,
    participants: remainingParticipants
  });

  // If no one is left in the room, update the meeting duration in DB and delete room from memory
  if (remainingParticipants.length === 0) {
    const elapsedSeconds = Math.floor((Date.now() - room.startTime) / 1000);
    console.log(`Room ${roomId} is empty. Total duration: ${elapsedSeconds} seconds.`);
    
    try {
      await Meeting.raw.updateOne(
        { roomId },
        { $set: { duration: elapsedSeconds } }
      ).catch(() => {}); // Fallback support if using memoryDb
    } catch (err) {
      console.error('Error updating meeting duration:', err);
    }
    
    delete activeRooms[roomId];
  }
}
