import test from 'tape'
import { SearchComplimentNode, SearchIntersectNode, SearchIntervalNode, SearchTermNode, SearchUnionNode } from 'pokemon-go-storage-query-tree'
import { grammar, semantic } from '../index.js'

function evalStr (input) {
  const match = grammar.match(input)
  return semantic(match).eval()
}

test('parse', (t) => {
  t.test('TERM', (t) => {
    t.notDeepEquals(evalStr('123'), new SearchTermNode('123'), 'doesnt take number')
    t.deepEquals(evalStr('beep'), new SearchTermNode('beep'), 'strings')
    t.notDeepEquals(evalStr('3*'), new SearchTermNode('3*'), 'doesnt take star')

    t.end()
  })

  t.test('INTERVAL', (t) => {
    t.deepEquals(evalStr('1-2attack'), new SearchIntervalNode('attack', 1, 2), 'complete w/ term')
    t.deepEquals(evalStr('-3'), new SearchIntervalNode(null, null, 3), 'upper only')
    t.deepEquals(evalStr('-3hp'), new SearchIntervalNode('hp', null, 3), 'upper only w/ term')
    t.deepEquals(evalStr('3-'), new SearchIntervalNode(null, 3, null), 'lower only')
    t.deepEquals(evalStr('3-defense'), new SearchIntervalNode('defense', 3, null), 'lower only')
    t.deepEquals(evalStr('123'), new SearchIntervalNode(null, 123, 123), 'single pokemon numbers')
    t.deepEquals(evalStr('3*'), new SearchIntervalNode('*', 3, 3), '\\d star')

    t.end()
  })

  t.test('NOT', (t) => {
    t.deepEquals(evalStr('!shiny'), new SearchComplimentNode(new SearchTermNode('shiny')), 'complete w/ term')
    t.deepEquals(evalStr('!(shiny,evolve)'), new SearchComplimentNode(new SearchUnionNode([
      new SearchTermNode('shiny'),
      new SearchTermNode('evolve')
    ])), 'NOT of OR')

    t.end()
  })

  t.test('OR', (t) => {
    t.test('simple', (t) => {
      const tree = evalStr('evolve,shiny')
      const expected = new SearchUnionNode([
        new SearchTermNode('evolve'),
        new SearchTermNode('shiny')
      ])

      t.deepEquals(tree, expected)
      t.end()
    })

    t.test('left associative', (t) => {
      const tree = evalStr('evolve,shiny,lucky')
      const expected = new SearchUnionNode([
        new SearchUnionNode([
          new SearchTermNode('evolve'),
          new SearchTermNode('shiny')
        ]),
        new SearchTermNode('lucky')
      ])

      t.deepEquals(tree, expected)
      t.end()
    })
  })

  t.test('AND', (t) => {
    t.test('simple', (t) => {
      const tree = evalStr('evolve&shiny')
      const expected = new SearchIntersectNode([
        new SearchTermNode('evolve'),
        new SearchTermNode('shiny')
      ])

      t.deepEquals(tree, expected)
      t.end()
    })

    t.test('left associative', (t) => {
      const tree = evalStr('evolve&shiny&lucky')
      const expected = new SearchIntersectNode([
        new SearchIntersectNode([
          new SearchTermNode('evolve'),
          new SearchTermNode('shiny')
        ]),
        new SearchTermNode('lucky')
      ])

      t.deepEquals(tree, expected)
      t.end()
    })

    t.test('precident over OR', (t) => {
      const tree = evalStr('evolve&shiny,lucky')
      const expected = new SearchIntersectNode([
        new SearchTermNode('evolve'),
        new SearchUnionNode([
          new SearchTermNode('shiny'),
          new SearchTermNode('lucky')
        ])
      ])

      t.deepEquals(tree, expected)
      t.end()
    })
  })

  t.test('parenthesis', (t) => {
    t.test('simple', (t) => {
      const tree = evalStr('(evolve,shiny)')
      const expected = new SearchUnionNode([
        new SearchTermNode('evolve'),
        new SearchTermNode('shiny')
      ])

      t.deepEquals(tree, expected)
      t.end()
    })

    t.test('order of operations', (t) => {
      const tree = evalStr('(evolve&shiny),lucky')
      const expected = new SearchUnionNode([
        new SearchIntersectNode([
          new SearchTermNode('evolve'),
          new SearchTermNode('shiny')
        ]),
        new SearchTermNode('lucky')
      ])

      t.deepEquals(tree, expected)
      t.end()
    })
  })
})
