Lambda-calculus interpreter
=================

This is a simple UI for a lambda-calculus interpreter.

## Syntax

The interpreter accepts several variations of syntax such as 

```
\x->y
\x.y
λx→y
```

## Build from source

This requires Elm 0.17 installed.

To compile:

```
elm-make src/LambdaUI.elm --output=elm.js
```

The JavaScript code is in `elm.js`. To produce JavaScript code optimized by the Google Closure Compiler:

```
elm-make src/LambdaUI.elm --output=elm-u.js
java -jar /path/to/google-closure-compiler.jar --js elm-u.js --js_output_file elm.js
```

## Run

Build from source, so that you have `elm.js`, and then open the file `elm-lambda.html` in the browser.

## Status

Version 0.0.1: Basic functionality, detection of repetitive reduction steps.
