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
    follower_java = '''
    private static void fetchFollowersMetric() {
        try {
            driver.get("https://open.spotify.com/artist/7nqOGRxlXj7N2JYbgNEjYH");
            Thread.sleep(2800);
            for (int attempt=0; attempt<5; attempt++) {
                java.util.List<org.openqa.selenium.WebElement> labels = driver.findElements(
                    org.openqa.selenium.By.xpath("//*[normalize-space(text())='Followers']"));
                for (org.openqa.selenium.WebElement label : labels) {
                    org.openqa.selenium.WebElement container = label.findElement(
                        org.openqa.selenium.By.xpath(".."));
                    String raw = container.getText();
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                        "(\\\\d[\\\\d,]*)\\\\s*Followers", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(raw);
                    if (m.find()) {
                        long count = Long.parseLong(m.group(1).replace(",", ""));
                        if (count > 0) {
                            System.out.println("STAT_FOLLOWERS|" + count);
                            return;
                        }
                    }
                }
                Thread.sleep(1200);
            }
        } catch (Exception e) {
            System.out.println("Followers metric unavailable: " + e.getClass().getSimpleName());
        }
    }
    '''
    source=source.replace('private static void fetchMonthlyListeners()', follower_java+'\n    private static void fetchMonthlyListeners()')
    source=source.replace('fetchMonthlyListeners();','fetchMonthlyListeners();\n        fetchFollowersMetric();',1)
out=root/'build';out.mkdir(exist_ok=True)
(out/('Stream_Stats.java' if kind=='group' else 'Stream_Stats_Units_Duos.java')).write_text(source)
