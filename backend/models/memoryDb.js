// In-memory Database Mock for fallback when MongoDB is not running

const memoryDb = {
  users: [],
  meetings: [],
  messages: []
};

// Generates a mock ObjectID string
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const MemoryUser = {
  findOne: async (query) => {
    return memoryDb.users.find(u => {
      if (query.username) return u.username.toLowerCase() === query.username.toLowerCase();
      if (query.token) return u.token === query.token;
      if (query._id) return u._id === query._id;
      return false;
    }) || null;
  },
  findById: async (id) => {
    return memoryDb.users.find(u => u._id === id) || null;
  },
  create: async (userData) => {
    const newUser = {
      _id: generateId(),
      name: userData.name,
      username: userData.username,
      password: userData.password,
      token: userData.token || '',
      avatar: userData.avatar || 'avatar1',
      createdAt: new Date(),
      ...userData
    };
    memoryDb.users.push(newUser);
    return newUser;
  },
  findByIdAndUpdate: async (id, updateData, options = {}) => {
    const index = memoryDb.users.findIndex(u => u._id === id);
    if (index === -1) return null;
    
    // Support mongoose $set syntax or flat object
    const actualUpdates = updateData.$set ? updateData.$set : updateData;
    
    memoryDb.users[index] = {
      ...memoryDb.users[index],
      ...actualUpdates
    };
    return memoryDb.users[index];
  }
};

export const MemoryMeeting = {
  findOne: async (query) => {
    return memoryDb.meetings.find(m => {
      if (query.roomId) return m.roomId === query.roomId;
      if (query._id) return m._id === query._id;
      return false;
    }) || null;
  },
  find: async (query = {}) => {
    let filtered = [...memoryDb.meetings];
    
    if (query.$or) {
      filtered = filtered.filter(m => {
        return query.$or.some(subQuery => {
          if (subQuery.creator) return m.creator === subQuery.creator;
          if (subQuery.participants) return m.participants.includes(subQuery.participants);
          return false;
        });
      });
    }
    
    // Sorting by createdAt desc
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filtered;
  },
  create: async (meetingData) => {
    const newMeeting = {
      _id: generateId(),
      roomId: meetingData.roomId,
      title: meetingData.title || 'Untitled Meeting',
      creator: meetingData.creator,
      participants: meetingData.participants || [],
      duration: meetingData.duration || 0,
      createdAt: new Date(),
      ...meetingData
    };
    memoryDb.meetings.push(newMeeting);
    return newMeeting;
  },
  deleteOne: async (query) => {
    const initialLength = memoryDb.meetings.length;
    memoryDb.meetings = memoryDb.meetings.filter(m => {
      if (query.roomId) return m.roomId !== query.roomId;
      if (query._id) return m._id !== query._id;
      return true;
    });
    return { deletedCount: initialLength - memoryDb.meetings.length };
  }
};

export const MemoryMessage = {
  find: async (query = {}) => {
    let filtered = [...memoryDb.messages];
    if (query.roomId) {
      filtered = filtered.filter(msg => msg.roomId === query.roomId);
    }
    filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return filtered;
  },
  create: async (messageData) => {
    const newMessage = {
      _id: generateId(),
      roomId: messageData.roomId,
      sender: messageData.sender,
      text: messageData.text,
      timestamp: new Date(),
      ...messageData
    };
    memoryDb.messages.push(newMessage);
    return newMessage;
  }
};
