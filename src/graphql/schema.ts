export const schema = `
  type Quote {
    id: ID!
    content: String!
    author: String!
    tags: [String!]!
    length: Int!
    likes: Int!
    views: Int!
  }

  type LikeQuoteResponse {
    id: ID!
    likes: Int!
    success: Boolean!
  }

  type QuoteList {
    quotes: [Quote!]!
    total: Int!
  }

  type Query {
    randomQuote: Quote!
    quote(id: ID!): Quote
    similarQuotes(id: ID!, limit: Int): QuoteList!
    topRatedQuotes(limit: Int): QuoteList!
    mostViewedQuotes(limit: Int): QuoteList!
    allQuotes: QuoteList!
  }

  type Mutation {
    likeQuote(id: ID!): LikeQuoteResponse!
  }
`;
