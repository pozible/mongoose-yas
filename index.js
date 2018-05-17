const get = require('lodash.get')
const slug = require('slug')

const log = message => console.log('mongoose-yas:', message)

module.exports = function(schema, options) {
  log('loaded')
  schema.pre('save', async function() {
    log('invoked on save')    
    const slugFrom = get(schema, 'obj.slug.slugFrom')
    const target = slugFrom ? this[slugFrom] : this.title
    const slugBase = slug(target).toLowerCase()

    log(get(this, 'friendlySlugs.slug.base') + ' ' + slugBase)
    if (get(this, 'friendlySlugs.slug.base') === slugBase) return

    const getScope = () => {
      const distinctUpTo = get(schema, 'obj.slug.distinctUpTo') || []
      return distinctUpTo.reduce((obj, key) => {
        obj[key] = this[key]
        return obj
      }, {})
    }

    const getIndex = async () => {
      const scope = getScope()

      const dataObj = await this.constructor.findOne(
        { ...scope, 'friendlySlugs.slug.base': slugBase },
        { friendlySlugs: 1 },
        { sort: { 'friendlySlugs.slug.index': -1 } }
      )
      const data = dataObj ? dataObj.toObject() : {}
      const lastIndex = get(data, 'friendlySlugs.slug.index')
      const highestIndex = Number.isInteger(lastIndex) ? lastIndex : -1

      return highestIndex >= 0 ? highestIndex + 1 : 0
    }

    const getSuffix = async (index) => {
      return index > 0 ? `-${index}` : ``
    }

    const index = await getIndex()
    const suffix = await getSuffix(index)
    this.slug = `${slugBase}${suffix}`
    this.friendlySlugs = {
      slug: {
        base: slugBase,
        index,
      }
    }
  })
}