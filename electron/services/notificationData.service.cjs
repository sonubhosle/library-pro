const Notification = require('../db/models/Notification.cjs');

/** Fetch all notifications for a user (admin) */
async function getAllNotifications(adminId) {
  // Assuming adminId corresponds to userId field
  return await Notification.find({ userId: adminId }).sort({ createdAt: -1 }).lean();
}

/** Mark a notification as read */
async function markNotificationRead(notificationId) {
  return await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true }).lean();
}

/** Delete a notification */
async function deleteNotification(notificationId) {
  await Notification.findByIdAndDelete(notificationId);
  return true;
}

module.exports = { getAllNotifications, markNotificationRead, deleteNotification };
