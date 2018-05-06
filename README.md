[![Build Status](https://travis-ci.org/pozi-team/mongoose-yas.svg?branch=master)](https://travis-ci.org/pozi-team/mongoose-yas)

# mongoose-yas
Mongoose Yet Another Slug, follows the same idea to create a slug based on [meteor-friendly-slugs](https://github.com/todda00/meteor-friendly-slugs).

## Usage

```
const mongoose = require('mongoose')
const mongooseyas = require('@pozible/mongoose-yas')

const Schema = new mongoose.Schema({
  title: {type: String},
  friendlySlugs: Object,
  publisher: {type: String},
  slug: {type: String, slugFrom: 'title', distinctUpTo: ['publisher']},
})

Schema.plugin(mongooseyas)

const Book = mongoose.model('Book', Schema)

Book.create({
  title: 'i ♥ unicode',
  publisher: 'PUB_1'
}, function(book) {
  console.log(book.slug)
})
```

## Limitations
- Only generate a slug on create.
- The 'slug' will always be stored in `slug` as it needs to be created in the schema with available options.
- and a lot more.
