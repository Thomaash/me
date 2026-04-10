#!/usr/bin/env sh

cd "$(pnpm root)/../src/importScript" || {
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

curl --remote-name 'https://raw.githubusercontent.com/RobEin/ANTLR4-parser-for-Python-2.7.18/refs/heads/main/PythonLexer.g4' || {
  printf -- "\n\n%s\n" 'Failed to download PythonLexer.g4' 1>&2
  exit 1
}

curl --remote-name 'https://raw.githubusercontent.com/RobEin/ANTLR4-parser-for-Python-2.7.18/refs/heads/main/PythonParser.g4' || {
  printf -- "\n\n%s\n" 'Failed to download PythonParser.g4' 1>&2
  exit 1
}

curl --remote-name 'https://raw.githubusercontent.com/RobEin/ANTLR4-parser-for-Python-2.7.18/refs/heads/main/port_JavaScript/PythonLexerBase.js' || {
  printf -- "\n\n%s\n" 'Failed to download PythonLexerBase.js' 1>&2
  exit 1
}

antlr4 -Dlanguage=JavaScript PythonLexer.g4 || {
  printf -- "\n\n%s\n" 'Failed to generate JavaScript lexer from PythonLexer.g4' 1>&2
  exit 1
}

antlr4 -Dlanguage=JavaScript PythonParser.g4 || {
  printf -- "\n\n%s\n" 'Failed to generate JavaScript parser from PythonParser.g4' 1>&2
  exit 1
}

