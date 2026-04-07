{-# LANGUAGE OverloadedStrings #-}
import System.FilePath ((</>))

import Hakyll

import Compilers (sassCompiler, tsCompiler)
import Config    (blogsDir, hakyllConfig, siteRoot, tabPaths, templateDir)
import Context   (postCtx)
import Routes    (titleRoute)

--------------------------------------------------------------------------------

makePattern :: FilePath -> FilePath -> Pattern
makePattern dir glob = fromGlob (dir </> glob)

makeIdentifier :: FilePath -> FilePath -> Identifier
makeIdentifier dir file = fromFilePath (dir </> file)

--------------------------------------------------------------------------------

main :: IO ()
main = hakyllWith hakyllConfig $ do
    match (makePattern templateDir "*") $ compile templateBodyCompiler

    match "static/**" $ do
        route   $ gsubRoute "static/" (const "")
        compile copyFileCompiler

    -- SCSS: track partials so changes to _*.scss trigger recompile of entry point
    scssPartialDep <- makePatternDependency "src/scss/_*.scss"
    match "src/scss/_*.scss" $ compile getResourceBody
    rulesExtraDependencies [scssPartialDep] $
        match "src/scss/default.scss" $ do
            route   $ constRoute "css/default.css"
            compile sassCompiler

    match "src/ts/main.ts" $ do
        route   $ constRoute "js/main.js"
        compile tsCompiler

    match "src/tabs/home.md" $ do
        route   $ constRoute "index.html"
        compile $ pandocCompiler
            >>= loadAndApplyTemplate (makeIdentifier templateDir "default.html") defaultContext
            >>= relativizeUrls

    match "src/tabs/blog.md" $ do
        route $ gsubRoute "src/tabs/" (const "") `composeRoutes`
                gsubRoute "\\.md$" (const "/index.html")
        compile $ do
            blogs <- recentFirst =<< loadAll (makePattern blogsDir "*")
            let indexCtx =
                    listField "blogs" postCtx (return blogs) <>
                    defaultContext
            pandocCompiler
                >>= applyAsTemplate indexCtx
                >>= loadAndApplyTemplate (makeIdentifier templateDir "default.html") indexCtx
                >>= relativizeUrls

    match (fromList ["src/tabs/tab1.md", "src/tabs/tab2.md", "src/tabs/tab3.md"]) $ do
        route $ gsubRoute "src/tabs/" (const "") `composeRoutes`
                gsubRoute "\\.md$" (const "/index.html")
        compile $ pandocCompiler
            >>= loadAndApplyTemplate (makeIdentifier templateDir "default.html") defaultContext
            >>= relativizeUrls

    match (makePattern blogsDir "*") $ do
        let ctx = constField "type" "article" <> postCtx
        route   $ metadataRoute (titleRoute "blogs/")
        compile $ pandocCompiler
            >>= loadAndApplyTemplate (makeIdentifier templateDir "blog_post.html") ctx
            >>= saveSnapshot "content"
            >>= loadAndApplyTemplate (makeIdentifier templateDir "default.html")   ctx
            >>= relativizeUrls

    create ["sitemap.xml"] $ do
        route idRoute
        compile $ do
            blogs       <- recentFirst =<< loadAll (makePattern blogsDir "*")
            singlePages <- loadAll (fromList $ map (makeIdentifier "") tabPaths)
            let pages      = blogs <> singlePages
                sitemapCtx =
                    constField "root" siteRoot <>
                    listField "pages" postCtx (return pages)
            makeItem ""
                >>= loadAndApplyTemplate (makeIdentifier templateDir "sitemap.xml") sitemapCtx
