import { defineStorage } from '@aws-amplify/backend'

export const storage = defineStorage({
  name: 'brewPhotos',
  access: (allow) => ({
    'brew-photos/*': [allow.guest.to(['read', 'write', 'delete'])],
  }),
})
