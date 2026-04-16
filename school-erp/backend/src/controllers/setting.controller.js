const SchoolSetting = require('../models/SchoolSetting');
const { sendSuccess, sendError } = require('../services/academic.service');

const DEFAULT_SETTINGS = {
  schoolName: 'Delhi Public School',
  email: 'admin@dps.edu.in',
  phone: '011-23456789',
  address: '123 Education Road, New Delhi, India',
  principal: 'Dr. Sharma',
  session: '2025-2026',
};

const getSchoolSettings = async (req, res) => {
  try {
    let settings = await SchoolSetting.findOne().lean();

    if (!settings) {
      settings = await SchoolSetting.create(DEFAULT_SETTINGS);
      settings = settings.toObject();
    }

    return sendSuccess(res, 200, 'School settings fetched', settings);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateSchoolSettings = async (req, res) => {
  try {
    const updates = {};
    const fields = ['schoolName', 'email', 'phone', 'address', 'principal', 'session'];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = String(req.body[field]).trim();
      }
    });

    updates.updatedBy = req.user._id;

    const existing = await SchoolSetting.findOne();

    let saved;
    if (!existing) {
      saved = await SchoolSetting.create({
        ...DEFAULT_SETTINGS,
        ...updates,
      });
    } else {
      Object.assign(existing, updates);
      saved = await existing.save();
    }

    return sendSuccess(res, 200, 'School settings updated', saved);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getSchoolSettings,
  updateSchoolSettings,
};
