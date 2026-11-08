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
            org.openqa.selenium.By followerValue = org.openqa.selenium.By.xpath(
                ".//*[normalize-space(text())='Followers']/preceding-sibling::*[1]");
            for (int attempt = 0; attempt < 15; attempt++) {
                for (org.openqa.selenium.WebElement dialog : driver.findElements(popup)) {
                    if (!dialog.isDisplayed()) continue;
                    for (org.openqa.selenium.WebElement element : dialog.findElements(followerValue)) {
                        String value = element.getText().trim();
                        if (!value.matches("[0-9]{1,3}(?:,[0-9]{3})+|[0-9]{7,10}")) continue;
                        long followers = Long.parseLong(value.replace(",", ""));
                        if (followers >= 1000000L && followers <= 1000000000L) {
                            System.out.println("STAT_FOLLOWERS|" + followers);
                            return;
                        }
                    }
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
out=root/'build';out.mkdir(exist_ok=True)
(out/('Stream_Stats.java' if kind=='group' else 'Stream_Stats_Units_Duos.java')).write_text(source)
