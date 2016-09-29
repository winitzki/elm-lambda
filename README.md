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

## Run

Build from source and then open `elm-lambda.html` in the browser.

## Status

Version 0.0.1: Basic functionality, detection of repetitive reduction steps.
