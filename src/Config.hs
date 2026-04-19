module Config
    ( siteRoot
    , templateDir
    , tabPaths
    , hakyllConfig
    , textaliveToken
    ) where

import Hakyll (Configuration (..), defaultConfiguration)

-- TODO: set to url
siteRoot :: String
siteRoot = "https://example.com"

templateDir :: FilePath
templateDir = "src/templates/"

-- tabs belong here
tabPaths :: [FilePath]
tabPaths =
    [ "src/tabs/home.md"
    , "src/tabs/tutorial.md"
    , "src/tabs/song1.md"
    ]

hakyllConfig :: Configuration
hakyllConfig = defaultConfiguration
    { destinationDirectory = "docs" }

textaliveToken :: String
textaliveToken = "N6S7A1HvahiwDLUg"
