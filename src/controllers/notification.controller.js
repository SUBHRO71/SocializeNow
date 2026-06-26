import { Notification } from '../models/notification.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [notifications, totalDocs] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'username fullName avatar'),
    Notification.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalDocs / parseInt(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      docs: notifications,
      totalDocs,
      page: parseInt(page),
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      unreadCount: await Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    }, 'Notifications fetched')
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  return res.status(200).json(new ApiResponse(200, notification, 'Marked as read'));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );
  return res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

export { getNotifications, markAsRead, markAllAsRead };
