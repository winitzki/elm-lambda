port module LambdaUI exposing (main)

{-| The UI for a lambda-calculus evaluation engine.

# Running

@docs main

-}

import Html.App exposing (program)
import Html exposing (Html, Attribute, button, text, div, input)
import Html.Attributes exposing (..)
import Html.Events exposing (onInput, onClick)
import List exposing (map)
import Element exposing (..)
import Color exposing (..)
import Text exposing (fromString)
import String
import Time exposing (Time)

type alias Model = {
  input_term: String,
  output_term: String
}

init_state : Model
init_state = { input_term = "", output_term = "" }

port simple_lambda : String -> Cmd msg
port simple_lambda_result : (String -> msg) -> Sub msg

type Msg = Step | Clear | GotResult String | NewInput String

subs : Sub Msg
subs = simple_lambda_result GotResult

update: Msg -> Model -> (Model, Cmd Msg)
update msg model = case msg of
  NewInput s -> ({model | input_term = s}, Cmd.none)
  Step -> (model, simple_lambda model.input_term)
  GotResult s -> ({model | output_term = s}, Cmd.none)
  clear -> ({model | output_term = ""}, Cmd.none)

scene : Model -> Html Msg
scene model = 
  div []
    [ input [ placeholder "(\\x -> \\y -> x) z", onInput NewInput, myStyle ] []
    , button [ onClick Step ] [ text "Step" ]
    , button [ onClick Clear ] [ text "Clear" ]
    , div [ myStyle ] [ text model.output_term ]
    ]

myStyle =
  style
    [ ("width", "100%")
    , ("height", "40px")
    , ("background-color", "yellow")
    , ("padding", "10px 0")
    , ("font-size", "2em")
    , ("text-align", "center")
    ]


{-| Run the interpreter.
-}

main : Program Never
main = program { 
  init = (init_state, Cmd.none)
  , update = update
  , subscriptions = always subs
  , view = scene
  }
