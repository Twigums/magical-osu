module Context
    ( postCtx
    ) where

import Hakyll
import Config (siteRoot)

postCtx :: Context String
postCtx =
    constField "root" siteRoot <>
    dateField "date" "%B %e, %Y" <>
    defaultContext