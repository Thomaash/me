#!/usr/bin/env sh

cd "$(npm root)/../src/importScript" || {
  printf -- "\n\n%s\n" 'Failed to change directory to src/importScript' 1>&2
  exit 1
}

rm -rf generated || {
  printf -- "\n\n%s\n" 'Failed to remove old "generated" directory' 1>&2
  exit 1
}

mkdir generated || {
  printf -- "\n\n%s\n" 'Failed to create new "generated" directory' 1>&2
  exit 1
}

cd generated || {
  printf -- "\n\n%s\n" 'Failed to change directory to "generated"' 1>&2
  exit 1
}

pip install antlr4-tools || {
  printf -- "\n\n%s\n" 'Failed to install antlr4-tools via pip' 1>&2
  exit 1
}

curl --remote-name 'https://raw.githubusercontent.com/antlr/grammars-v4/master/python/python3/Python3Lexer.g4' || {
  printf -- "\n\n%s\n" 'Failed to download Python3Lexer.g4' 1>&2
  exit 1
}

curl --remote-name 'https://raw.githubusercontent.com/antlr/grammars-v4/master/python/python3/Python3Parser.g4' || {
  printf -- "\n\n%s\n" 'Failed to download Python3Parser.g4' 1>&2
  exit 1
}

curl --remote-name 'https://raw.githubusercontent.com/antlr/grammars-v4/master/python/python3/JavaScript/Python3LexerBase.js' || {
  printf -- "\n\n%s\n" 'Failed to download Python3LexerBase.js' 1>&2
  exit 1
}

curl --remote-name 'https://raw.githubusercontent.com/antlr/grammars-v4/master/python/python3/JavaScript/Python3ParserBase.js' || {
  printf -- "\n\n%s\n" 'Failed to download Python3ParserBase.js' 1>&2
  exit 1
}

antlr4 -Dlanguage=JavaScript Python3Lexer.g4 || {
  printf -- "\n\n%s\n" 'Failed to generate JavaScript lexer from Python3Lexer.g4' 1>&2
  exit 1
}

antlr4 -Dlanguage=JavaScript Python3Parser.g4 || {
  printf -- "\n\n%s\n" 'Failed to generate JavaScript parser from Python3Parser.g4' 1>&2
  exit 1
}