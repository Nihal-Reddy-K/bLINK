import Meeting from '../models/Meeting.js';
import Message from '../models/Message.js';

// @desc    Create a new meeting
// @route   POST /api/meetings
// @access  Private
export const createMeeting = async (req, res) => {
  const { roomId, title } = req.body;

  try {
    if (!roomId) {
      return res.status(400).json({ success: false, message: 'Room ID is required' });
    }

    // Check if meeting with this room ID already exists
    let meeting = await Meeting.findOne({ roomId });
    if (meeting) {
      // If it exists, we can return it (rejoining or reusing a room ID)
      return res.status(200).json({
        success: true,
        message: 'Meeting room already exists, joining active room',
        meeting
      });
    }

    meeting = await Meeting.create({
      roomId,
      title: title || `Meeting - ${roomId}`,
      creator: req.user.username,
      participants: [req.user.username],
      duration: 0,
      createdAt: new Date()
    });

    res.status(201).json({ success: true, meeting });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ success: false, message: 'Server error creating meeting' });
  }
};

// @desc    Get user's meeting history
// @route   GET /api/meetings/history
// @access  Private
export const getMeetingHistory = async (req, res) => {
  const { search, date } = req.query;

  try {
    const username = req.user.username;

    // Search query: user must be creator or participant
    let query = {
      $or: [
        { creator: username },
        { participants: username }
      ]
    };

    // Text search if provided
    if (search) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { roomId: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Date filtering if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      if (!query.$and) {
        query.$and = [];
      }
      query.$and.push({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
    }

    const meetings = await Meeting.find(query);

    // Fetch message counts for each meeting to enrich the history list
    const enrichedHistory = await Promise.all(
      meetings.map(async (meeting) => {
        const messages = await Message.find({ roomId: meeting.roomId });
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        // Convert to standard object so we can add virtual fields
        const rawMeeting = JSON.parse(JSON.stringify(meeting));
        return {
          ...rawMeeting,
          messageCount: messages.length,
          lastMessage: lastMessage ? {
            sender: lastMessage.sender,
            text: lastMessage.text,
            timestamp: lastMessage.timestamp
          } : null
        };
      })
    );

    res.json({ success: true, history: enrichedHistory });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving history' });
  }
};

// @desc    Get details and chat history of a single meeting room
// @route   GET /api/meetings/:roomId
// @access  Private
export const getMeetingDetails = async (req, res) => {
  const { roomId } = req.params;

  try {
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting room not found' });
    }

    const messages = await Message.find({ roomId });

    res.json({
      success: true,
      meeting,
      messages
    });
  } catch (error) {
    console.error('Get meeting details error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving meeting details' });
  }
};

// @desc    Delete a meeting history item
// @route   DELETE /api/meetings/:roomId
// @access  Private
export const deleteMeetingHistory = async (req, res) => {
  const { roomId } = req.params;

  try {
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting room not found' });
    }

    // Only allow creator to delete history record or allow anyone to clear their local view
    // Here we will delete the record completely from the DB
    await Meeting.deleteOne({ roomId });

    res.json({ success: true, message: 'Meeting history item deleted successfully' });
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting history item' });
  }
};
