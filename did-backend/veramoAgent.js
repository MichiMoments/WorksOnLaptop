import { createAgent } from '@veramo/core'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getResolver as keyDidResolver } from 'key-did-resolver'

const resolver = new Resolver({
  ...keyDidResolver(),   
})

export const agent = createAgent({
  plugins: [
    new DIDResolverPlugin({ resolver })
  ]
})
