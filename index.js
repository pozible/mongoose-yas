const get = require('lodash.get')
const slug = require('slug')

module.exports = function(schema, options) {
  schema.pre(['save', 'updateOne', 'findOneAndUpdate'], function() {
    const self = this
    const slugBase = getSlugBase.bind(this)(schema)

    if (get(this, 'friendlySlugs.slug.base') === slugBase || !slugBase) return

    const query = getQuery.bind(this)(schema, slugBase)
    return queryLastIndex.bind(this)(query).then(function(index) {
      const suffix = getSuffix(index)
      const slug = `${slugBase}${suffix}`
      const friendlySlugs = {
        slug: {
          base: slugBase,
          index,
        }
      }
      if (['updateOne', 'findOneAndUpdate'].includes(self.op)) {
        self._update.$set = Object.assign(self._update.$set, { slug, friendlySlugs })
      } else {
        self.slug = slug
        self.friendlySlugs = friendlySlugs
      }
    })
  })
}

function queryLastIndex(query) {
  const projection = { friendlySlugs: 1 }
  const opts = { sort: { 'friendlySlugs.slug.index': -1 } }
  return ['updateOne', 'findOneAndUpdate'].includes(this.op)
    ? this.model.findOne(query, projection, opts).then(getIndex)
    : this.constructor.findOne(query, projection, opts).then(getIndex)
}

const generateSlug = (target) => {
  slug.charmap['_'] = '-'
  return slug(target, { lower: true })
}

const getIndex = (data) => {
  const lastIndex = get(data, 'friendlySlugs.slug.index')
  const highestIndex = Number.isInteger(lastIndex) ? lastIndex : -1

  return highestIndex >= 0 ? highestIndex + 1 : 0
}

function getQuery(schema, slugBase) {
  const scope = getScope.bind(this)(schema)
  return Object.assign(scope, { 'friendlySlugs.slug.base': slugBase })
}

function getValueFromUpdate(slugFrom){ return get(this, `_update.$set.${slugFrom}`) }
function getSlugBaseValue(slugFrom) {
  if (slugFrom) return get(this, slugFrom) || getValueFromUpdate.bind(this)(slugFrom)
  return this.title || getValueFromUpdate.bind(this)('title')
}
function getSlugBase(schema) {
  const slugFrom = get(schema, 'obj.slug.slugFrom')
  const target = getSlugBaseValue.bind(this)(slugFrom)
  return generateSlug(target)
}

function getScope(schema) {
  const distinctUpTo = get(schema, 'obj.slug.distinctUpTo') || []
  return distinctUpTo.reduce((obj, key) => {
    obj[key] = ['updateOne', 'findOneAndUpdate'].includes(this.op) ? get(this, `_update.$set.${key}`) : this[key]
    return obj
  }, {})
}

const getSuffix = index => {
  return index > 0 ? `-${index}` : ``
}
