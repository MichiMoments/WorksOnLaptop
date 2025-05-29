import { createAgent } from '@veramo/core'

// — Key management
import {
  KeyManager,
  MemoryKeyStore,
  MemoryPrivateKeyStore,
} from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'

// — DID management (did:key)
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { KeyDIDProvider } from '@veramo/did-provider-key'

// — DID resolution (needed for verify flows)
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getResolver as keyDidResolver } from 'key-did-resolver'

// — Message handling (glues it all together)
import { MessageHandler } from '@veramo/message-handler'
import { JwtMessageHandler } from '@veramo/did-jwt'

const keyStore        = new MemoryKeyStore()
const privateKeyStore = new MemoryPrivateKeyStore()
const kms             = new KeyManagementSystem(privateKeyStore)

const resolver = new Resolver({
  ...keyDidResolver(),    // enable did:key resolution
})

export const agent = createAgent({
  plugins: [
    // 1) Keys + KMS
    new KeyManager({
      store: keyStore,
      kms: { local: kms },
    }),

    // 2) DIDs (did:key)
    new DIDManager({
      store: new MemoryDIDStore(),
      defaultProvider: 'did:key',
      providers: {
        'did:key': new KeyDIDProvider({ defaultKms: 'local' }),
      },
    }),

    // 3) DID resolver
    new DIDResolverPlugin({ resolver }),

    // 4) **Message handler host**,
    //    into which we register the JWT handler
    new MessageHandler({
      messageHandlers: [new JwtMessageHandler()],
    }),
  ],
})
