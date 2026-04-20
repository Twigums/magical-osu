{-# LANGUAGE OverloadedStrings #-}
import System.Environment (lookupEnv)
import System.FilePath ((</>))

import Hakyll

import Compilers (sassCompiler, tsCompiler)
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

--------------------------------------------------------------------------------

main :: IO ()
main = do
    host <- lookupEnv "PREVIEW_HOST"
    let cfg = case host of
                Just h  -> hakyllConfig { previewHost = h }
                Nothing -> hakyllConfig
    hakyllWith cfg rules

rules :: Rules ()
rules = do
    match (makePattern templateDir "*") $ compile templateBodyCompiler

    match "static/**" $ do
        route   $ gsubRoute "static/" (const "")
        compile copyFileCompiler

    -- song data (audio, chart/timing json, etc.)
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
            let homeCtx = constField "info-content" (escapeForAttr infoContent) <> defaultContext
            pandocCompiler
                >>= loadAndApplyTemplate (makeIdentifier templateDir "home.html") homeCtx
                >>= relativizeUrls

    match "src/tabs/tutorial.md" $ do
        route   $ constRoute "tutorial/index.html"
        compile $ pandocCompiler
            >>= loadAndApplyTemplate (makeIdentifier templateDir "tutorial.html") defaultContext
            >>= relativizeUrls

    match "src/tabs/info.md" $ do
        compile $ pandocCompiler
            >>= saveSnapshot "content"

    let songCtx = constField "textalive-token" textaliveToken <> defaultContext

    match "src/tabs/song1.md" $ do
        route   $ constRoute "song1/index.html"
        compile $ pandocCompiler
            >>= loadAndApplyTemplate (makeIdentifier templateDir "song.html") songCtx
            >>= relativizeUrls

    create ["sitemap.xml"] $ do
        route idRoute
        compile $ do
            pages <- loadAll (fromList $ map (makeIdentifier "") tabPaths)
            let sitemapCtx =
                    constField "root" siteRoot <>
                    listField "pages" postCtx (return pages)
            makeItem ""
                >>= loadAndApplyTemplate (makeIdentifier templateDir "sitemap.xml") sitemapCtx
