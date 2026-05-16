const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// @route   GET /api/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name',
        },
      })
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/conversations
// @desc    Create or get 1-to-1 conversation
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required',
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: {
        $all: [req.user._id, participantId],
        $size: 2,
      },
    })
      .populate('participants', 'name email avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' },
      });

    if (conversation) {
      return res.json(conversation);
    }

    // Create new conversation
    conversation = await Conversation.create({
      isGroup: false,
      participants: [req.user._id, participantId],
    });

    conversation = await Conversation.findById(conversation._id).populate(
      'participants',
      'name email avatar isOnline lastSeen'
    );

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/conversations/group
// @desc    Create group conversation
// @access  Private
router.post('/group', protect, async (req, res) => {
  try {
    const { name, participants } = req.body;

    if (!name || !participants || participants.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Group name and at least 2 participants are required',
      });
    }

    const allParticipants = [...new Set([...participants, req.user._id.toString()])];

    const conversation = await Conversation.create({
      isGroup: true,
      name,
      participants: allParticipants,
      admins: [req.user._id],
      createdBy: req.user._id,
    });

    const populated = await Conversation.findById(conversation._id).populate(
      'participants',
      'name email avatar isOnline lastSeen'
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/conversations/group/:id
// @desc    Update group details
// @access  Private
router.put('/group/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    if (!conversation.admins.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update group details',
      });
    }

    const { name, avatar } = req.body;
    const updated = await Conversation.findByIdAndUpdate(
      req.params.id,
      { name, avatar },
      { new: true }
    ).populate('participants', 'name email avatar isOnline lastSeen');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/conversations/:id/members
// @desc    Add members to group
// @access  Private
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { members } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    if (!conversation.admins.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can add members',
      });
    }

    const updated = await Conversation.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { participants: { $each: members } } },
      { new: true }
    ).populate('participants', 'name email avatar isOnline lastSeen');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/conversations/:id/members/:userId
// @desc    Remove member from group
// @access  Private
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!conversation.admins.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove members',
      });
    }

    const updated = await Conversation.findByIdAndUpdate(
      req.params.id,
      { $pull: { participants: req.params.userId } },
      { new: true }
    ).populate('participants', 'name email avatar isOnline lastSeen');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/conversations/:id/leave
// @desc    Leave group
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    await Conversation.findByIdAndUpdate(req.params.id, {
      $pull: {
        participants: req.user._id,
        admins: req.user._id,
      },
    });

    res.json({ success: true, message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;