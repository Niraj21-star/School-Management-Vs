const { Notice, NOTICE_PRIORITIES, NOTICE_STATUSES } = require('../models/Notice');
const { sendSuccess, sendError, isValidObjectId } = require('../services/academic.service');

const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, 'Notices fetched', notices);
  } catch (error) {
    return sendError(res, error);
  }
};

const createNotice = async (req, res) => {
  try {
    const { title, content, priority = 'Medium', status = 'Draft' } = req.body;

    if (!title || !content) {
      const error = new Error('title and content are required');
      error.statusCode = 400;
      throw error;
    }

    if (!NOTICE_PRIORITIES.includes(priority)) {
      const error = new Error(`priority must be one of: ${NOTICE_PRIORITIES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    if (!NOTICE_STATUSES.includes(status)) {
      const error = new Error(`status must be one of: ${NOTICE_STATUSES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const notice = await Notice.create({
      title: String(title).trim(),
      content: String(content).trim(),
      priority,
      status,
      author: req.user.name,
      createdBy: req.user._id,
    });

    return sendSuccess(res, 201, 'Notice created', notice);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid notice id');
      error.statusCode = 400;
      throw error;
    }

    const updates = {};

    if (req.body.title !== undefined) updates.title = String(req.body.title).trim();
    if (req.body.content !== undefined) updates.content = String(req.body.content).trim();
    if (req.body.priority !== undefined) {
      if (!NOTICE_PRIORITIES.includes(req.body.priority)) {
        const error = new Error(`priority must be one of: ${NOTICE_PRIORITIES.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }

      updates.priority = req.body.priority;
    }

    if (req.body.status !== undefined) {
      if (!NOTICE_STATUSES.includes(req.body.status)) {
        const error = new Error(`status must be one of: ${NOTICE_STATUSES.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }

      updates.status = req.body.status;
    }

    const notice = await Notice.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!notice) {
      const error = new Error('Notice not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Notice updated', notice);
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid notice id');
      error.statusCode = 400;
      throw error;
    }

    const notice = await Notice.findByIdAndDelete(id);
    if (!notice) {
      const error = new Error('Notice not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Notice deleted', notice);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
};
