import type { AppState, Game, QuestionDraft, QuestionOption } from '../types/game'

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function generateId(prefix: string) {
  return createId(prefix)
}

export function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function createOption(label: string, isCorrect = false, imageUrl?: string): QuestionOption {
  return { id: createId('opt'), label, imageUrl, isCorrect }
}

export function createQuestionDraft(): QuestionDraft {
  return {
    type: 'mcq',
    prompt: '',
    emojiPrompt: '',
    imageUrl: '',
    imageRevealConfig: {
      focusX: 50,
      focusY: 50,
      zoom: 2.8,
      rotation: 0,
      revealStep: 0.45,
    },
    acceptedAnswer: '',
    slideLayout: 'auto',
    timeLimitSeconds: 20,
    points: 10,
    isDemo: false,
    isTieBreaker: false,
    options: [
      createOption('', true),
      createOption(''),
      createOption(''),
      createOption(''),
    ],
  }
}

function createSeedGames(): Game[] {
  const gameId = createId('game')

  return [
    {
      id: gameId,
      title: 'Friday Fun Frenzy',
      description:
        'A short office quiz with quick wins, one text round, and a final tie-breaker if needed.',
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: createId('question'),
          type: 'section',
          prompt: 'Round 1: Office icebreakers',
          acceptedAnswer: 'Start with a few warm-up questions before the competitive rounds.',
          slideLayout: 'auto',
          timeLimitSeconds: 0,
          points: 0,
          isDemo: false,
          isTieBreaker: false,
          options: [],
        },
        {
          id: createId('question'),
          type: 'mcq',
          prompt: 'Which snack disappears first during a team meeting?',
          slideLayout: 'auto',
          timeLimitSeconds: 15,
          points: 10,
          isDemo: false,
          isTieBreaker: false,
          options: [
            createOption('Samosas', true),
            createOption('Cookies'),
            createOption('Fruit bowl'),
            createOption('Trail mix'),
          ],
        },
        {
          id: createId('question'),
          type: 'true_false',
          prompt: 'True or False: The office coffee machine works perfectly every Monday.',
          slideLayout: 'auto',
          timeLimitSeconds: 10,
          points: 5,
          isDemo: false,
          isTieBreaker: false,
          options: [createOption('True'), createOption('False', true)],
        },
        {
          id: createId('question'),
          type: 'short_text',
          prompt: 'Name one thing your team does that makes meetings actually fun.',
          emojiPrompt: '',
          acceptedAnswer: 'Any thoughtful answer can score points',
          slideLayout: 'auto',
          timeLimitSeconds: 30,
          points: 15,
          isDemo: false,
          isTieBreaker: false,
          options: [],
        },
        {
          id: createId('question'),
          type: 'emoji',
          prompt: 'Guess the movie title',
          emojiPrompt: '🚢🧊🚫🧍‍♀️❄️',
          imageRevealConfig: {
            focusX: 50,
            focusY: 50,
            zoom: 2.8,
            rotation: 0,
            revealStep: 0.45,
          },
          acceptedAnswer: 'Titanic',
          slideLayout: 'auto',
          timeLimitSeconds: 20,
          points: 10,
          isDemo: false,
          isTieBreaker: false,
          options: [],
        },
        {
          id: createId('question'),
          type: 'section',
          prompt: 'Final round',
          acceptedAnswer: 'Here comes the tie-breaker if scores are close.',
          slideLayout: 'auto',
          timeLimitSeconds: 0,
          points: 0,
          isDemo: false,
          isTieBreaker: false,
          options: [],
        },
        {
          id: createId('question'),
          type: 'mcq',
          prompt: 'Tie-breaker: Which emoji best represents last-minute production fixes?',
          slideLayout: 'auto',
          timeLimitSeconds: 10,
          points: 5,
          isDemo: false,
          isTieBreaker: true,
          options: [
            createOption('Fire extinguisher', true),
            createOption('Party popper'),
            createOption('Sleeping face'),
            createOption('Palm tree'),
          ],
        },
      ],
    },
  ]
}

export function createInitialState(): AppState {
  const games = createSeedGames()
  const sessionId = createId('session')

  return {
    games,
    sessions: [
      {
        id: sessionId,
        gameId: games[0].id,
        roomCode: 'PLAY42',
        state: 'lobby',
        currentQuestionIndex: null,
        currentQuestionStartedAt: undefined,
        pausedRemainingMs: undefined,
        imageRevealLevel: 0,
        revealAnswers: false,
        leaderboardVisible: false,
        allowJoin: true,
        createdAt: new Date().toISOString(),
      },
    ],
    players: [],
    answers: [],
  }
}
