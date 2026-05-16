const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { protect } = require('../middleware/auth');

// @route   GET /api/messages/:conversationId
// @desc    Get messages for a conversation (paginated)
// @access  Private
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const total = await Message.countDocuments({
      conversation: req.params.conversationId,
    });

    const messages = await Message.find({
      conversation: req.params.conversationId,
    })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      messages: messages.reverse(),
      hasMore: total > skip + messages.length,
      total,
      page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/messages
// @desc    Send a message (REST fallback)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { conversation, content, type, fileUrl, fileName, fileSize } = req.body;

    const conv = await Conversation.findById(conversation);
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const message = await Message.create({
      conversation,
      sender: req.user._id,
      content,
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize,
      readBy: [req.user._id],
      deliveredTo: [req.user._id],
    });

    await Conversation.findByIdAndUpdate(conversation, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    const populated = await Message.findById(message._id).populate(
      'sender',
      'name email avatar'
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/messages/:id
// @desc    Edit a message
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { content } = req.body;

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.content = content;
    message.edited = true;
    await message.save();

    const populated = await Message.findById(message._id).populate(
      'sender',
      'name email avatar'
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message (soft delete)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.deleted = true;
    message.content = '';
    message.fileUrl = null;
    await message.save();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/messages/:id/read
// @desc    Mark conversation messages as read
// @access  Private
router.post('/:conversationId/read', protect, async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        readBy: { $ne: req.user._id },
        sender: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
        status: 'read',
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/messages/:id/reaction
// @desc    Add emoji reaction to message
// @access  Private
router.post('/:id/reaction', protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      (r) => r.user.toString() !== req.user._id.toString()
    );

    // Add new reaction
    message.reactions.push({ user: req.user._id, emoji });
    await message.save();

    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/messages/:id/reaction
// @desc    Remove emoji reaction
// @access  Private
router.delete('/:id/reaction', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.reactions = message.reactions.filter(
      (r) => r.user.toString() !== req.user._id.toString()
    );

    await message.save();

    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;