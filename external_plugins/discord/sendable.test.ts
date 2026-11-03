import { expect, test, beforeAll, afterAll } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { assertSendable } from './sendable'

let topic: string, state: string
beforeAll(() => {
  topic = mkdtempSync(join(tmpdir(), 'sendable-'))
  state = join(topic, '.discord-state')
  mkdirSync(join(state, 'inbox'), { recursive: true })
  mkdirSync(join(topic, '.line-state'))
  mkdirSync(join(topic, 'notes'))
  for (const f of ['bot.env', '.env', 'notes/report.md', 'notes/.env.local', 'bot.env.bak', 'bot.env~', 'notes/bot.environment.md',
                   '.discord-state/.env', '.discord-state/access.json',
                   '.discord-state/inbox/photo.png', '.line-state/.env'])
    writeFileSync(join(topic, f), 'x')
  symlinkSync(join(topic, 'bot.env'), join(topic, 'notes', 'innocent.txt'))
})
afterAll(() => rmSync(topic, { recursive: true, force: true }))

const ok = (p: string) => expect(() => assertSendable(join(topic, p), state)).not.toThrow()
const no = (p: string) => expect(() => assertSendable(join(topic, p), state)).toThrow()

test('ordinary files and own inbox are sendable', () => {
  ok('notes/report.md')
  ok('.discord-state/inbox/photo.png')
})
test('own state dir refused (upstream behaviour)', () => {
  no('.discord-state/.env')
  no('.discord-state/access.json')
})
test('bot.env and .env files refused anywhere', () => {
  no('bot.env')
  no('.env')
  no('notes/.env.local')
  no('bot.env.bak')
  no('bot.env~')
  ok('notes/bot.environment.md')
})
test('other adapters state dirs refused', () => no('.line-state/.env'))
test('symlink to a secret refused', () => no('notes/innocent.txt'))
test('missing file left to the caller', () => ok('notes/nope.md'))
