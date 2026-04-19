module Compilers
    ( sassCompiler
    , tsCompiler
    ) where

import Hakyll

sassCompiler :: Compiler (Item String)
sassCompiler = getResourceString >>= withItemBody
    (unixFilter "npx" ["sass", "--stdin", "--load-path=src/scss", "--no-source-map"])

tsCompiler :: Compiler (Item String)
tsCompiler = do
    path   <- getResourceFilePath
    output <- unixFilter "npx"
        [ "esbuild"
        , path
        , "--bundle"
        , "--loader:.ts=ts"
        , "--loader:.tsx=tsx"
        , "--jsx=automatic"
        , "--target=es2020"
        , "--format=iife"
        , "--minify"
        ] ""
    makeItem output
