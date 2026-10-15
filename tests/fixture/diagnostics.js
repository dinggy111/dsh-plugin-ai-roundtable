import { writeFile } from 'node:fs/promises'
export function apply(ctx, config) {
  ctx.inject(['connection'], scope => {
    void writeFile(config.authPath, JSON.stringify({ url: scope.connection.authenticatedUrl('http://127.0.0.1:3146') }))
  })
}
