import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../js/boot.js', import.meta.url), 'utf8');
const duration = 48 * 60 * 60 * 1000;
function setup(initial = null, unavailable = false) {
  let now = 1800000000000;
  let stored = initial;
  const context = vm.createContext({
    Date: { now: () => now }, document: { addEventListener() {} },
    localStorage: {
      getItem() { if (unavailable) throw Error('Blocked'); return stored; },
      setItem(key, value) { if (unavailable) throw Error('Blocked'); stored = value; },
      removeItem() { stored = null; },
    },
  });
  vm.runInContext(source, context);
  return { context, advance(ms) { now += ms; }, stored: () => stored };
}

test('Visit expires at 48 hours and sign-ins do not extend it', () => {
  const env = setup();
  assert.equal(env.context.hasVisitedDesktop(), false);
  env.context.rememberDesktopVisit();
  const marker = env.stored();
  assert.equal(setup(marker).context.hasVisitedDesktop(), true);
  env.advance(duration - 1);
  assert.equal(env.context.hasVisitedDesktop(), true);
  env.context.rememberDesktopVisit();
  assert.equal(env.stored(), marker);
  env.advance(1);
  assert.equal(env.context.hasVisitedDesktop(), false);
  assert.equal(env.stored(), null);
  env.context.rememberDesktopVisit();
  assert.equal(env.context.hasVisitedDesktop(), true);
});

test('Permanent legacy and invalid markers are cleared', () => {
  for (const marker of ['true', 'invalid', 'Infinity', '0']) {
    const env = setup(marker);
    assert.equal(env.context.hasVisitedDesktop(), false);
    assert.equal(env.stored(), null);
  }
});

test('Storage fallback expires after 48 hours too', () => {
  const env = setup(null, true);
  env.context.rememberDesktopVisit();
  assert.equal(env.context.hasVisitedDesktop(), true);
  env.advance(duration);
  assert.equal(env.context.hasVisitedDesktop(), false);
});
