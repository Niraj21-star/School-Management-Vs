import apiClient from './apiClient';

const API = apiClient;

const toUpperRole = (role = '') => String(role).toUpperCase();

const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

const unwrapResponse = (response) => {
  const payload = response?.data;

  if (payload?.success === false) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload?.data;
};

const toDateString = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
};

const mapStudent = (student) => {
  const className = student?.academic?.class || '';
  const section = student?.academic?.section || '';

  return {
    id: student?._id,
    studentId: student?.studentId,
    rollNo: student?.academic?.rollNumber || '-',
    name: student?.name || '-',
    class: section ? `${className}-${section}` : className,
    gender: student?.gender ? `${student.gender[0].toUpperCase()}${student.gender.slice(1)}` : '-',
    phone: student?.contact || '-',
    status: student?.status ? `${student.status[0].toUpperCase()}${student.status.slice(1)}` : 'Active',
    admissionDate: toDateString(student?.academic?.admissionDate),
    feeStatus: 'Pending',
    raw: student,
  };
};

const mapFeeStatus = (status) => {
  if (status === 'paid') return 'Paid';
  if (status === 'partial') return 'Partial';
  return 'Pending';
};

const mapFeeRecord = (feeDetails) => {
  const fee = feeDetails?.fee;
  const student = fee?.studentId;

  if (!fee || !student) return null;

  const className = student?.academic?.class || '';
  const section = student?.academic?.section || '';

  return {
    id: fee?._id,
    studentId: student?._id,
    studentName: student?.name || '-',
    class: section ? `${className}-${section}` : className,
    amount: fee?.totalAmount || 0,
    paid: fee?.paidAmount || 0,
    due: fee?.dueAmount || 0,
    status: mapFeeStatus(fee?.status),
    date: toDateString(fee?.updatedAt || fee?.createdAt),
    paymentHistory: feeDetails?.paymentHistory || [],
  };
};

const fetchStudentPageRaw = async (params = {}) => {
  const response = await apiClient.get('/api/students', { params });
  const data = unwrapResponse(response);
  return {
    students: data?.students || [],
    pagination: data?.pagination || null,
  };
};

const fetchStudentListRaw = async (params = {}) => {
  const { students } = await fetchStudentPageRaw(params);
  return students;
};

export const loginUser = async (email, password) => {
  try {
    const response = await API.post('/api/auth/login', { email, password });
    const data = unwrapResponse(response);

    return {
      token: data.token,
      user: {
        ...data.user,
        id: data.user.id,
        role: toUpperRole(data.user.role),
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Login failed. Please try again.'));
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/api/auth/me');
    const data = unwrapResponse(response);

    return {
      ...data.user,
      role: toUpperRole(data.user.role),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getStudents = async (params = {}) => {
  const queryKey = JSON.stringify(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));

  try {
    return await withShortCache(`students:${queryKey}`, 12000, async () => {
      const students = await fetchStudentListRaw(params);
      return students.map(mapStudent);
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch students.'));
  }
};

export const createStudent = async (formData) => {
  try {
    const classParts = String(formData.class || '').split('-');
    const academicClass = classParts[0] || '10';
    const section = classParts[1] || 'A';
    const today = new Date();
    const defaultDob = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());

    const payload = {
      name: formData.name,
      dob: formData.dob || defaultDob.toISOString().split('T')[0],
      gender: String(formData.gender || 'other').toLowerCase(),
      contact: formData.phone || '0000000000',
      address: formData.address || 'Not provided',
      passportPhoto: formData.passportPhoto || '',
      parent: {
        fatherName: formData.fatherName || 'Not provided',
        motherName: formData.motherName || 'Not provided',
        parentContact: formData.parentContact || formData.phone || '0000000000',
      },
      academic: {
        class: academicClass,
        section,
        rollNumber: formData.rollNo || formData.rollNumber,
        admissionDate: formData.admissionDate || new Date().toISOString().split('T')[0],
      },
      status: String(formData.status || 'active').toLowerCase(),
    };

    const response = await apiClient.post('/api/students', payload);
    const data = unwrapResponse(response);
    return mapStudent(data);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create student.'));
  }
};

export const updateStudentById = async (id, formData) => {
  try {
    const classParts = String(formData.class || '').split('-');
    const academicClass = classParts[0] || '10';
    const section = classParts[1] || 'A';

    const payload = {
      name: formData.name,
      contact: formData.phone,
      gender: String(formData.gender || '').toLowerCase(),
      passportPhoto: formData.passportPhoto,
      academic: {
        class: academicClass,
        section,
        rollNumber: formData.rollNo || formData.rollNumber,
      },
      status: String(formData.status || 'active').toLowerCase(),
    };

    const response = await apiClient.put(`/api/students/${id}`, payload);
    const data = unwrapResponse(response);
    return mapStudent(data);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to update student.'));
  }
};

export const deleteStudentById = async (id) => {
  try {
    const response = await apiClient.delete(`/api/students/${id}`);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete student.'));
  }
};

export const getAllStaff = async (params = {}) => {
  const queryKey = JSON.stringify(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));

  try {
    return await withShortCache(`staff:${queryKey}`, 12000, async () => {
      const response = await apiClient.get('/api/staff', { params });
      const data = unwrapResponse(response);
      return data?.staff || [];
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch staff.'));
  }
};

export const createStaff = async (payload) => {
  try {
    const response = await apiClient.post('/api/staff', payload);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create staff member.'));
  }
};

export const updateStaffById = async (id, payload) => {
  try {
    const response = await apiClient.put(`/api/staff/${id}`, payload);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to update staff member.'));
  }
};

export const deleteStaffById = async (id) => {
  try {
    const response = await apiClient.delete(`/api/staff/${id}`);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to deactivate staff member.'));
  }
};

export const getTeachers = async () => {
  try {
    const [staffList, assignments, subjects] = await Promise.all([
      getAllStaff({ role: 'teacher' }),
      getAssignments().catch(() => []),
      getSubjects().catch(() => []),
    ]);

    const subjectById = subjects.reduce((accumulator, subject) => {
      accumulator[subject._id] = subject;
      return accumulator;
    }, {});

    const assignmentMap = assignments.reduce((accumulator, item) => {
      const teacherId = item?.teacherId?._id;

      if (!teacherId) return accumulator;
      if (!accumulator[teacherId]) {
        accumulator[teacherId] = {
          classes: new Set(),
          subjects: new Set(),
        };
      }

      const subjectId = item?.subjectId?._id;
      const subjectName = item?.subjectId?.name || subjectById[subjectId]?.name;
      const className = item?.classId?.name;

      if (subjectName) accumulator[teacherId].subjects.add(subjectName);
      if (className) accumulator[teacherId].classes.add(className);

      return accumulator;
    }, {});

    return staffList.map((teacher) => {
      const teacherId = teacher.id || teacher._id;
      const details = assignmentMap[teacherId];
      const assignedClasses = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
      const fallbackClasses = assignedClasses.filter(Boolean);
      const resolvedClasses = details?.classes?.size ? Array.from(details.classes) : fallbackClasses;
      const subject = details?.subjects?.size
        ? Array.from(details.subjects).join(', ')
        : (teacher.subject || 'Not assigned');

      return {
        id: teacherId,
        name: teacher.name,
        subject,
        phone: teacher.contact || '-',
        email: teacher.email,
        classes: resolvedClasses,
        status: teacher.status === 'active' ? 'Active' : 'Inactive',
        joinDate: toDateString(teacher.createdAt),
        role: toUpperRole(teacher.role),
      };
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch teachers.'));
  }
};

export const getClasses = async () => {
  try {
    const response = await apiClient.get('/api/classes');
    const classes = unwrapResponse(response) || [];

    return classes.map((item) => ({
      id: item._id,
      name: item.name,
      sections: item.sections || [],
      students: 0,
      classTeacher: '—',
      raw: item,
    }));
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch classes.'));
  }
};

export const createClass = async ({ name, sections }) => {
  try {
    const response = await apiClient.post('/api/classes', { name, sections });
    const created = unwrapResponse(response);

    return {
      id: created._id,
      name: created.name,
      sections: created.sections || [],
      students: 0,
      classTeacher: '—',
      raw: created,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create class.'));
  }
};

export const updateClassById = async (id, payload) => {
  try {
    const response = await apiClient.put(`/api/classes/${id}`, payload);
    const updated = unwrapResponse(response);

    return {
      id: updated._id,
      name: updated.name,
      sections: updated.sections || [],
      students: 0,
      classTeacher: '—',
      raw: updated,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to update class.'));
  }
};

export const deleteClassById = async (id) => {
  try {
    const response = await apiClient.delete(`/api/classes/${id}`);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete class.'));
  }
};

export const getSubjects = async (classId) => {
  const cacheKey = classId ? `subjects:${classId}` : 'subjects:all';

  try {
    return await withShortCache(cacheKey, 12000, async () => {
      const response = await apiClient.get('/api/subjects', {
        params: classId ? { classId } : undefined,
      });
      return unwrapResponse(response) || [];
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch subjects.'));
  }
};

export const createSubject = async (payload) => {
  try {
    const response = await apiClient.post('/api/subjects', payload);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create subject.'));
  }
};

export const getAssignments = async () => {
  try {
    return await withShortCache('assignments:all', 12000, async () => {
      const response = await apiClient.get('/api/assignments');
      return unwrapResponse(response) || [];
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch assignments.'));
  }
};

export const createAssignment = async (payload) => {
  try {
    const response = await apiClient.post('/api/assignments', payload);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create assignment.'));
  }
};

export const getAttendance = async () => {
  try {
    const classes = await getClasses();
    const rows = [];
    const today = new Date().toISOString().split('T')[0];

    await Promise.all(
      classes.flatMap((schoolClass) =>
        (schoolClass.sections || []).map(async (section) => {
          try {
            const response = await apiClient.get('/api/attendance/report', {
              params: {
                classId: schoolClass.id,
                section,
              },
            });

            const data = unwrapResponse(response);
            const summary = data?.summary;
            const total = summary?.totalMarked || 0;
            const present = summary?.present || 0;
            const absent = summary?.absent || 0;

            rows.push({
              id: `${schoolClass.id}-${section}`,
              class: `${schoolClass.name}-${section}`,
              date: today,
              present,
              absent,
              total,
              percentage: summary?.presentPercentage || 0,
            });
          } catch {
            // Ignore classes that have no report yet.
          }
        })
      )
    );

    return rows.sort((a, b) => a.class.localeCompare(b.class));
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch attendance report.'));
  }
};

export const markAttendance = async ({ classId, section, date, students, markAllPresent = false }) => {
  try {
    const response = await apiClient.post('/api/attendance', {
      classId,
      section,
      date,
      students,
      markAllPresent,
    });
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to save attendance.'));
  }
};

export const getFees = async () => {
  try {
    const response = await apiClient.get('/api/fees');
    const data = unwrapResponse(response) || [];
    return data.map(mapFeeRecord).filter(Boolean);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch fee records.'));
  }
};

const ensureFeeStructure = async (studentId, totalAmount) => {
  try {
    await apiClient.get(`/api/fees/${studentId}`);
  } catch (error) {
    if (error?.response?.status !== 404) {
      throw error;
    }

    await apiClient.post('/api/fees', { studentId, totalAmount });
  }
};

export const recordPayment = async ({ studentId, amount, paid, mode = 'cash' }) => {
  try {
    if (!studentId) {
      throw new Error('Student ID is required.');
    }

    const totalAmount = Number(amount || 0);
    const paidAmount = Number(paid || 0);

    await ensureFeeStructure(studentId, totalAmount);

    if (paidAmount > 0) {
      await apiClient.post('/api/payments', {
        studentId: studentId,
        amount: paidAmount,
        mode,
      });
    }

    const feeResponse = await apiClient.get(`/api/fees/${studentId}`);
    return mapFeeRecord(unwrapResponse(feeResponse));
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to record payment.'));
  }
};

export const getExpenses = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/expenses', { params });
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch expenses.'));
  }
};

export const createExpense = async (payload) => {
  try {
    const response = await apiClient.post('/api/expenses', payload);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create expense.'));
  }
};

export const downloadBonafide = async (studentId) => {
  try {
    const response = await apiClient.get(`/api/documents/bonafide/${studentId}`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to download bonafide certificate.'));
  }
};

export const downloadTC = async (studentId) => {
  try {
    const response = await apiClient.get(`/api/documents/tc/${studentId}`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to download transfer certificate.'));
  }
};

export const downloadFeeReceipt = async (studentId, paymentId) => {
  try {
    const response = await apiClient.get(`/api/documents/receipt/${studentId}`, {
      params: paymentId ? { paymentId } : undefined,
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to download fee receipt.'));
  }
};

const mapDocumentRecord = (record) => ({
  id: record?._id,
  name: record?.name || '-',
  student: record?.student || '-',
  studentId: record?.studentId,
  type: record?.type || 'Other',
  date: toDateString(record?.date),
  status: record?.status || 'Uploaded',
  fileName: record?.fileName || '',
  fileMimeType: record?.fileMimeType || '',
  fileSize: record?.fileSize || 0,
  hasFile: Boolean(record?.hasFile),
});

const mapDuplicateTCRequest = (request) => ({
  id: request?.id,
  studentId: request?.studentId,
  studentName: request?.studentName || '-',
  studentCode: request?.studentCode || '-',
  requestedById: request?.requestedById,
  requestedByName: request?.requestedByName || '-',
  status: request?.status || 'pending',
  reason: request?.reason || '',
  adminComment: request?.adminComment || '',
  consumed: Boolean(request?.consumed),
  reviewedByName: request?.reviewedByName || '',
  reviewedAt: toDateString(request?.reviewedAt),
  createdAt: toDateString(request?.createdAt),
});

export const getDocumentRecords = async () => {
  try {
    const response = await apiClient.get('/api/documents');
    const data = unwrapResponse(response) || [];
    return data.map(mapDocumentRecord);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch document records.'));
  }
};

export const createDocumentRecord = async (payload) => {
  try {
    const response = await apiClient.post('/api/documents', payload);
    return mapDocumentRecord(unwrapResponse(response));
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create document record.'));
  }
};

export const deleteDocumentRecordById = async (id) => {
  try {
    const response = await apiClient.delete(`/api/documents/${id}`);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete document record.'));
  }
};

export const createDuplicateTCRequest = async (studentId, reason = '') => {
  try {
    const response = await apiClient.post(`/api/documents/tc/${studentId}/request-duplicate`, { reason });
    return mapDuplicateTCRequest(unwrapResponse(response));
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to submit duplicate TC request.'));
  }
};

export const getDuplicateTCRequests = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/documents/tc-duplicate-requests', { params });
    const data = unwrapResponse(response) || [];
    return data.map(mapDuplicateTCRequest);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch duplicate TC requests.'));
  }
};

export const reviewDuplicateTCRequest = async (requestId, action, adminComment = '') => {
  try {
    const response = await apiClient.patch(`/api/documents/tc-duplicate-requests/${requestId}/review`, {
      action,
      adminComment,
    });
    return mapDuplicateTCRequest(unwrapResponse(response));
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to review duplicate TC request.'));
  }
};

const mapNotice = (notice) => ({
  id: notice?._id,
  title: notice?.title || '-',
  content: notice?.content || '-',
  date: toDateString(notice?.createdAt),
  author: notice?.author || '-',
  status: notice?.status || 'Draft',
  priority: notice?.priority || 'Medium',
});

const mapExam = (exam) => ({
  id: exam?._id,
  name: exam?.name || '-',
  class: exam?.class || 'All',
  startDate: toDateString(exam?.startDate),
  endDate: toDateString(exam?.endDate),
  status: exam?.status || 'Upcoming',
});

// Prevent duplicate dashboard network calls caused by rapid remounts in development.
const responseCache = new Map();

const readCache = (key) => {
  const item = responseCache.get(key);
  if (!item) return null;

  if (item.promise) {
    return item.promise;
  }

  if (item.expiresAt > Date.now()) {
    return Promise.resolve(item.data);
  }

  responseCache.delete(key);
  return null;
};

const withShortCache = async (key, ttlMs, fetcher) => {
  const cached = readCache(key);
  if (cached) {
    return cached;
  }

  const inFlight = (async () => {
    try {
      const data = await fetcher();
      responseCache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
      });
      return data;
    } catch (error) {
      responseCache.delete(key);
      throw error;
    }
  })();

  responseCache.set(key, {
    promise: inFlight,
    expiresAt: Date.now() + ttlMs,
  });

  return inFlight;
};

export const getDashboardStats = async (role) => {
  const normalizedRole = String(role || '').toUpperCase();
  const cacheKey = `dashboard:stats:${normalizedRole}`;

  try {
    return await withShortCache(cacheKey, 15000, async () => {
      const response = await apiClient.get('/api/dashboard/stats', {
        params: { role: normalizedRole },
      });
      return unwrapResponse(response);
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch dashboard stats.'));
  }
};

export const getExams = async () => {
  try {
    const response = await apiClient.get('/api/exams');
    const data = unwrapResponse(response) || [];
    return data.map(mapExam);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch exams.'));
  }
};

export const createExam = async (payload) => {
  try {
    const response = await apiClient.post('/api/exams', payload);
    return mapExam(unwrapResponse(response));
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create exam.'));
  }
};

export const getTimetable = async () => {
  try {
    const response = await apiClient.get('/api/timetable');
    return unwrapResponse(response) || [];
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch timetable.'));
  }
};

export const getNotices = async () => {
  try {
    const response = await apiClient.get('/api/notices');
    const data = unwrapResponse(response) || [];
    return data.map(mapNotice);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch notices.'));
  }
};

export const createNotice = async (payload) => {
  try {
    const response = await apiClient.post('/api/notices', payload);
    return mapNotice(unwrapResponse(response));
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create notice.'));
  }
};

export const updateNoticeById = async (id, payload) => {
  try {
    const response = await apiClient.patch(`/api/notices/${id}`, payload);
    return mapNotice(unwrapResponse(response));
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to update notice.'));
  }
};

export const deleteNoticeById = async (id) => {
  try {
    const response = await apiClient.delete(`/api/notices/${id}`);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete notice.'));
  }
};

export const getRecentActivity = async () => {
  try {
    return await withShortCache('dashboard:recent-activity', 10000, async () => {
      const response = await apiClient.get('/api/dashboard/recent-activity');
      return unwrapResponse(response) || [];
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch recent activity.'));
  }
};

export const getAllStudentsForReports = async ({ pageSize = 100 } = {}) => {
  const normalizedPageSize = Math.min(Math.max(Number(pageSize) || 100, 1), 100);
  const allStudents = [];
  let page = 1;
  let totalPages = 1;

  try {
    while (page <= totalPages) {
      const { students, pagination } = await fetchStudentPageRaw({
        page,
        limit: normalizedPageSize,
      });

      allStudents.push(...students);
      totalPages = pagination?.totalPages || 1;
      page += 1;
    }

    return allStudents.map(mapStudent);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch students for report export.'));
  }
};

export const getMarksByExamAndClass = async ({ className, section, examName, subjectName }) => {
  try {
    const response = await apiClient.get('/api/marks', {
      params: {
        class: className,
        section,
        examName,
        subjectName,
      },
    });

    const data = unwrapResponse(response) || [];

    return data.map((item) => ({
      id: item?._id,
      studentId: item?.studentId?._id,
      marks: item?.marks,
      grade: item?.grade,
    }));
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch marks.'));
  }
};

export const saveMarksBulk = async ({ className, section, examName, subjectName, entries }) => {
  try {
    const response = await apiClient.post('/api/marks/bulk', {
      className,
      section,
      examName,
      subjectName,
      entries,
    });

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to save marks.'));
  }
};

const mapHomework = (item) => ({
  id: item?._id,
  class: item?.className && item?.section ? `${item.className}-${item.section}` : '-',
  subject: item?.subject || '-',
  title: item?.title || '-',
  description: item?.description || '',
  dueDate: toDateString(item?.dueDate),
  status: item?.status || 'Active',
});

export const getHomework = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/homework', { params });
    const data = unwrapResponse(response) || [];
    return data.map(mapHomework);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch homework list.'));
  }
};

export const createHomework = async (payload) => {
  try {
    const response = await apiClient.post('/api/homework', payload);
    return mapHomework(unwrapResponse(response));
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create homework.'));
  }
};

export const deleteHomeworkById = async (id) => {
  try {
    const response = await apiClient.delete(`/api/homework/${id}`);
     return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete homework.'));
  }
};

export const getSchoolSettings = async () => {
  try {
    const response = await apiClient.get('/api/settings');
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to fetch school settings.'));
  }
};

export const updateSchoolSettings = async (payload) => {
  try {
    const response = await apiClient.put('/api/settings', payload);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to update school settings.'));
  }
};


