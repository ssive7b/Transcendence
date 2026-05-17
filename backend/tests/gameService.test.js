const test = require('node:test');
const assert = require('node:assert/strict');
const gameService = require('../services/gameService');

function setupGame({ players, activePlayerId, config = {} }) {
  const gameId = 'test-' + Math.random();
  gameService.games[gameId] = {
    id: gameId, status: 'playing', players, activePlayerId,
    config: { playerCount: players.length, gameType: 'endless', ...config },
    currentRound: 0, roundWinners: [], pile: [], deck: [],
    winner: null, winners: null,
  };
  return gameId;
}

test('parseStartDate converts month/year to year*100+month', () => {
  assert.equal(gameService.parseStartDate('march', '2024'), 202403);
  assert.equal(gameService.parseStartDate('october', '2025'), 202510);
});

test('parseStartDate is case-insensitive', () => {
  assert.equal(gameService.parseStartDate('March', '2024'), 202403);
  assert.equal(gameService.parseStartDate('MARCH', '2024'), 202403);
});

test('parseStartDate returns null when year is missing or invalid', () => {
  assert.equal(gameService.parseStartDate('march', null), null);
  assert.equal(gameService.parseStartDate('march', ''), null);
  assert.equal(gameService.parseStartDate('march', 'not-a-year'), null);
});

test('parseStartDate defaults to January for unknown months', () => {
  assert.equal(gameService.parseStartDate('foobar', '2024'), 202401);
});

test('shuffleDeck preserves length and elements', () => {
  const deck = [1, 2, 3, 4, 5];
  const shuffled = gameService.shuffleDeck(deck);
  assert.equal(shuffled.length, deck.length);
  assert.deepEqual([...shuffled].sort(), [...deck].sort());
});

test('shuffleDeck does not mutate the input', () => {
  const deck = [1, 2, 3, 4, 5];
  const original = [...deck];
  gameService.shuffleDeck(deck);
  assert.deepEqual(deck, original);
});

test('dealHands gives every player the same number of cards', () => {
  const deck = Array.from({ length: 150 }, (_, i) => ({ wallet: i }));
  const players = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }];
  gameService.dealHands(players, deck);

  const sizes = players.map(p => p.hand.length);
  assert.ok(sizes[0] > 0, 'expected at least one card per player');
  assert.ok(sizes.every(s => s === sizes[0]), `unequal hand sizes: ${sizes.join(', ')}`);
});

test('dealHands distributes unique cards across players', () => {
  const deck = Array.from({ length: 150 }, (_, i) => ({ wallet: i }));
  const players = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }];
  gameService.dealHands(players, deck);

  const wallets = players.flatMap(p => p.hand.map(c => c.wallet));
  assert.equal(new Set(wallets).size, wallets.length);
});

test('getBotChoice easy always returns a valid stat name', () => {
  const card = { wallet: 50, correction_point: 5, startDate: 202403 };
  const valid = new Set(['wallet', 'correction_point', 'startDate']);
  for (let i = 0; i < 30; i++) {
    assert.ok(valid.has(gameService.getBotChoice(card, 'easy')));
  }
});

test('getBotChoice hard picks the stat with the highest score', () => {
  // startDate is flipped (999999 - x) internally so lower-wins becomes higher-score
  const card = { wallet: 50, correction_point: 5, startDate: 100000 };
  assert.equal(gameService.getBotChoice(card, 'hard'), 'startDate');
});

test('playRound: higher value wins on wallet', () => {
  const gameId = setupGame({
    players: [
      { id: 'p1', isBot: false, login: 'a', roundWins: 0, hand: [{ wallet: 50 }, { wallet: 10 }] },
      { id: 'p2', isBot: false, login: 'b', roundWins: 0, hand: [{ wallet: 20 }, { wallet: 30 }] },
    ],
    activePlayerId: 'p1',
  });
  const game = gameService.playRound(gameId, 'wallet', 'p1');
  assert.equal(game.activePlayerId, 'p1');
  assert.equal(game.players[0].hand.length, 3);
  assert.equal(game.players[1].hand.length, 1);
  assert.equal(game.pile.length, 0);
});

test('playRound: lower value wins on startDate (older pool = stronger)', () => {
  const gameId = setupGame({
    players: [
      { id: 'p1', isBot: false, login: 'a', roundWins: 0, hand: [{ startDate: 202403 }, { startDate: 202405 }] },
      { id: 'p2', isBot: false, login: 'b', roundWins: 0, hand: [{ startDate: 202410 }, { startDate: 202412 }] },
    ],
    activePlayerId: 'p1',
  });
  const game = gameService.playRound(gameId, 'startDate', 'p1');
  assert.equal(game.activePlayerId, 'p1');
  assert.equal(game.players[0].hand.length, 3);
});

test('playRound: tie creates a pile and active player does not change', () => {
  const gameId = setupGame({
    players: [
      { id: 'p1', isBot: false, login: 'a', roundWins: 0, hand: [{ wallet: 30 }, { wallet: 50 }] },
      { id: 'p2', isBot: false, login: 'b', roundWins: 0, hand: [{ wallet: 30 }, { wallet: 40 }] },
    ],
    activePlayerId: 'p1',
  });
  const game = gameService.playRound(gameId, 'wallet', 'p1');
  assert.equal(game.activePlayerId, 'p1');
  assert.equal(game.pile.length, 2);
});

test('playRound: throws when called by the non-active player', () => {
  const gameId = setupGame({
    players: [
      { id: 'p1', isBot: false, login: 'a', roundWins: 0, hand: [{ wallet: 50 }, { wallet: 10 }] },
      { id: 'p2', isBot: false, login: 'b', roundWins: 0, hand: [{ wallet: 20 }, { wallet: 30 }] },
    ],
    activePlayerId: 'p1',
  });
  assert.throws(
    () => gameService.playRound(gameId, 'wallet', 'p2'),
    /not your turn/i
  );
});

test('playRound: ends the game when only one player has cards (endless mode)', () => {
  const gameId = setupGame({
    players: [
      { id: 'p1', isBot: false, login: 'a', roundWins: 0, hand: [{ wallet: 50 }] },
      { id: 'p2', isBot: false, login: 'b', roundWins: 0, hand: [{ wallet: 20 }] },
    ],
    activePlayerId: 'p1',
  });
  const game = gameService.playRound(gameId, 'wallet', 'p1');
  assert.equal(game.status, 'finished');
  assert.equal(game.winner.id, 'p1');
});

test('playRound: bot turn ignores client-supplied comparisonField', () => {
  // Bot's hard-mode pick prefers startDate (flipped: 999999 - 100000 = 899999).
  // If 'wallet' had been used, p2 (90 > 80) would win. p1 winning proves the override worked.
  const gameId = setupGame({
    players: [
      { id: 'p1', isBot: true,  login: 'bot1', roundWins: 0, hand: [{ wallet: 80, correction_point: 5, startDate: 100000 }] },
      { id: 'p2', isBot: false, login: 'a',    roundWins: 0, hand: [{ wallet: 90, correction_point: 5, startDate: 200000 }] },
    ],
    activePlayerId: 'p1',
    config: { difficulty: 'hard' },
  });
  const game = gameService.playRound(gameId, 'wallet', null);
  assert.equal(game.winner.id, 'p1');
});
