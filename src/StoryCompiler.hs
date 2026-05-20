module StoryCompiler (storyCompiler) where

import Data.List (intercalate, isPrefixOf)
import Hakyll

splitOn :: Char -> String -> [String]
splitOn _ "" = [""]
splitOn c (x:xs) = case splitOn c xs of
    []     -> [[x]]
    (r:rs) -> if x == c then "" : r : rs else (x : r) : rs

readDouble :: String -> String -> Either String Double
readDouble name s = case reads (trim s) of
    [(v, "")] -> Right v
    _         -> Left $ "Invalid number for '" ++ name ++ "': " ++ s

showNum :: Double -> String
showNum d
    | d == fromIntegral n = show n
    | otherwise           = show d
  where n = round d :: Int

data StoryEntry
    = HighlightEntry { heFrom :: Double, heTo :: Double }
    | MoveEntry      { meTime :: Double, meX :: Double, meY :: Double }

parseEntry :: String -> Either String StoryEntry
parseEntry line = case map trim (splitOn ',' line) of
    ["h", t1, t2]  -> do
        from <- readDouble "time1" t1
        to   <- readDouble "time2" t2
        Right $ HighlightEntry from to
    ["m", t, x, y] -> do
        time <- readDouble "time" t
        nx   <- readDouble "x"    x
        ny   <- readDouble "y"    y
        Right $ MoveEntry time nx ny
    _ -> Left $ "Expected 'h, time1, time2' or 'm, time, x, y': " ++ line

renderEntry :: StoryEntry -> String
renderEntry (HighlightEntry from to) =
    "  { \"type\": \"h\", \"from\": " ++ showNum from ++ ", \"to\": " ++ showNum to ++ " }"
renderEntry (MoveEntry time x y) =
    "  { \"type\": \"m\", \"time\": " ++ showNum time ++ ", \"x\": " ++ showNum x ++ ", \"y\": " ++ showNum y ++ " }"

compileStory :: String -> Either String String
compileStory content = do
    let ls = filter isDataLine (lines content)
    entries <- mapM parseEntry ls
    Right $ "[\n" ++ intercalate ",\n" (map renderEntry entries) ++ "\n]\n"
  where
    isDataLine l = let t = trim l in not (null t) && not ("#" `isPrefixOf` t)

storyCompiler :: Compiler (Item String)
storyCompiler = do
    body <- getResourceBody
    case compileStory (itemBody body) of
        Left  err  -> fail $ "Story compile error: " ++ err
        Right json -> makeItem json
