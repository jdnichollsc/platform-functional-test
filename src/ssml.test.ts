import { parseSSML, ssmlNodeToText } from './ssml'

// SSML -> SSMLNodes
describe('parseSSML', () => {
  describe('positive', () => {
    it('should parse tags with no text content or attributes', () => {
      expect(parseSSML('  <speak></speak> ')).toEqual({
        name: 'speak',
        attributes: [],
        children: [],
      })
      expect(parseSSML('<speak></speak>')).toEqual({
        name: 'speak',
        attributes: [],
        children: [],
      })
      expect(parseSSML('<speak><p><h1></h1></p></speak>')).toEqual({
        name: 'speak',
        attributes: [],
        children: [
          {
            name: 'p',
            attributes: [],
            children: [
              {
                name: 'h1',
                attributes: [],
                children: [],
              },
            ],
          },
        ],
      })
      expect(parseSSML('< speak   >< p ></  p ></speak >')).toEqual({
        name: 'speak',
        attributes: [],
        children: [
          {
            name: 'p',
            attributes: [],
            children: [],
          },
        ],
      })
    })

    it('should parse tags with attributes', () => {
      expect(parseSSML('<speak foo=""></speak>')).toEqual({
        name: 'speak',
        attributes: [{ name: 'foo', value: '' }],
        children: [],
      })
      expect(parseSSML('<speak foo="bar"></speak>')).toEqual({
        name: 'speak',
        attributes: [{ name: 'foo', value: 'bar' }],
        children: [],
      })
      expect(parseSSML('<speak baz:foo="bar"></speak>')).toEqual({
        name: 'speak',
        attributes: [{ name: 'baz:foo', value: 'bar' }],
        children: [],
      })
      expect(parseSSML('<speak foo  = "bar"></speak>')).toEqual({
        name: 'speak',
        attributes: [{ name: 'foo', value: 'bar' }],
        children: [],
      })
      expect(parseSSML('<speak foo  = "bar" hello="world"></speak>')).toEqual({
        name: 'speak',
        attributes: [
          { name: 'foo', value: 'bar' },
          { name: 'hello', value: 'world' },
        ],
        children: [],
      })
      expect(parseSSML('<speak foo  = "bar" hello="world"><p foo=" bar " ></p></speak>')).toEqual({
        name: 'speak',
        attributes: [
          { name: 'foo', value: 'bar' },
          { name: 'hello', value: 'world' },
        ],
        children: [
          {
            name: 'p',
            attributes: [{ name: 'foo', value: ' bar ' }],
            children: [],
          },
        ],
      })
    })

    it('should parse tags with attributes and text content', () => {
      expect(parseSSML('<speak><p foo="bar">Hello</p>World</speak>')).toEqual({
        name: 'speak',
        attributes: [],
        children: [
          {
            name: 'p',
            attributes: [{ name: 'foo', value: 'bar' }],
            children: ['Hello'],
          },
          'World',
        ],
      })
      expect(parseSSML('<speak>Hello world</speak>')).toEqual({
        name: 'speak',
        attributes: [],
        children: ['Hello world'],
      })
      expect(parseSSML('<speak>Hello<p> world</p> foo</speak>')).toEqual({
        name: 'speak',
        attributes: [],
        children: [
          'Hello',
          {
            name: 'p',
            attributes: [],
            children: [' world'],
          },
          ' foo',
        ],
      })
      expect(parseSSML('<speak>TS &gt; JS</speak>')).toEqual({
        name: 'speak',
        attributes: [],
        children: ['TS > JS'],
      })
      expect(parseSSML('<speak>TS &amp;&gt; JS</speak>')).toEqual({
        name: 'speak',
        attributes: [],
        children: ['TS &> JS'],
      })
      expect(parseSSML('<speak>TS&lt; JS</speak>')).toEqual({
        name: 'speak',
        attributes: [],
        children: ['TS< JS'],
      })
      expect(parseSSML('<speak><p>TS&lt;</p> JS</speak>')).toEqual({
        name: 'speak',
        attributes: [],
        children: [
          {
            name: 'p',
            attributes: [],
            children: ['TS<'],
          },
          ' JS',
        ],
      })
    })

    it('should parse self-closing tag', () => {
      expect(parseSSML('<speak>Hello<br />World!</speak>')).toEqual({
        name: 'speak',
        attributes: [],
        children: [
          'Hello',
          {
            name: 'br',
            attributes: [],
            children: [],
          },
          'World!',
        ],
      })
    })

    it('should parse self-closing tag with attributes', () => {
      expect(parseSSML('<speak>Hello<break time="3s"/>World!</speak>')).toEqual({
        name: 'speak',
        attributes: [],
        children: [
          'Hello',
          {
            name: 'break',
            attributes: [{ name: 'time', value: '3s' }],
            children: [],
          },
          'World!',
        ],
      })
    })
  })

  describe('negative', () => {
    it('should throw on tag with no name', () => {
      expect(() => parseSSML('<>Hello world</>')).toThrow()
      expect(() => parseSSML('< />')).toThrow()
      expect(() => parseSSML('</>')).toThrow()
      expect(() => parseSSML('< >')).toThrow()
      expect(() => parseSSML('<>')).toThrow()
    })

    it('should throw on missing speak tag', () => {
      expect(() => parseSSML('Hello world')).toThrow()
      expect(() => parseSSML('<p>Hello world</p>')).toThrow()
      expect(() => parseSSML('<p><speak>Hello world</speak></p>')).toThrow()
      expect(() => parseSSML('Hello <speak>world</speak>')).toThrow()
    })

    it('should throw on multiple top level tags or text', () => {
      expect(() => parseSSML('<speak>Hello world</speak><foo></foo>')).toThrow()
      expect(() => parseSSML('<speak>Hello world</speak>foo')).toThrow()
      expect(() => parseSSML('<foo></foo><speak>Hello world</speak>')).toThrow()
      expect(() => parseSSML('foo<speak>Hello world</speak>')).toThrow()
    })

    it('should throw on missing or invalid SSML opening and closing tags', () => {
      expect(() => parseSSML('<speak>Hello world')).toThrow()
      expect(() => parseSSML('Hello world</speak>')).toThrow()
      expect(() => parseSSML('<speak><p>Hello world</speak>')).toThrow()
      expect(() => parseSSML('<speak>Hello world</p></speak>')).toThrow()
      expect(() => parseSSML('<speak><p>Hello <s>world</s></speak>')).toThrow()
      expect(() => parseSSML('<speak><p>Hello <s>world</p></speak>')).toThrow()
      expect(() => parseSSML('<speak><p>Hello <s>world</p></p></speak>')).toThrow()
      expect(() => parseSSML('<speak><p>Hello <s>world</p></s></speak>')).toThrow()
      expect(() => parseSSML('<speak><p>Hello world</s></speak>')).toThrow()
      expect(() => parseSSML('<speak><p>Hello world</p></p></speak>')).toThrow()
    })

    it('should throw on invalid tag attributes', () => {
      expect(() => parseSSML('<speak foo bar="baz"></speak>')).toThrow()
      expect(() => parseSSML("<speak foo='bar' foo></speak>")).toThrow()
      expect(() => parseSSML('<speak foo></speak>')).toThrow()
      expect(() => parseSSML('<speak foo="bar></speak>')).toThrow()
      expect(() => parseSSML('<speak foo=bar></speak>')).toThrow()
      expect(() => parseSSML('<speak foo=bar"></speak>')).toThrow()
      expect(() => parseSSML('<speak ="bar"></speak>')).toThrow()
    })
  })
})

/// SSMLNodes -> Text
describe('ssmlNodeToText', () => {
  it('Correctly converts SSMLNodes to text', () => {
    expect(
      ssmlNodeToText({
        name: 'baz',
        attributes: [],
        children: [],
      })
    ).toEqual('')
    expect(
      ssmlNodeToText({
        name: 'baz',
        attributes: [{ name: 'foo', value: 'bar' }],
        children: [],
      })
    ).toEqual('')
    expect(
      ssmlNodeToText({
        name: 'baz',
        attributes: [{ name: 'foo', value: 'bar' }],
        children: [
          {
            name: 'break',
            attributes: [{ name: 'time', value: '3s' }],
            children: [],
          },
        ],
      })
    ).toEqual('')
    expect(
      ssmlNodeToText({
        name: 'baz',
        attributes: [],
        children: ['Hello world'],
      })
    ).toEqual('Hello world')
    expect(
      ssmlNodeToText({
        name: 'baz',
        attributes: [{ name: 'foo', value: 'bar' }],
        children: [
          'Hello',
          {
            name: 'break',
            attributes: [{ name: 'time', value: '3s' }],
            children: [],
          },
          'world!',
        ],
      })
    ).toEqual('Helloworld!')
    expect(
      ssmlNodeToText({
        name: 'baz',
        attributes: [{ name: 'foo', value: 'bar' }],
        children: [
          'baz',
          {
            name: 'p',
            attributes: [],
            children: [
              'Hello ',
              {
                name: 'p',
                attributes: [],
                children: [
                  {
                    name: 'bar',
                    attributes: [{ name: 'time', value: '3s' }],
                    children: [' ', { name: 'foo', attributes: [], children: [] }],
                  },
                ],
              },
              ' world',
            ],
          },
          'baz',
        ],
      })
    ).toEqual('bazHello   worldbaz')
    expect(
      ssmlNodeToText({
        name: 'baz',
        attributes: [{ name: 'foo', value: 'bar' }],
        children: [
          {
            name: 'p',
            attributes: [],
            children: [
              {
                name: 'p',
                attributes: [],
                children: [
                  {
                    name: 'bar',
                    attributes: [{ name: 'time', value: '3s' }],
                    children: [{ name: 'foo', attributes: [], children: ['test'] }],
                  },
                ],
              },
            ],
          },
        ],
      })
    ).toEqual('test')
  })
})
