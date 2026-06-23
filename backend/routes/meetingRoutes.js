import express from 'express';
import {
  createMeeting,
  getMeetingHistory,
  getMeetingDetails,
  deleteMeetingHistory
} from '../controllers/meetingController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, createMeeting);
router.get('/history', protect, getMeetingHistory);
router.get('/:roomId', protect, getMeetingDetails);
router.delete('/:roomId', protect, deleteMeetingHistory);

export default router;
