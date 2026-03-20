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
      title: '🚀 Demo: All Question Types',
      description:
        'Try every slide type — section, multiple choice, true/false, short text, emoji, and image reveal. Perfect for exploring the game before building your own.',
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        // 1. Section slide
        {
          id: createId('question'),
          type: 'section',
          prompt: '🎉 Welcome to the Demo Quiz!',
          acceptedAnswer:
            'This is a section slide — use it to introduce a round, show a title, or give players a moment to breathe between questions.',
          slideLayout: 'auto',
          timeLimitSeconds: 0,
          points: 0,
          isDemo: false,
          isTieBreaker: false,
          options: [],
        },
        // 2. Multiple choice
        {
          id: createId('question'),
          type: 'mcq',
          prompt: 'Which planet is known as the Red Planet?',
          slideLayout: 'auto',
          timeLimitSeconds: 20,
          points: 10,
          isDemo: false,
          isTieBreaker: false,
          options: [
            createOption('Mercury'),
            createOption('Mars', true),
            createOption('Jupiter'),
            createOption('Venus'),
          ],
        },
        // 3. True / False
        {
          id: createId('question'),
          type: 'true_false',
          prompt: 'True or False: Honey never expires — scientists found edible honey in 3,000-year-old Egyptian tombs.',
          slideLayout: 'auto',
          timeLimitSeconds: 15,
          points: 5,
          isDemo: false,
          isTieBreaker: false,
          options: [createOption('True', true), createOption('False')],
        },
        // 4. Short text (manually scored by host)
        {
          id: createId('question'),
          type: 'short_text',
          prompt: 'Name any programming language invented before 1980.',
          emojiPrompt: '',
          acceptedAnswer:
            'COBOL, FORTRAN, C, Pascal, BASIC, Lisp, Smalltalk, Ada — any valid answer scores points.',
          slideLayout: 'auto',
          timeLimitSeconds: 30,
          points: 15,
          isDemo: false,
          isTieBreaker: false,
          options: [],
        },
        // 5. Emoji puzzle
        {
          id: createId('question'),
          type: 'emoji',
          prompt: 'What famous movie do these emojis represent?',
          emojiPrompt: '🦁👑🌍',
          imageRevealConfig: {
            focusX: 50,
            focusY: 50,
            zoom: 2.8,
            rotation: 0,
            revealStep: 0.45,
          },
          acceptedAnswer: 'The Lion King',
          slideLayout: 'auto',
          timeLimitSeconds: 20,
          points: 10,
          isDemo: false,
          isTieBreaker: false,
          options: [],
        },
        // 6. Image guess (progressive reveal)
        {
          id: createId('question'),
          type: 'image_guess',
          prompt: 'What famous landmark is this? Type your answer.',
          imageUrl:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/700px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg',
          imageRevealConfig: {
            focusX: 50,
            focusY: 40,
            zoom: 3.5,
            rotation: 0,
            revealStep: 0.55,
          },
          acceptedAnswer: 'Eiffel Tower',
          slideLayout: 'auto',
          timeLimitSeconds: 30,
          points: 20,
          isDemo: false,
          isTieBreaker: false,
          options: [],
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
