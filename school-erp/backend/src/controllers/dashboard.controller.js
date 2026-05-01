const { Student } = require('../models/Student');
const { User } = require('../models/User');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const { Expense } = require('../models/Expense');
const { Notice } = require('../models/Notice');
const { Exam } = require('../models/Exam');
const Assignment = require('../models/Assignment');
const { Homework } = require('../models/Homework');
const Mark = require('../models/Mark');
const { sendSuccess, sendError } = require('../services/academic.service');

const toStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getAttendancePercent = async () => {
  const records = await Attendance.find({}, { students: 1 }).lean();

  let present = 0;
  let marked = 0;

  records.forEach((record) => {
    (record.students || []).forEach((entry) => {
      if (entry.status === 'present') present += 1;
      marked += 1;
    });
  });

  if (!marked) return 0;
  return Number(((present / marked) * 100).toFixed(1));
};

const getTodayAttendanceTotals = async (startOfDay, endOfDay) => {
  const summary = await Attendance.aggregate([
    {
      $match: {
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
    { $unwind: '$students' },
    {
      $group: {
        _id: null,
        presentStudents: {
          $sum: {
            $cond: [{ $eq: ['$students.status', 'present'] }, 1, 0],
          },
        },
        totalMarked: { $sum: 1 },
      },
    },
  ]);

  return {
    presentStudents: summary[0]?.presentStudents || 0,
    totalMarked: summary[0]?.totalMarked || 0,
  };
};

const getTodayPresentTeachers = async (startOfDay, endOfDay) => {
  const classSummary = await Attendance.aggregate([
    {
      $match: {
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
    {
      $group: {
        _id: null,
        classIds: { $addToSet: '$classId' },
      },
    },
  ]);

  const classIds = classSummary[0]?.classIds || [];
  if (!classIds.length) {
    return 0;
  }

  const teacherIds = await Assignment.distinct('teacherId', {
    classId: { $in: classIds },
  });

  if (!teacherIds.length) {
    return 0;
  }

  const activeTeacherCount = await User.countDocuments({
    _id: { $in: teacherIds },
    role: 'teacher',
    status: 'active',
  });

  return activeTeacherCount;
};

const getDashboardStats = async (req, res) => {
  try {
    const role = String(req.query.role || req.user.role || '').toUpperCase();
    const today = new Date();
    const startOfDay = toStartOfDay(today);
    const endOfDay = toEndOfDay(today);

    const [
      totalStudents,
      totalTeachers,
      attendancePercent,
      pendingFeesData,
      recentNoticeCount,
      todayAdmissions,
      todayCollectionData,
      pendingDocuments,
      teacherAssignments,
      todayAttendanceRecords,
      todayAttendanceSummary,
      presentTeachersToday,
      activeHomework,
    ] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'teacher', status: 'active' }),
      getAttendancePercent(),
      Fee.aggregate([
        { $match: { status: { $in: ['unpaid', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$dueAmount' } } },
      ]),
      Notice.countDocuments({
        status: 'Published',
        createdAt: {
          $gte: new Date(today.getFullYear(), today.getMonth(), 1),
        },
      }),
      Student.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Payment.aggregate([
        { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Student.countDocuments({
        $or: [
          { documents: { $exists: false } },
          { documents: { $size: 0 } },
        ],
      }),
      Assignment.countDocuments({ teacherId: req.user._id }),
      (async () => {
        if (req.user.role === 'teacher') {
          const assignments = await Assignment.find({ teacherId: req.user._id }).lean();
          const classIds = assignments.map(a => a.classId);
          return Attendance.countDocuments({
            date: { $gte: startOfDay, $lte: endOfDay },
            classId: { $in: classIds }
          });
        }
        return Attendance.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay } });
      })(),
      getTodayAttendanceTotals(startOfDay, endOfDay),
      getTodayPresentTeachers(startOfDay, endOfDay),
      Homework.countDocuments({ teacherId: req.user._id, status: 'Active' }),
    ]);

    const pendingFees = pendingFeesData[0]?.total || 0;
    const todayCollection = todayCollectionData[0]?.total || 0;

    const statsByRole = {
      ADMIN: {
        totalStudents,
        presentStudents: todayAttendanceSummary.presentStudents,
        todayMarkedStudents: todayAttendanceSummary.totalMarked,
        totalTeachers,
        presentTeachersToday,
        attendancePercent,
        pendingFees,
      },
      CLERK: {
        todayAdmissions,
        todayCollection,
        pendingDocuments,
      },
      TEACHER: {
        todayClasses: teacherAssignments,
        pendingAttendance: Math.max(0, teacherAssignments - todayAttendanceRecords),
        pendingHomework: activeHomework,
      },
    };

    const result = statsByRole[role] || statsByRole.ADMIN;
    return sendSuccess(res, 200, 'Dashboard stats fetched', result);
  } catch (error) {
    return sendError(res, error);
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const [recentStudents, recentPayments, recentNotices, recentExams] = await Promise.all([
      Student.find().sort({ createdAt: -1 }).limit(3).lean(),
      Payment.find().sort({ date: -1, createdAt: -1 }).limit(3).populate('studentId', 'name academic').lean(),
      Notice.find().sort({ createdAt: -1 }).limit(3).lean(),
      Exam.find().sort({ createdAt: -1 }).limit(3).lean(),
    ]);

    const items = [];

    recentStudents.forEach((student) => {
      items.push({
        id: `student-${student._id}`,
        action: 'New student admitted',
        detail: `${student.name} — Class ${student.academic?.class || ''}-${student.academic?.section || ''}`,
        createdAt: student.createdAt,
      });
    });

    recentPayments.forEach((payment) => {
      items.push({
        id: `payment-${payment._id}`,
        action: 'Fee collected',
        detail: `Rs. ${payment.amount} from ${payment.studentId?.name || 'Student'}`,
        createdAt: payment.date || payment.createdAt,
      });
    });

    recentNotices.forEach((notice) => {
      items.push({
        id: `notice-${notice._id}`,
        action: 'Notice published',
        detail: notice.title,
        createdAt: notice.createdAt,
      });
    });

    recentExams.forEach((exam) => {
      items.push({
        id: `exam-${exam._id}`,
        action: 'Exam schedule updated',
        detail: exam.name,
        createdAt: exam.updatedAt || exam.createdAt,
      });
    });

    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const now = Date.now();
    const formatted = items.slice(0, 10).map((item) => {
      const diffMs = Math.max(0, now - new Date(item.createdAt).getTime());
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let time = 'just now';
      if (diffDays > 0) {
        time = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        time = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      }

      return {
        id: item.id,
        action: item.action,
        detail: item.detail,
        time,
      };
    });

    return sendSuccess(res, 200, 'Recent activity fetched', formatted);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
};
