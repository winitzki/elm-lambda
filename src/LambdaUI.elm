port module LambdaUI exposing (main)

{-| The UI for a lambda-calculus evaluation engine.

# Running

@docs main

-}

import Html.App exposing (program)
import Html exposing (Html, Attribute, button, text, div, input)
import Html.Attributes exposing (..)
import Html.Events exposing (onInput, onClick)
import List exposing (map, isEmpty, head, reverse, append)
import Maybe exposing (withDefault)
import Element exposing (..)
import Color exposing (..)
import Text exposing (fromString)
import String
import Time exposing (Time)

type alias Model = {
  input_term: String,
  output_terms: List String,
  message: String
}

init_state : Model
init_state = { input_term = "", output_terms = [], message = "" } -- output_terms is in reversed order

port simple_lambda : String -> Cmd msg
port simple_lambda_result : (String -> msg) -> Sub msg

type Msg = Step | Clear | GotResult String | NewInput String

subs : Sub Msg
subs = simple_lambda_result GotResult

get_last_term : Model -> String
get_last_term model = head model.output_terms |> withDefault model.input_term

append_result : Model -> String -> Model
append_result model s = let l = get_last_term model in if l == s then { model | message = "No more reductions" } else {model | output_terms = s :: model.output_terms}

update: Msg -> Model -> (Model, Cmd Msg)
update msg model = case msg of
  NewInput s -> ({model | input_term = s}, Cmd.none)
  Step -> (model, simple_lambda (get_last_term model))
  GotResult s -> (append_result model s, Cmd.none)
  Clear -> ({model | output_terms = [], message = ""}, Cmd.none)

show_term term = div [ myStyle ] [ text term ]

scene : Model -> Html Msg
scene model = 
  div []
    (append [ input [ placeholder "Enter a lambda-term such as (\\x -> \\y -> x) z", onInput NewInput, myStyle ] []
    , button [ onClick Step ] [ text "Step" ]
    , button [ onClick Clear ] [ text "Clear" ]
    , text model.message
    ] <| map show_term (reverse model.output_terms)
    )

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
