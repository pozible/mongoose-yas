const mongoose = require('mongoose')
const slugGenerator = require('../.')
const chai = require('chai')
const should = chai.should()

mongoose.connect('mongodb://localhost:27017/mongoose-yas')
mongoose.set('useFindAndModify', false)

const Schema = new mongoose.Schema({
  author: String,
  title: String,
  friendlySlugs: Object,
  publisher: {type: String, default: 'PUB_1'},
  slug: {type: String, slugFrom: 'title', distinctUpTo: ['publisher']},
})
Schema.plugin(slugGenerator)
const Book = mongoose.model('Book', Schema)

describe('Normal usage', function () {
  after(function (done) {
    Book.deleteMany({}, function () {
      done()
    })
  })

  it('Creates a slug', function (done) {
    Book.create({
      title: 'i ♥ unicode',
      publisher: 'PUB_1'
    }, function (err, doc) {
      doc.should.have.property('slug').and.equal('i-love-unicode')
      doc.should.have.property('friendlySlugs').and.deep.equal({
        slug: {
          base: 'i-love-unicode',
          index: 0,
        }
      })
      done()
    })
  })

  it('Adds a prefix to second slug', function (done) {
    Book.create({
      title: 'i ♥ unicode',
      publisher: 'PUB_1'
    }, function (err, doc) {
      doc.should.have.property('slug').and.equal('i-love-unicode-1')
      doc.should.have.property('friendlySlugs').and.deep.equal({
        slug: {
          base: 'i-love-unicode',
          index: 1,
        }
      })
      done()
    })
  })

  describe('Updates slug when title changed', function () {
    it('Updates using doc.save', function (done) {
      const title = 'A new book'
      const newTitle = 'An old book'

      Book.create({ title }, function (err, doc) {
        doc.should.have.property('slug').and.equal('a-new-book')
        doc.should.have.property('friendlySlugs').and.deep.equal({
          slug: {
            base: 'a-new-book',
            index: 0,
          }
        })

        doc.title = newTitle
        doc.save(function (err, doc) {
          doc.should.have.property('slug').and.equal('an-old-book')
          doc.should.have.property('friendlySlugs').and.deep.equal({
            slug: {
              base: 'an-old-book',
              index: 0,
            }
          })
          done()
        })
      })
    })

    it('Updates using updateOne/findOneAndUpdate', function (done) {
      const title = 'Another book'
      const newTitle = 'Another book version 2'

      Book.create({ title }, function (err, doc) {
        doc.should.have.property('slug').and.equal('another-book')
        doc.should.have.property('friendlySlugs').and.deep.equal({
          slug: {
            base: 'another-book',
            index: 0,
          }
        })

        Book.findOneAndUpdate({ _id: doc._id }, { $set: { title: newTitle } }, {new: true}, function (err, doc) {
          doc.should.have.property('slug').and.equal('another-book-version-2')
          doc.should.have.property('friendlySlugs').and.deep.equal({
            slug: {
              base: 'another-book-version-2',
              index: 0,
            }
          })
          done()
        })
      })
    })

    it('Does not update slug when title not changed', function (done) {
      const author = 'Me'
      const title = 'A new book'

      Book.create({ author, title }, function (err1, book1) {
        book1.should.have.property('slug').and.equal('a-new-book')
        Book.create({ author, title }, function (err2, book2) {
          book2.should.have.property('slug').and.equal('a-new-book-1')
          Book.findOneAndUpdate({ _id: book2._id }, { $set: { title, author: 'You', publisher: book2.publisher } }, {new: true}, function (err, newBook2) {
            newBook2.should.have.property('author').and.equal('You')
            newBook2.should.have.property('title').and.equal(book2.title)
            newBook2.should.have.property('slug').and.equal(book2.slug)
            newBook2.should.have.property('friendlySlugs').and.deep.equal(book2.friendlySlugs)
            done()
          })
        })
      })
    })
  })

  it('Replace underscore to dash', function (done) {
    Book.create({
      title: 'it_has_underscore',
      publisher: 'PUB_1'
    }, function (err, doc) {
      doc.should.have.property('slug').and.equal('it-has-underscore')
      doc.should.have.property('friendlySlugs').and.deep.equal({
        slug: {
          base: 'it-has-underscore',
          index: 0,
        }
      })
      done()
    })
  })
})

describe('Nested slugFrom usage', function () {
  const Schema = new mongoose.Schema({
    address: Object,
    friendlySlugs: Object,
    slug: {type: String, slugFrom: 'address.street'},
  })
  Schema.plugin(slugGenerator)
  const Publisher = mongoose.model('Publisher', Schema)

  after(function (done) {
    Publisher.deleteMany({}, function () {
      done()
    })
  })

  it('Understands nested slugFrom ', function (done) {
    Publisher.create({
      address: {
        street: 'A Random St',
      },
    }, function (err, doc) {
      doc.should.have.property('slug').and.equal('a-random-st')
      doc.should.have.property('friendlySlugs').and.deep.equal({
        slug: {
          base: 'a-random-st',
          index: 0,
        }
      })
      done()
    })
  })
})