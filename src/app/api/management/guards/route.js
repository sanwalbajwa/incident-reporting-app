// Get all guards and rovers
const guards = await users
  .find({ 
    role: { $in: ['guard', 'rover'] },  // Include both guard and rover
    isActive: true 
  })
  .project({ 
    _id: 1, 
    fullName: 1, 
    email: 1, 
    employeeId: 1,
    phone: 1,
    createdAt: 1,
    lastLogin: 1,
    isActive: 1
  })
  .sort({ fullName: 1 })
  .toArray()