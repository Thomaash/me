import { expect } from 'chai'

import Builder from '../../src/builder'
import correctScript from './builder.script.txt'
import data from '../../src/examples/medium_2_controllers'

function removeNonCode (script) {
  return script.split('\n')
    .filter(line => !/^($|#)/.test(line))
    .join('\n')
}

describe('Builder', () => {
  let script

  beforeEach(() => {
    const builder = new Builder(JSON.parse(JSON.stringify(data)))
    script = builder.build()
  })

  it('script', () => {
    expect(script, 'builder didn\'t return a string').to.be.a('string')
    expect(removeNonCode(script), 'builder didn\'t build expected script')
      .to.equal(removeNonCode(correctScript))
  })
})
