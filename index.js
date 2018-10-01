const get = require('lodash.get')
const slug = require('slug')

module.exports = function(schema, options) {
  schema.pre('save', function() {
    const self = this
    const slugBase = getSlugBase(self, schema)

    if (get(self, 'friendlySlugs.slug.base') === slugBase) return

    const query = getQuery(self, schema, slugBase)
    return queryLastIndex(self, query).then(index => {
      const suffix = getSuffix(index)
      self.slug = `${slugBase}${suffix}`
      self.friendlySlugs = {
        slug: {
          base: slugBase,
          index,
        }
      }
    })
  })
}

const queryLastIndex = (self, query) => {
  return self.constructor.findOne(
    query,
    { friendlySlugs: 1 },
    { sort: { 'friendlySlugs.slug.index': -1 } }
  ).then(getIndex)
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

const getQuery = (self, schema, slugBase) => {
  const scope = getScope(self, schema)
  return Object.assign(scope, { 'friendlySlugs.slug.base': slugBase })
}

const getSlugBase = (self, schema) => {
  const slugFrom = get(schema, 'obj.slug.slugFrom')
  const target = slugFrom ? get(self, slugFrom) : self.title
  return generateSlug(target)
}

const getScope = (self, schema) => {
  const distinctUpTo = get(schema, 'obj.slug.distinctUpTo') || []
  return distinctUpTo.reduce((obj, key) => {
    obj[key] = self[key]
    return obj
  }, {})
}

const getSuffix = index => {
  return index > 0 ? `-${index}` : ``
}
