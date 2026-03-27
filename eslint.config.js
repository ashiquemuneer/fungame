import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'JSXAttribute[name.name="className"] > Literal[value=/(?:^|\\s)(bg|text|border|ring)-(green|emerald|rose|red|orange|amber|yellow|sky|blue|indigo|purple|slate|gray|zinc|neutral|stone|black|white)(?:-[1-9]|\\/[1-9]|\\s|$)/]',
          message: 'Design System Warning: Raw Tailwind palette colors are disallowed. Please use token variables (e.g., text-[var(--accent-text)], bg-[var(--danger-container)]). Ignore if intentional (e.g. for pure black/white accents).'
        }
      ]
    }
  },
])
