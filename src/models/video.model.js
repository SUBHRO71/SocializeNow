import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile:{  //couldinary url
            url:{
                type:String,  //for the frontend to play the video
                required:true,
            },
            public_id:{
                type:String, //for backend to delete the video later on from cloudinary
                required:true
            }
        },
        thumbnail:{ //cloudinary url
            url:{
                type:String,  
                required:true,
            },
             public_id:{
                type:String,
                required:true
            }
        },
        title: {
            type: String, 
            required: true
        },
        description: {
            type: String, 
            required: true
        },
        duration: {
            type: Number, 
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        category: {
            type: String,
            default: 'Uncategorized',
        },
        transcript: {
            type: String,
            default: '',
        },
        processingStatus: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        metadata: {
            size: Number,
            format: String,
            bitrate: String,
            resolution: String,
            codec: String,
            fps: Number,
            audioCodec: String,
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

    }, 
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ isPublished: 1 });

videoSchema.index({ processingStatus: 1 });

export const Video = mongoose.model("Video", videoSchema)