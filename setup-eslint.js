// setup-eslint.js - Usando ES modules
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const eslintConfig = {
  root: true,
  ignorePatterns: [
    'projects/**/*',
    'dist/**/*',
    'coverage/**/*',
    'node_modules/**/*',
    '*.js',
    '*.cjs',
    '*.mjs',
  ],
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['tsconfig.json'],
        createDefaultProgram: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@angular-eslint/recommended',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
  ],
};

writeFileSync(join(__dirname, '.eslintrc.json'), JSON.stringify(eslintConfig, null, 2));
console.log('✅ Archivo .eslintrc.json creado exitosamente');
