import mongoose from 'mongoose';
import { Subscription } from '../models/subscription.model.js';
import { Video } from '../models/video.model.js';
import { Tweet } from '../models/tweet.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getFeed = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, type = 'all' } = req.query;

  // Get channels the user is subscribed to
  const subscriptions = await Subscription.find({ subscriber: userId }).select('channel');
  const channelIds = subscriptions.map(sub => sub.channel);

  if (channelIds.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, { docs: [], totalDocs: 0, page: parseInt(page), totalPages: 0 }, 'No subscriptions yet')
    );
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);
  let feedItems = [];
  let totalDocs = 0;

  if (type === 'videos' || type === 'all') {
    const videoPipeline = [
      { $match: { owner: { $in: channelIds }, isPublished: true } },
      { $sort: { createdAt: -1 } },
      { $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
        pipeline: [
          { $project: { username: 1, fullName: 1, avatar: 1 } }
        ]
      }},
      { $unwind: '$owner' },
      { $addFields: { contentType: 'video' } },
    ];

    if (type === 'videos') {
      const countResult = await Video.aggregate([...videoPipeline, { $count: 'total' }]);
      totalDocs = countResult[0]?.total || 0;
      feedItems = await Video.aggregate([...videoPipeline, { $skip: skip }, { $limit: limitNum }]);
    } else {
      feedItems.push(...await Video.aggregate(videoPipeline));
    }
  }

  if (type === 'tweets' || type === 'all') {
    const tweetPipeline = [
      { $match: { owner: { $in: channelIds } } },
      { $sort: { createdAt: -1 } },
      { $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
        pipeline: [
          { $project: { username: 1, fullName: 1, avatar: 1 } }
        ]
      }},
      { $unwind: '$owner' },
      { $addFields: { contentType: 'tweet' } },
    ];

    if (type === 'tweets') {
      const countResult = await Tweet.aggregate([...tweetPipeline, { $count: 'total' }]);
      totalDocs = countResult[0]?.total || 0;
      feedItems = await Tweet.aggregate([...tweetPipeline, { $skip: skip }, { $limit: limitNum }]);
    } else {
      feedItems.push(...await Tweet.aggregate(tweetPipeline));
    }
  }

  if (type === 'all') {
    // Merge and sort by createdAt
    feedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    totalDocs = feedItems.length;
    feedItems = feedItems.slice(skip, skip + limitNum);
  }

  const totalPages = Math.ceil(totalDocs / limitNum);

  return res.status(200).json(
    new ApiResponse(200, {
      docs: feedItems,
      totalDocs,
      page: parseInt(page),
      limit: limitNum,
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
    }, 'Feed fetched successfully')
  );
});

export { getFeed };
