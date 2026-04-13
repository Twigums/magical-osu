module Compilers
    ( sassCompiler
    , tsCompiler
    ) where

import Hakyll

sassCompiler :: Compiler (Item String)
sassCompiler = getResourceString >>= withItemBody
    (unixFilter "npx" ["sass", "--stdin", "--load-path=src/scss", "--no-source-map"])

tsCompiler :: Compiler (Item String)
tsCompiler = getResourceString >>= withItemBody
    (unixFilter "npx" ["esbuild", "--loader=ts", "--target=es2020"])