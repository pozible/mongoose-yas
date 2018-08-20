[![npm (scoped)](https://img.shields.io/npm/v/@pozible/mongoose-yas.svg)](https://www.npmjs.com/package/@pozible/mongoose-yas)
[![Build Status](https://travis-ci.org/pozi-team/mongoose-yas.svg?branch=master)](https://travis-ci.org/pozi-team/mongoose-yas)

# mongoose-yas
Mongoose Yet Another Slug, follows the same idea to create a slug based on [meteor-friendly-slugs](https://github.com/todda00/meteor-friendly-slugs). This package uses same API and data structure:

```
{
  slug: 'your-slug', // Actual slug can be used in your app
  friendSlugs: { // Should be used by the plugin only
    slug: {
      base: 'your-slug', // Slug result from `slugFrom` without index
      index: 0, // Index of `slug` that is in the same `base`
    }
  }
}
```

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
**Important**: `slug` and `friendlySlugs` are required attributes that must be declared in schema.

## Limitations
- Fixed `slug` and `friendlySlugs` attributes that must be declared in schema to make the plugin works.
- and few other more.
