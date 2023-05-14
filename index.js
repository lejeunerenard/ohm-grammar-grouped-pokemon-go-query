import { SearchComplimentNode, SearchIntersectNode, SearchIntervalNode, SearchTermNode, SearchUnionNode } from 'pokemon-go-storage-query-tree'
import * as ohm from 'ohm-js'

export const grammar = ohm.grammar(String.raw`
GroupedPokemonGoQuery {
  Query = Exp

  Exp = AndExp

  AndExp = AndExp andOperator OrExp --binary
         | OrExp

  OrExp  = OrExp orOperator NotExp --binary
         | NotExp

  NotExp = notOperator PrimaryExp --unary
         | PrimaryExp

  PrimaryExp = openParen Exp closeParen --parens
             | Interval
             | Term

  // Operators
  operator = andOperator
           | orOperator
           | notOperator
           | openParen
           | closeParen

  andOperator = "&" | "|"
  orOperator = "," | ":" | ";"
  notOperator = "!"
  parens = openParen
         | closeParen
  openParen = "("
  closeParen = ")"

  Interval = Bound* "-" Bound Term
           | Bound "-" Bound* Term

  Bound = digit+

  Term   = ~operator "+"* "@"* alnum* "*"*
}
`)

const s = grammar.createSemantics()
s.addOperation('eval', {
  PrimaryExp_parens (_, a, _2) {
    return a.eval()
  },
  AndExp_binary (a, _, b) {
    return new SearchIntersectNode([a.eval(), b.eval()])
  },
  OrExp_binary (a, _, b) {
    return new SearchUnionNode([a.eval(), b.eval()])
  },
  NotExp_unary (_, a) {
    return new SearchComplimentNode(a.eval())
  },
  Interval (lower, _, upper, term) {
    return new SearchIntervalNode(term.sourceString || null,
      lower.sourceString ? Number(lower.sourceString) : null,
      upper.sourceString ? Number(upper.sourceString) : null
    )
  },
  Term (a, b, c, d) {
    return new SearchTermNode([...arguments]
      .map((arg) => arg.sourceString).join(''))
  }
})
export const semantic = s
