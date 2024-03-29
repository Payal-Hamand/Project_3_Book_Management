const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId

const reviewSchema = new mongoose.Schema({

    bookId:{
        type:ObjectId,
        ref: 'Books',
        required: true
    },
    reviewedBy:{
        type: String,
        required: true,
        default: 'guest'
        // value: String
    },
    reviewedAt:{
        type: Date,
        required: true
    },
    rating:{
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    review:{
        type: String,
    },
    isDeleted:{
        type: Boolean,
        default: false
    },
    deletedAt:{
        type:Date,
    }
})

module.exports = mongoose.model('reviews', reviewSchema)