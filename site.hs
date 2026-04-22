{-# LANGUAGE OverloadedStrings #-}
import Data.List            (dropWhileEnd)
import Data.Maybe           (fromMaybe)
import System.Environment   (getArgs, lookupEnv, withArgs)
import System.FilePath      ((</>))

import Hakyll

import ChartCompiler (chartCompiler)
import Compilers     (sassCompiler, tsCompiler)
import Config    (hakyllConfig, siteRoot, tabPaths, templateDir, textaliveToken)
import Context   (postCtx)


--------------------------------------------------------------------------------

makePattern :: FilePath -> FilePath -> Pattern
makePattern dir glob = fromGlob (dir </> glob)

makeIdentifier :: FilePath -> FilePath -> Identifier
makeIdentifier dir file = fromFilePath (dir </> file)

escapeForAttr :: String -> String
escapeForAttr = concatMap escape
  where
    escape '&'  = "&amp;"
    escape '<'  = "&lt;"
    escape '>'  = "&gt;"
    escape '"'  = "&quot;"
    escape '\'' = "&#39;"
    escape c    = [c]

extractSitePath :: [String] -> (String, [String])
extractSitePath = go []
  where
    go acc []                    = ("", reverse acc)
    go acc ("--path" : p : rest) = (p, reverse acc ++ rest)
    go acc (a : rest)            = go (a : acc) rest

normalizeSitePath :: String -> String
normalizeSitePath ""   = ""
normalizeSitePath path =
    let stripped = dropWhile (== '/') path
        trimmed  = dropWhileEnd (== '/') stripped
    in "/" ++ trimmed

--------------------------------------------------------------------------------

main :: IO ()
main = do
    args           <- getArgs
    let (pathArg, remainingArgs) = extractSitePath args
    pathEnv        <- fromMaybe "" <$> lookupEnv "SITE_PATH"
    let sitePath = normalizeSitePath (if null pathArg then pathEnv else pathArg)
    host           <- lookupEnv "PREVIEW_HOST"
    let baseCfg = case host of
                    Just h  -> hakyllConfig { previewHost = h }
                    Nothing -> hakyllConfig
        cfg = if null sitePath
                then baseCfg
                else baseCfg { destinationDirectory = "docs" ++ sitePath }
    withArgs remainingArgs $ hakyllWith cfg (rules sitePath)

rules :: String -> Rules ()
rules sitePath = do
    let baseCtx = constField "path" sitePath <> defaultContext

    match (makePattern templateDir "*") $ compile templateBodyCompiler

    match "static/**" $ do
        route   $ gsubRoute "static/" (const "")
        compile copyFileCompiler

    -- chart files: compile .mimi -> .json
    match "src/songs/**/*.mimi" $ do
        route   $ gsubRoute "src/" (const "") `composeRoutes` setExtension "json"
        compile chartCompiler

    -- song data (audio, timing json, etc.) — excludes .mimi (matched above)
    match "src/songs/**" $ do
        route   $ gsubRoute "src/" (const "")
        compile copyFileCompiler

    -- track scss
    scssPartialDep <- makePatternDependency "src/scss/_*.scss"
    match "src/scss/_*.scss" $ compile getResourceBody
    rulesExtraDependencies [scssPartialDep] $
        match "src/scss/default.scss" $ do
            route   $ constRoute "css/default.css"
            compile sassCompiler

    -- track ts/tsx module changes so main.ts re-bundles
    tsPartialDep  <- makePatternDependency "src/ts/*.ts"
    tsxPartialDep <- makePatternDependency "src/ts/react/*.tsx"
    rulesExtraDependencies [tsPartialDep, tsxPartialDep] $
        match "src/ts/main.ts" $ do
            route   $ constRoute "js/main.js"
            compile tsCompiler

    match "src/tabs/home.md" $ do
        route   $ constRoute "index.html"
        compile $ do
            infoContent <- loadSnapshotBody (fromFilePath "src/tabs/info.md") "content"
            let homeCtx = constField "info-content" (escapeForAttr infoContent) <> baseCtx
            pandocCompiler
                >>= loadAndApplyTemplate (makeIdentifier templateDir "home.html") homeCtx

    match "src/tabs/tutorial.md" $ do
        route   $ constRoute "tutorial/index.html"
        compile $ pandocCompiler
            >>= loadAndApplyTemplate (makeIdentifier templateDir "tutorial.html") baseCtx

    match "src/tabs/info.md" $ do
        compile $ pandocCompiler
            >>= saveSnapshot "content"

    let songCtx =
          constField "textalive-token" textaliveToken <>
          constField "song-chart" (sitePath ++ "/songs/song1/chart.json") <>
          baseCtx

    match "src/tabs/song1.md" $ do
        route   $ constRoute "song1/index.html"
        compile $ pandocCompiler
            >>= loadAndApplyTemplate (makeIdentifier templateDir "song.html") songCtx

    create ["sitemap.xml"] $ do
        route idRoute
        compile $ do
            pages <- loadAll (fromList $ map (makeIdentifier "") tabPaths)
            let sitemapCtx =
                    constField "root" siteRoot <>
                    constField "path" sitePath <>
                    listField "pages" postCtx (return pages)
            makeItem ""
                >>= loadAndApplyTemplate (makeIdentifier templateDir "sitemap.xml") sitemapCtx