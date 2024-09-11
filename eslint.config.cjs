module.exports = [
    {
        rules: {
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
            'no-mixed-spaces-and-tabs': 'error',
            'no-multi-spaces': 'error',
            'indent': ['error', 4],
            'linebreak-style': ['error', 'unix'],
            'quotes': ['error', 'single'],
            'function-paren-newline': ['error', 'multiline'],
            'max-len': ['error', { code: 160, tabWidth: 4, ignoreUrls: true, ignoreTemplateLiterals: true, ignoreStrings: true, ignoreRegExpLiterals: true }]
        },
        ignores: [
            'node_modules/*',
            'src/Php/*'
        ]
    }
];