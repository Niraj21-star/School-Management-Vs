const mongoose = require('mongoose');
const ClassFee = require('../models/ClassFee');
const { sendSuccess, sendError, isValidObjectId } = require('../services/fee.service');

const getAllClassFees = async (req, res) => {
  try {
    const classFees = await ClassFee.find()
      .sort({ classPattern: 1 })
      .lean();

    return sendSuccess(res, 200, 'Class fees fetched successfully', classFees);
  } catch (error) {
    return sendError(res, error);
  }
};

const getClassFeeByPattern = async (req, res) => {
  try {
    const { classPattern } = req.params;

    const classFee = await ClassFee.findOne({ classPattern }).lean();
    if (!classFee) {
      const error = new Error('Class fee structure not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Class fee structure fetched successfully', classFee);
  } catch (error) {
    return sendError(res, error);
  }
};

const upsertClassFee = async (req, res) => {
  try {
    const { classPattern, totalAmount, breakdown } = req.body;

    if (!classPattern || totalAmount === undefined) {
      const error = new Error('classPattern and totalAmount are required');
      error.statusCode = 400;
      throw error;
    }

    const normalizedTotalAmount = Number(totalAmount);
    if (Number.isNaN(normalizedTotalAmount) || normalizedTotalAmount < 0) {
      const error = new Error('totalAmount must be non-negative');
      error.statusCode = 400;
      throw error;
    }

    // Clean and construct breakdown object
    const cleanBreakdown = {
      admission: Number(breakdown?.admission || 0),
      bdf: Number(breakdown?.bdf || 0),
      tuition: Number(breakdown?.tuition || 0),
      exam: Number(breakdown?.exam || 0),
      computer: Number(breakdown?.computer || 0),
      sport: Number(breakdown?.sport || 0),
      medical: Number(breakdown?.medical || 0),
      craft: Number(breakdown?.craft || 0),
      library: Number(breakdown?.library || 0),
      laboratory: Number(breakdown?.laboratory || 0),
      misc: Number(breakdown?.misc || 0),
      other: Number(breakdown?.other || 0),
    };

    const classFee = await ClassFee.findOneAndUpdate(
      { classPattern },
      {
        totalAmount: normalizedTotalAmount,
        breakdown: cleanBreakdown,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return sendSuccess(res, 201, 'Class fee structure saved successfully', classFee);
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteClassFee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid class fee id');
      error.statusCode = 400;
      throw error;
    }

    const classFee = await ClassFee.findByIdAndDelete(id);
    if (!classFee) {
      const error = new Error('Class fee structure not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Class fee structure deleted successfully', classFee);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getAllClassFees,
  getClassFeeByPattern,
  upsertClassFee,
  deleteClassFee,
};
