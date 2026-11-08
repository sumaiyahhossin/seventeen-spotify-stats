import pathlib,re,sys
root=pathlib.Path(__file__).resolve().parents[1]
kind=sys.argv[1]
source=(root/'src'/('Stream_Stats.java' if kind=='group' else 'Stream_Stats_Units_Duos.java')).read_text()
if kind=='solo': source=source.replace('package Practice;','')
start=source.index('private static long fetchCount(')
end=source.index('\n    private static ',start+10)
block=source[start:end]
for variable in ('cachedValue','value','parsedValue'):
    block=re.sub(r'(return '+variable+r';)',r'System.out.println("STAT_TRACK|" + songUrl.split("\\\\?")[0] + "|" + '+variable+r');\n            \1',block)
block=block.replace('songUrl.split("\\\\?")[0]', 'songUrl.split("\\\\?")[0]')
block=block.replace('songUrl.split("\\\\?")[0]', 'songUrl.split(java.util.regex.Pattern.quote("?"))[0]')
source=source[:start]+block+source[end:]
if kind=='group':
    source=source.replace('System.out.println(nf.format(listenersCount));','System.out.println("STAT_LISTENERS|7nqOGRxlXj7N2JYbgNEjYH|" + listenersCount);\n            System.out.println(nf.format(listenersCount));')
else:
    source=source.replace('System.out.println(nf.format(listenersCount));','System.out.println("STAT_LISTENERS|" + listenerUrl.split(java.util.regex.Pattern.quote("?"))[0].replace("https://open.spotify.com/artist/", "") + "|" + listenersCount);\n            System.out.println(nf.format(listenersCount));')
if kind=='group':
    follower_java = r'''
    private static void fetchFollowersMetric() {
        final String artist = "https://open.spotify.com/artist/7nqOGRxlXj7N2JYbgNEjYH";
        try {
            driver.get(artist);
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "(?i)(?:([0-9][0-9,\\.]*\\s*[KMB]?)\\s*(?:followers|follower)|(?:followers|follower)\\s*[:\\u00b7]?\\s*([0-9][0-9,\\.]*\\s*[KMB]?))");
            for (int attempt=0; attempt<8; attempt++) {
                // Embedded HTML can contain unrelated counts; only read visible text.
                String[] sources = {
                    driver.findElement(org.openqa.selenium.By.tagName("body")).getText()
                };
                for (String raw : sources) {
                    java.util.regex.Matcher matcher = pattern.matcher(raw);
                    while (matcher.find()) {
                        String value = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
                        value = value.replace(",", "").trim().toUpperCase(java.util.Locale.ROOT);
                        java.util.regex.Matcher digits = java.util.regex.Pattern.compile("([0-9]+(?:\\.[0-9]+)?)\\s*([KMB]?)").matcher(value);
                        if (!digits.matches()) continue;
                        double count = Double.parseDouble(digits.group(1));
                        String unit = digits.group(2);
                        if ("K".equals(unit)) count *= 1000;
                        if ("M".equals(unit)) count *= 1000000;
                        if ("B".equals(unit)) count *= 1000000000;
                        long followers = Math.round(count);
                        // A rounded K/M display is not an exact daily metric.
                        if (!unit.isEmpty()) {
                            // Rounded values must never become exact daily snapshots.
                            continue;
                        }
                        if (followers >= 1000000 && followers <= 1000000000L) {
                            System.out.println("STAT_FOLLOWERS|" + followers);
                            return;
                        }
                    }
                }
                Thread.sleep(1500);
            }
            System.out.println("STAT_FOLLOWERS_UNAVAILABLE|not-visible-on-artist-page");
        } catch (Exception e) {
            System.out.println("STAT_FOLLOWERS_UNAVAILABLE|" + e.getClass().getSimpleName());
        }
    }
    '''

    source=source.replace('private static void fetchMonthlyListeners()', follower_java+'\n    private static void fetchMonthlyListeners()')
    source=source.replace('fetchMonthlyListeners();','fetchMonthlyListeners();\n        fetchFollowersMetric();',1)
out=root/'build';out.mkdir(exist_ok=True)
(out/('Stream_Stats.java' if kind=='group' else 'Stream_Stats_Units_Duos.java')).write_text(source)
