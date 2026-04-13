module Config
    ( siteRoot
    , templateDir
    , tabPaths
    , hakyllConfig
    ) where

import Hakyll (Configuration (..), defaultConfiguration)

-- TODO: Set this to your deployed site URL
siteRoot :: String
siteRoot = "https://example.com"

templateDir :: FilePath
templateDir = "src/templates/"

-- List all tab pages here. home.md has special routing (see site.hs).
-- Add or remove tab files as needed.
tabPaths :: [FilePath]
tabPaths =
    [ "src/tabs/home.md"
    , "src/tabs/tutorial.md"
    , "src/tabs/info.md"
    , "src/tabs/song1.md"
    ]

hakyllConfig :: Configuration
hakyllConfig = defaultConfiguration
    { destinationDirectory = "docs"
    }
