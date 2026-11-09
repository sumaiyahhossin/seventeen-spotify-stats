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
            org.openqa.selenium.By aboutButton = org.openqa.selenium.By.cssSelector("button[aria-label='SEVENTEEN']");
            boolean opened = false;
            for (int attempt = 0; attempt < 10; attempt++) {
                java.util.List<org.openqa.selenium.WebElement> buttons = driver.findElements(aboutButton);
                if (!buttons.isEmpty()) {
                    try {
                        org.openqa.selenium.WebElement button = buttons.get(0);
                        if (button.isDisplayed()) {
                            ((org.openqa.selenium.JavascriptExecutor)driver).executeScript("arguments[0].click();", button);
                            opened = true;
                            break;
                        }
                    } catch (org.openqa.selenium.StaleElementReferenceException ignored) {}
                }
                Thread.sleep(1200);
            }
            // Wait for the About popup, then read its exact follower number.
            // Avoid searching the whole page: other sections contain large numbers.
            // Spotify uses a native <dialog open aria-label="SEVENTEEN">.
            // Find the numeric value by its nearby Followers label, never by
            // guessing that the first large number belongs to followers.
            org.openqa.selenium.By popup = org.openqa.selenium.By.cssSelector(
                "dialog[open][aria-label='SEVENTEEN'], dialog[open], [role='dialog']");
            // Spotify changes the dialog markup. Match a full, exact integer
            // adjacent to the Followers label instead of a brittle sibling XPath.
            java.util.regex.Pattern before = java.util.regex.Pattern.compile(
                "([0-9]{1,3}(?:[,\\s][0-9]{3})+|[0-9]{7,10})\\s*Followers", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Pattern after = java.util.regex.Pattern.compile(
                "Followers\\s*([0-9]{1,3}(?:[,\\s][0-9]{3})+|[0-9]{7,10})", java.util.regex.Pattern.CASE_INSENSITIVE);
            for (int attempt = 0; attempt < 15; attempt++) {
                for (org.openqa.selenium.WebElement dialog : driver.findElements(popup)) {
                    if (!dialog.isDisplayed()) continue;
                    String dialogText = dialog.getText().replace((char) 160, ' ').trim();
                    java.util.regex.Matcher match = before.matcher(dialogText);
                    if (!match.find()) {
                        match = after.matcher(dialogText);
                        if (!match.find()) continue;
                    }
                    String digits = match.group(1).replaceAll("[^0-9]", "");
                    try {
                        long followers = Long.parseLong(digits);
                        if (followers >= 1000000L && followers <= 1000000000L) {
                            System.out.println("STAT_FOLLOWERS|" + followers);
                            return;
                        }
                    } catch (NumberFormatException ignored) {}
                }
                Thread.sleep(1000);
            }
            System.out.println("STAT_FOLLOWERS_UNAVAILABLE|artist-about-dialog-number-not-found");
        } catch (Exception e) {
            System.out.println("STAT_FOLLOWERS_UNAVAILABLE|" + e.getClass().getSimpleName());
        }
    }
    '''

    source=source.replace('private static void fetchMonthlyListeners()', follower_java+'\n    private static void fetchMonthlyListeners()')
    source=source.replace('fetchMonthlyListeners();','fetchMonthlyListeners();\n        fetchFollowersMetric();',1)
# Group uses Shining Diamond; Units & Solo uses Jeonghan's Better Half.
# Inject after the driver exists so both Java collectors compile safely.
if kind in ('group','solo'):
    first_track='4BHThgh4ODCszIJ6e4YGGw' if kind=='group' else '1beUALLSloBEvYre65QiW6'
    probe = r'''
        String previousFirst = System.getenv("SVT_FIRST_TRACK_PREVIOUS");
        if (previousFirst != null && !previousFirst.isBlank()) {
            try {
                long oldCount = Long.parseLong(previousFirst);
                long newCount = fetchCount(driver, "https://open.spotify.com/track/__FIRST_TRACK_ID__");
                System.out.println("STAT_FIRST_PROBE|" + newCount + "|" + oldCount);
                if (newCount <= 0 || newCount == oldCount) {
                    System.out.println("STAT_FIRST_UNCHANGED|retry-next-hour");
                    driver.quit();
                    return;
                }
                // Spotify can remove streams during corrections. Any change,
                // upward or downward, means the full collection should run.
                System.out.println("STAT_FIRST_CHANGED|collect-all");
            } catch (Exception probeError) {
                System.out.println("STAT_FIRST_PROBE_FAILED|" + probeError.getClass().getSimpleName());
                driver.quit();
                return;
            }
        }
    '''
    probe=probe.replace('__FIRST_TRACK_ID__',first_track)
    marker=("nf = NumberFormat.getInstance(Locale.US);" if kind=='group'
            else "WebDriver driver = new ChromeDriver(options);")
    if marker not in source:
        raise RuntimeError('Could not insert '+kind+' first-track probe')
    source=source.replace(marker,marker+'\n'+probe,1)
out=root/'build';out.mkdir(exist_ok=True)
(out/('Stream_Stats.java' if kind=='group' else 'Stream_Stats_Units_Duos.java')).write_text(source)
