name: CI
'on':
    push:
        branches:
            - main
    pull_request: null
    workflow_dispatch: null
jobs:
    validation:
        name: Validation
        runs-on: ubuntu-latest
        steps:
            -
                uses: actions/checkout@v3
            -
                name: 'Setup PHP'
                uses: shivammathur/setup-php@v2
                with:
                    php-version: '8.2'
                    extensions: 'mbstring, intl, bcmath'
                    coverage: none
            -
                name: 'Composer Install'
                run: 'composer install --prefer-dist --no-interaction --profile'
            -
                name: 'Run validation'
                run: 'composer validate'
            -
                name: 'Syntax check'
                run: 'find ./src -path src -prune -o -type f -name ''*.php'' -print0 | xargs -0 -n1 -P4 php -l -n | (! grep -v "No syntax errors detected" )'
            -
                name: 'Validate code style'
                run: 'composer cs-check'
            -
                name: 'run phpstan'
                run: 'vendor/bin/phpstan'
    lowest:
        name: 'Prefer Lowest'
        runs-on: ubuntu-latest
        steps:
            -
                uses: actions/checkout@v3
            -
                name: 'Setup PHP'
                uses: shivammathur/setup-php@v2
                with:
                    php-version: '8.1'
                    extensions: 'mbstring, intl, bcmath'
                    coverage: none
            -
                name: 'Composer Install'
                run: 'composer install --prefer-dist --no-interaction --profile'
            -
                name: 'Composer Update'
                run: 'composer update --prefer-lowest --prefer-dist --no-interaction --profile -vvv'
