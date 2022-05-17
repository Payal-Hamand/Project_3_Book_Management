const { default: mongoose } = require('mongoose')
const userModel = require('../model/userModel')
const moment = require('moment')
const bookModel = require('../model/bookModel')
const reviewModel = require('../model/reviewModel')
const validator = require('../validator/validator')
const { findOne } = require('../model/userModel')

/*******************************Create Book ************************************** */
const createBooks = async function (req, res) {
    try{
    let data = req.body

    // handling edge cases

    if (validator.isValidRequestBody(data)) {
        return res.status(400).send({ status: false, message: 'Please provide input' })
    }

    let { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = data

    // checking authorisation here

    if ((req.userId != userId)) {
        return res.status(401).send({ status: false, message: 'User is not authorised' })
    }

    if (!validator.isValid(title)) {
        return res.status(400).send({ status: false, message: 'Please provide title' })
    }

    if (!validator.isValid(excerpt)) {
        return res.status(400).send({ status: false, message: 'Please provide excerpt' })
    }

    if (!validator.isValid(userId)) {
        return res.status(400).send({ status: false, message: 'Please provide userId' })
    }

    if (!validator.isValid(ISBN)) {
        return res.status(400).send({ status: false, message: 'Please provide ISBN' })
    }

    if (!validator.isValid(category)) {
        return res.status(400).send({ status: false, message: 'Please provide category' })
    }

    if (!validator.isValid(subcategory)) {
        return res.status(400).send({ status: false, message: 'Please provide subcategory' })
    }
    if (!validator.isValid(releasedAt)) {
        return res.status(400).send({ status: false, message: 'Please provide release Date' })
    }

    if (!validator.isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: 'Please provide valid objectID' })
    }

    // checking if title is unique
    let checkTitle = await bookModel.findOne({ title: data.title })
    if (checkTitle) {
        return res.status(400).send({ status: false, message: "Title already exist" })
    }

    // checking if ISBN is unique
    let checkISBN = await bookModel.findOne({ ISBN: data.ISBN })
    if (checkISBN) {
        return res.status(400).send({ status: false, message: "ISBN already exist" })
    }

    // checking if user exist in user document with the provided userId
    let checkUserId = await userModel.findById(data.userId);
    if (!checkUserId) {
        return res.status(404).send({ status: false, message: "No user found with this userID" });
    }

    if (!(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/).test(data.ISBN)) {
        return res.status(400).send({ status: false, message: 'ISBN should be valid' })
    }

    if (!(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/).test(data.releasedAt)) {
        return res.status(400).send({ status: false, message: 'Please enter date in given format' })
    }

    //  creating book document in book model

    let saveData = await bookModel.create(data)

    res.status(201).send({ status: true, message: 'success', data: saveData })
}catch (err) {
    return res.status(500).send({ status: false, msg: err.message })
}
}


module.exports.createBooks = createBooks


/*******************************get Book By query************************************** */

const getBooks = async function (req, res) {
    try {
        let data = req.query
        let filterQuery = {isDeleted:false}

        if (!validator.isValidObjectId(data.userId)) {
            return res.status(400).send({ status: false, message: 'Please provide valid objectID' })
        }
        if (validator.isValidRequestBody(data)) {
            let {  userId, category, subcategory} = data
            
            if (!validator.isValid(userId)&& !validator.isValidObjectId(userId)) {
                filterQuery ['userId'] = userId.trim()
            }

            if (!validator.isValid(category)) {
               filterQuery ['category'] = category.trim()
            }
        
            if (!validator.isValid(subcategory)) {
                filterQuery ['subcategory'] = subcategory.trim()
            }
        }
         // find the all data filter and query

        let books = await bookModel.find({ $and: [{ isDeleted: false }, data] })
        .sort({ title: 1 }) .select({ title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 });

        // check data exits or not
        if (books.length <= 0) {
            return res.status(404).send({ status: false, message: 'Data Not Found' })
        }
        return res.status(200).send({ status: true, message: "Books list", data: books })
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}
module.exports.getBooks = getBooks;

/*******************************get Book By bookId ************************************** */


const getBooksById = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        if (!validator.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Enter the valid bookId" });
        }
        let findBookId = await bookModel.findById({ _id: bookId }).select({ ISBN: 0 });

        if (!findBookId)
            return res.status(404).send({ status: false, message: "No Book Data Found" });

        // checking if book is not deleted and fields to select for response

        let reviewData = await reviewModel.find({ bookId: bookId, isDeleted: false }).select({ bookId: 1, reviewdBy: 1, rating: 1, review: 1 });
        let bookDataWithReviews = JSON.parse(JSON.stringify(findBookId))
        bookDataWithReviews.reviewData = reviewData
        return res.status(200).send({ status: true, message: "All books", data: bookDataWithReviews });
    }
     catch (err) {
        return res.status(500).send({ status: false, Error: err.message });
    }
};

module.exports.getBooksById = getBooksById;

/*******************************update Book ************************************** */

const updateBookById = async (req, res) => {
    try {
        const data = req.body
        const params = req.params
        const bookId = params.bookId
        const userId = req.userId 
       

        // handling edge cases

        if (!validator.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "bookId is not valid" })
        }
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is not valid" })
        }
        // checking if book document is already deleted 
        const books = await bookModel.findOne({_id:bookId,isDeleted:false})
        if(!books){
            return res.status(404).send({ status: false, message: "No Book Found" })
        }
        if(books.userId.toString() !== userId){
            return res.status(403).send({ status: false, message: "unauthorized access" })
        }
        if (validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please Provide something to Update" })
        }
        const { title, excerpt, ISBN, releasedAt } = data
        const updateBookData = {}

            if (!validator.isValid(title)) {
               const updateTitle = await bookModel.findOne({ title,_id:{$ne:bookId} })
            if (updateTitle)  {
                return res.status(400).send({ status: false, message: "Title Already Used" })
            }
                if(!Object.prototype.hasOwnProperty.call(updateBookData,'$set'))
                updateBookData ['$set'] = {}
                    updateBookData ['$set']['title'] = title
                }
            if (!validator.isValid(excerpt)) {
                if(!Object.prototype.hasOwnProperty.call(updateBookData,'$set'))
                updateBookData ['$set'] = {}
                    updateBookData ['$set']['excerpt'] = excerpt
            }
        
       
            if (!validator.isValid(ISBN)) {
                if (!(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/).test(data.ISBN)) {
                    return res.status(400).send({ status: false, message: "ISBN Should only contain Number and only 10 Or 13 digit" })
                }
                const ISBNfind = await bookModel.findOne({ ISBN,_id:{$ne:bookId} })
                if(ISBNfind){
                return res.status(400).send({ status: false, message: "ISBN Already Used" })}
                if(!Object.prototype.hasOwnProperty.call(updateBookData,'$set'))
                updateBookData ['$set'] = {}
                    updateBookData ['$set']['ISBN'] = ISBN
                }
           
            if (!validator.isValid(releasedAt)) {
            
            if (!(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/).test(releasedAt)) {
                return res.status(400).send({ status: false, message: "please provide date in valid format" })
            }
            if(!Object.prototype.hasOwnProperty.call(updateBookData,'$set'))
                updateBookData ['$set'] = {}
                    updateBookData ['$set']['releasedAt'] =releasedAt
            }
        // updating the document 
        const updatedBooks = await bookModel.findOneAndUpdate({ _id: bookId }, updateBookData, { new: true })  //releaseAt
        res.status(200).send({ status: true, message: "update successfully", data: updatedBooks })

    } catch (err) {
        return res.status(500).send({ status: false, Error: err.message })

    }
}

module.exports.updateBookById = updateBookById

/*******************************Delete Book ************************************** */

const deleteBooks = async function (req, res) {
    try{

        const params = req.params
        const bookId = params.bookId
        const userId = req.userId 

    if (!validator.isValidObjectId(bookId)) {
        return res.status(400).send({ status: false, message: 'Please provide valid objectID' })
    }
    if (!validator.isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: 'Please provide valid objectID' })
    }

    // checking if book exist with this Id
    let checkBookId = await bookModel.findById({ _id: bookId,isDeleted:false});
    if (!checkBookId) {
        return res.status(404).send({ status: false, message: "Book not found or is already deleted" });
    }
        // deleting the book document and sending response message 

        let deleteBook = await bookModel.findOneAndUpdate({ _id: bookId },
            { $set: { isDeleted: true, deletedAt: Date.now() } })

        return res.status(200).send({ status: true, message: "The book document is successfully deleted" })
   
}catch (err) {
    return res.status(500).send({ status: false, msg: err.message })
}
}


module.exports.deleteBooks = deleteBooks