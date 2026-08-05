const User       = require('../models/User');
const Assignment = require('../models/Assignment');

// GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/students/:id
exports.getStudent = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/students
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, phone, studentId, grade, parentContact, address } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const student = await User.create({
      name, email, password: password || 'student123',
      role: 'student', phone, studentId, grade, parentContact, address,
    });

    res.status(201).json({ success: true, message: 'Student created successfully.', student });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const { name, email, phone, studentId, grade, parentContact, address, isActive } = req.body;

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { name, email, phone, studentId, grade, parentContact, address, isActive },
      { new: true, runValidators: true }
    );

    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, message: 'Student updated successfully.', student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Remove from assignments
    await Assignment.updateMany(
      { students: req.params.id },
      { $pull: { students: req.params.id } }
    );

    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/students/my-assignment  (for student role)
exports.getMyAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      students: req.user._id,
      isActive: true,
    })
      .populate('driver', 'name phone')
      .populate('bus')
      .populate('route');

    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
