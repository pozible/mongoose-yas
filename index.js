const get = require('lodash.get')
const slug = require('slug')

module.exports = function(schema, options) {
  schema.pre('save', async function() {
    const slugFrom = get(schema, 'obj.slug.slugFrom')
    const target = slugFrom ? this[slugFrom] : this.title
    const slugBase = slug(target).toLowerCase()

    if (get(this, 'friendlySlugs.slug.base') !== slugBase) {
      const distinctUpTo = get(schema, 'obj.slug.distinctUpTo') || []
      const scope = distinctUpTo.reduce((obj, key) => {
        obj[key] = this[key]
        return obj
      }, {})

      const dataObj = await this.constructor.findOne(
        { ...scope, 'friendlySlugs.slug.base': slugBase },
        {},
        { sort: { 'friendlySlugs.slug.index': -1 } }
      )
      const data = dataObj ? dataObj.toObject() : {}
      const lastIndex = get(data, 'friendlySlugs.slug.index')
      const highestIndex = lastIndex === 0 ? 0 : -1

      const index = highestIndex >= 0 ? highestIndex + 1 : 0
      const suffix = index > 0 ? `-${index}` : ``

      this.slug = `${slugBase}${suffix}`
      this.friendlySlugs = {
        slug: {
          base: slugBase,
          index,
        }
      }
    }
  })
}