const mongoose = require('mongoose');
const { GENDERS, STATUSES } = require('../models/Student');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const buildStudentFilters = (query) => {
  const filters = {};

  if (query.search) {
    filters.name = { $regex: query.search.trim(), $options: 'i' };
  }

  if (query.class) {
    filters['academic.class'] = query.class.trim();
  }

  if (query.section) {
    filters['academic.section'] = query.section.trim();
  }

  if (query.status) {
    if (query.status === 'all') {
      // Do not filter by status
    } else if (!STATUSES.includes(query.status)) {
      const error = new Error(`status must be one of: ${STATUSES.join(', ')} or all`);
      error.statusCode = 400;
      throw error;
    } else {
      filters.status = query.status;
    }
  } else {
    filters.status = 'active';
  }

  return filters;
};

const buildStudentListOptions = (query) => {
  const page = parsePositiveInt(query.page, 1);
  const limit = Math.min(parsePositiveInt(query.limit, 10), 100);
  const skip = (page - 1) * limit;

  const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'studentId', 'dob'];
  const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  return {
    page,
    limit,
    skip,
    sort: { [sortBy]: sortOrder },
  };
};

const normalizeStudentPayload = (payload, forUpdate = false) => {
  const requiredTopLevel = ['name', 'dob', 'gender', 'contact', 'address', 'parent', 'academic'];

  if (!forUpdate) {
    const missingFields = requiredTopLevel.filter((field) => payload[field] === undefined);
    if (missingFields.length > 0) {
      const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
  }

  const updates = {};

  if (payload.name !== undefined) updates.name = String(payload.name).trim();
  if (payload.dob !== undefined) updates.dob = payload.dob;

  if (payload.gender !== undefined) {
    if (!GENDERS.includes(payload.gender)) {
      const error = new Error(`gender must be one of: ${GENDERS.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    updates.gender = payload.gender;
  }

  if (payload.contact !== undefined) updates.contact = String(payload.contact).trim();
  if (payload.address !== undefined) updates.address = String(payload.address).trim();
  if (payload.passportPhoto !== undefined) updates.passportPhoto = String(payload.passportPhoto).trim();
  if (payload.surname !== undefined) updates.surname = String(payload.surname).trim();
  if (payload.email !== undefined) updates.email = String(payload.email).trim();

  if (payload.previousSchool !== undefined) updates.previousSchool = String(payload.previousSchool).trim();
  if (payload.caste !== undefined) updates.caste = String(payload.caste).trim();
  if (payload.subCaste !== undefined) updates.subCaste = String(payload.subCaste).trim();
  if (payload.placeOfBirth !== undefined) updates.placeOfBirth = String(payload.placeOfBirth).trim();
  if (payload.nationality !== undefined) updates.nationality = String(payload.nationality).trim();
  if (payload.fatherEducation !== undefined) updates.fatherEducation = String(payload.fatherEducation).trim();
  if (payload.motherEducation !== undefined) updates.motherEducation = String(payload.motherEducation).trim();

  if (payload.status !== undefined) {
    if (!STATUSES.includes(payload.status)) {
      const error = new Error(`status must be one of: ${STATUSES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    updates.status = payload.status;
  }

  if (payload.parent !== undefined) {
    const parent = payload.parent || {};

    if (!forUpdate) {
      const requiredParentFields = ['fatherName', 'motherName', 'parentContact'];
      const missingParentFields = requiredParentFields.filter((field) => !parent[field]);
      if (missingParentFields.length > 0) {
        const error = new Error(`Missing required parent fields: ${missingParentFields.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
    }

    updates.parent = {};
    if (parent.fatherName !== undefined) updates.parent.fatherName = String(parent.fatherName).trim();
    if (parent.motherName !== undefined) updates.parent.motherName = String(parent.motherName).trim();
    if (parent.parentContact !== undefined) {
      updates.parent.parentContact = String(parent.parentContact).trim();
    }
  }

  if (payload.academic !== undefined) {
    const academic = payload.academic || {};

    if (!forUpdate) {
      const requiredAcademicFields = ['class', 'section', 'admissionDate'];
      const missingAcademicFields = requiredAcademicFields.filter((field) => !academic[field]);
      if (missingAcademicFields.length > 0) {
        const error = new Error(`Missing required academic fields: ${missingAcademicFields.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
    }

    updates.academic = {};
    if (academic.class !== undefined) updates.academic.class = String(academic.class).trim();
    if (academic.section !== undefined) updates.academic.section = String(academic.section).trim();
    if (academic.rollNumber !== undefined) updates.academic.rollNumber = String(academic.rollNumber).trim();
    if (academic.admissionDate !== undefined) updates.academic.admissionDate = academic.admissionDate;
  }

  if (payload.documents !== undefined) {
    if (!Array.isArray(payload.documents)) {
      const error = new Error('documents must be an array of file URLs');
      error.statusCode = 400;
      throw error;
    }

    updates.documents = payload.documents.map((url) => String(url).trim()).filter(Boolean);
  }

  return updates;
};

module.exports = {
  isValidObjectId,
  buildStudentFilters,
  buildStudentListOptions,
  normalizeStudentPayload,
};