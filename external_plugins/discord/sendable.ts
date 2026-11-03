// Which local files reply/edit may upload as attachments.
//
// Upstream refuses only this adapter's own state dir. In an agentport topic
// the same directory also holds bot.env (every channel token) and the other
// adapters' .*-state dirs, one level up. An assistant that can be asked to
// "attach that file" should not be able to attach those — reading and pasting
// is a separate path this does not try to close, but an upload is the one
// that leaves no visible text in the reply for the owner to notice.
import { realpathSync } from 'fs'
import { basename, join, sep } from 'path'

// bot.env.bak, bot.env~, .env.local … are the same tokens under another name.
const SECRET_NAME = /^(bot\.env|\.env)([.~].*)?$/
const STATE_COMPONENT = /^\.[A-Za-z0-9_-]+-state$/

export function assertSendable(f: string, stateDir: string): void {
  let real: string
  try {
    real = realpathSync(f)
  } catch { return } // statSync in the caller reports the missing file properly
  let stateReal = ''
  try { stateReal = realpathSync(stateDir) } catch {}
  if (stateReal) {
    // Downloaded attachments land in inbox/; sending them back is the point.
    if (real.startsWith(join(stateReal, 'inbox') + sep)) return
    if (real.startsWith(stateReal + sep)) {
      throw new Error(`refusing to send channel state: ${f}`)
    }
  }
  if (SECRET_NAME.test(basename(real)) || real.split(sep).some(c => STATE_COMPONENT.test(c))) {
    throw new Error(`refusing to send credentials or channel state: ${f}`)
  }
}
