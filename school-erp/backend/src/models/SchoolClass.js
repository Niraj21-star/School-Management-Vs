const mongoose = require('mongoose');

const schoolClassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    sections: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

schoolClassSchema.pre('save', function normalizeSections() {
  if (Array.isArray(this.sections)) {
    this.sections = [...new Set(this.sections.map((section) => section.trim()).filter(Boolean))];
  }
});

const SchoolClass = mongoose.model('SchoolClass', schoolClassSchema);

module.exports = SchoolClass;