const mongoose = require('mongoose');

const schoolSettingSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
      trim: true,
      default: 'School Name',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    principal: {
      type: String,
      trim: true,
      default: '',
    },
    session: {
      type: String,
      trim: true,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const SchoolSetting = mongoose.model('SchoolSetting', schoolSettingSchema);

module.exports = SchoolSetting;
