import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.PageLoadStrategy;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import java.text.NumberFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


public class Stream_Stats {


    private static final Map<String, String> streamCache = new HashMap<>();
    private static final Pattern MONTHLY_LISTENERS_PATTERN = Pattern.compile("(\\d[\\d,.]*)\\s+monthly listeners?", Pattern.CASE_INSENSITIVE);
    private static NumberFormat nf;
    private static WebDriver driver;


    // Generates invisible and fast browser settings
    private static ChromeOptions getFastChromeOptions() {
        ChromeOptions options = new ChromeOptions();


        // HEADLESS MODE: Runs completely in the background (No windows, no dock icons)
        options.addArguments("--headless=new");


        // === FIXES TO PREVENT CLOSING YOUR OTHER CHROME TABS ===
        options.addArguments("--user-data-dir=/tmp/selenium-seventeen-profile-" + System.currentTimeMillis());
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--remote-debugging-port=0");
        options.addArguments("--disable-extensions");
        options.addArguments("--disable-plugins");
        options.addArguments("--incognito");


        // Stability & Anti-detection
        options.addArguments("--disable-blink-features=AutomationControlled");
        options.setExperimentalOption("excludeSwitches", new String[]{"enable-automation"});
        options.setExperimentalOption("useAutomationExtension", false);
        options.addArguments("--disable-devtools");
        options.addArguments("--disable-features=DevTools");


        // Spoof a real browser user agent
        options.addArguments("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36");


        // SPEED BOOSTS
        options.setPageLoadStrategy(PageLoadStrategy.EAGER);


        Map<String, Object> prefs = new HashMap<>();
        prefs.put("profile.managed_default_content_settings.images", 2); // Block images entirely
        options.setExperimentalOption("prefs", prefs);


        options.addArguments("--disable-background-networking");
        options.addArguments("--disable-client-side-phishing-detection");
        options.addArguments("--disable-default-apps");
        options.addArguments("--no-crash-upload");
        options.addArguments("--disable-gpu");
        return options;
    }


    public static void main(String[] args) throws InterruptedException {


        // ====================== STRONGEST WARNING SUPPRESSION ======================
        Logger.getLogger("").setLevel(Level.OFF);                    // Root logger
        Logger.getLogger("org.openqa.selenium").setLevel(Level.OFF);
        Logger.getLogger("org.openqa.selenium.devtools").setLevel(Level.OFF);
        Logger.getLogger("org.openqa.selenium.chromium").setLevel(Level.OFF);
        Logger.getLogger("org.openqa.selenium.devtools.CdpVersionFinder").setLevel(Level.OFF);


        System.setProperty("webdriver.chrome.silentOutput", "true");
        System.setProperty("selenium.silent", "true");


        // Initialize background driver
        driver = new ChromeDriver(getFastChromeOptions());
        nf = NumberFormat.getInstance(Locale.US);


        //17 carat album (5 tracks): shining diamond, adore u, ah yeah, jam jam, 20
        String[] g1 = {"https://open.spotify.com/track/4BHThgh4ODCszIJ6e4YGGw", "https://open.spotify.com/track/7sEQgmTiEWwMzdnRA28OW1", "https://open.spotify.com/track/6HzEfSRlDNkgmOZBvedvM6", "https://open.spotify.com/track/5o9VWCaFtNsOcaYsiADCgC", "https://open.spotify.com/track/30KwJprbzKR4uXLKEG8dMM"};


        //boys be album (5 tracks): fronting, mansae, when i grow up, omg, rock
        String[] g2 = {"https://open.spotify.com/track/7ppRZp3i4KpK7UHeNLAHrJ", "https://open.spotify.com/track/26OTyz9vMgYKvTvJONpNk4", "https://open.spotify.com/track/6Cnzpz5iL9MhyDbco7YvOX", "https://open.spotify.com/track/1DyOe08LQyJhsLDcSXiNxO", "https://open.spotify.com/track/17MlnACcP3VDE7xHMaToGF"};


        //q&a single (1 track): q&a
        String[] g3 = {"https://open.spotify.com/track/1pHCzbRvRFg59Kvc7WHckN"};


        //chocolate single (1 track): chocolate
        String[] g4 = {"https://open.spotify.com/track/6MuMUDjfgftMIz8Q3ruF22"};


        //love & letter album (10 tracks): chuck, pretty u, still lonely, hit song, say yes, drift away, adore u (vocal team ver.), monday to saturday (hiphop team ver.), shining diamond (performance team ver.), love letter
        String[] g5 = {"https://open.spotify.com/track/4r08Zd72ZYPcPTOZ8CqPyH", "https://open.spotify.com/track/1117juaaAkSIUsQxTmmcKM", "https://open.spotify.com/track/5KndefUfeQhGoYCluAaDWj", "https://open.spotify.com/track/0Su3Wr6cKTrIkLx9VWgi3l", "https://open.spotify.com/track/1maafRRnys7gGBUXcjhzmM", "https://open.spotify.com/track/7zNRdjBB9HFT7CoOaEVzRF", "https://open.spotify.com/track/1S3Zo9gPe2KCJUKa5wLdVZ", "https://open.spotify.com/track/37V533dS8hn2q2tTkbVAlV", "https://open.spotify.com/track/3ygoTUnTWMCOPqcWoz9cQ5", "https://open.spotify.com/track/5UZJPEEup9UVUojRKXcv0f"};


        //love & letter repackage new tracks (5 tracks): no f.u.n, very nice, healing, simple, space
        String[] g6 = {"https://open.spotify.com/track/3VIWAghaRZzHA1HsQH7EwD", "https://open.spotify.com/track/1Rrj7KyS2R6SP9CQMDJW1w", "https://open.spotify.com/track/1nyzf00hpVfBkHlZSVJuky", "https://open.spotify.com/track/0mv9yj1mjcEJes46dHDib5", "https://open.spotify.com/track/44zJN1C94Xuh5wt6czfvth"};


        String[] g7 = {"https://open.spotify.com/track/4r08Zd72ZYPcPTOZ8CqPyH", "https://open.spotify.com/track/1117juaaAkSIUsQxTmmcKM", "https://open.spotify.com/track/5KndefUfeQhGoYCluAaDWj", "https://open.spotify.com/track/0Su3Wr6cKTrIkLx9VWgi3l", "https://open.spotify.com/track/1maafRRnys7gGBUXcjhzmM", "https://open.spotify.com/track/7zNRdjBB9HFT7CoOaEVzRF", "https://open.spotify.com/track/1S3Zo9gPe2KCJUKa5wLdVZ", "https://open.spotify.com/track/37V533dS8hn2q2tTkbVAlV", "https://open.spotify.com/track/3ygoTUnTWMCOPqcWoz9cQ5", "https://open.spotify.com/track/5UZJPEEup9UVUojRKXcv0f"};


        //going seventeen album (8 tracks): beautiful, boomboom, highlight, lean on me, fast pace, don't listen in secret, i don't know, smile flower
        String[] g8 = {"https://open.spotify.com/track/0fK4XOE0TjcXOcMezZtncZ", "https://open.spotify.com/track/4wwEpkAwaT65hVmcg9zQSi", "https://open.spotify.com/track/6FdIEgj8ErhkOHbtB6aqFF", "https://open.spotify.com/track/25jVJDgG9Nv0jFIIPeb0c7", "https://open.spotify.com/track/0q3caW0ttDdykrD2fOKTpw", "https://open.spotify.com/track/01bnqaE6nQogjdMMrrL1dj", "https://open.spotify.com/track/7cwjntgP717i0JZFGoTPMH", "https://open.spotify.com/track/054sQZ2qmw0Ya7N0XSxl3j"};


        //al1 album (6 tracks): don't wanna cry, habit, if i, swimming fool, my i, crazy in love
        String[] g9 = {"https://open.spotify.com/track/1WEk8mX0loccWCAcTZqVH8", "https://open.spotify.com/track/0ePDb0b1tMQlqP9u58pmcg", "https://open.spotify.com/track/0JPyJEA13qkSemzWS3tOs1", "https://open.spotify.com/track/0WdLp00HrAgjldOqFTpqb5", "https://open.spotify.com/track/0y3KqHpaqKhkHMM50HTeQy", "https://open.spotify.com/track/1EbXVXelBudLyGasyGj7Ot"};


        //teen, age album (13 tracks): intro. new world, change up, without you, clap, bring it, lilili yabbay, trauma, pinwheel, flower, rocket, hello, campfire, outro. incompletion
        String[] g10 = {"https://open.spotify.com/track/6qEtE4d5SpNuxSPcuFQpno", "https://open.spotify.com/track/6j6wUN8whCYTwxCg9R240U", "https://open.spotify.com/track/0cbh6m6Ita9t4sKVDJQZFP", "https://open.spotify.com/track/0pIJiHChaM9jlrlPCAP4aI", "https://open.spotify.com/track/047A83COIzAFLcZKLz20MP", "https://open.spotify.com/track/55M6WlPDc8WID9UcmWjbYM", "https://open.spotify.com/track/6MEsfQJ5ZpO1WozVfsVDzZ", "https://open.spotify.com/track/2NvrIHgujKttUQyx2uUMY9", "https://open.spotify.com/track/3wIDLZ8nEHeyxSrVJsD6tv", "https://open.spotify.com/track/3o83eepKSAqhA2pkdxXCkL", "https://open.spotify.com/track/7snRPf9l4LRCMV3hD8WD3W", "https://open.spotify.com/track/3p1J2lefXYI4mMQqXUez75", "https://open.spotify.com/track/0leIXrxhkEBGoR8O8PZQEg"};


        //director's cut album (4 tracks): thinkin' about you, thanks, run to you, falling for u
        String[] g11 = {"https://open.spotify.com/track/2oGLTWJpqJxr1oM8yM5pwO", "https://open.spotify.com/track/2MveMeTbVlWtumO4VPOodG", "https://open.spotify.com/track/7MhirYiYlbhN8L1y6VwbBu", "https://open.spotify.com/track/01aVuBzov1TL2iCNhwkguC"};


        //we make you album (5 tracks): call call call!, highlight - japanese ver., lean on me - japanese ver., 20 - japanese ver., love letter - japanese ver.
        String[] g12 = {"https://open.spotify.com/track/31d4AK9HwMELTaoTZKVz5v", "https://open.spotify.com/track/6wO7MuWE2dcqonEwfUO56V", "https://open.spotify.com/track/600K1v7mGmeOD3oWJXN5EZ", "https://open.spotify.com/track/5V3U5OV8s71kqYrllbsFvv", "https://open.spotify.com/track/698iYBQkgOCpBDL8W81U25"};


        //you make my day album (6 tracks): oh my!, holiday, come to me, what's good, moonwalker, our dawn is hotter than day
        String[] g13 = {"https://open.spotify.com/track/4ldXW2srmZMpwqy5SayT6i", "https://open.spotify.com/track/5nR49Yw6tAlOd1DLfuwWAA", "https://open.spotify.com/track/7GJGh9jy8I6fj7MIZfJEh1", "https://open.spotify.com/track/5FxM6pVE15a8xYUv8eOIxe", "https://open.spotify.com/track/2RevV77RPztZ3I4snuCzGU", "https://open.spotify.com/track/2EGRE8lyfRRGuq7spra3eR"};


        //a-teen ost single (1 track): a-teen
        String[] g14 = {"https://open.spotify.com/track/5P0Uo1LqAgvFuxabQMe81X"};


        //oh my! (chinese ver.) single (1 track): oh my! (chinese ver.)
        String[] g15 = {"https://open.spotify.com/track/65QDnqGpWrHhnViAM1D4Sd"};


        //you make my dawn album (6 tracks): good to me, home, hug, chilli, shhh, getting closer
        String[] g16 = {"https://open.spotify.com/track/4RWbyug0n12hOVHDxRAj5y", "https://open.spotify.com/track/3qOdLKfizw3Sc4KmDLeABG", "https://open.spotify.com/track/7jPev7m1RQ6gUMYIfGobAl", "https://open.spotify.com/track/6d3kU4E8NXpWbCvJZxmm0l", "https://open.spotify.com/track/0jOxIZxnUN323CjyzRA5om", "https://open.spotify.com/track/4CQsxHBYtQvDuNPnlDo5RE"};


        //9-teen ost single (1 track): 9-teen
        String[] g17 = {"https://open.spotify.com/track/5G5MW3CIQ26AV08Yl7UV6m"};


        //happy ending single (3 tracks): happy ending, oh my! - japanese ver., healing - japanese ver.
        String[] g18 = {"https://open.spotify.com/track/6bk9pQwgyR4ihccicvOL9L", "https://open.spotify.com/track/63jDEQCIg1YJLYeiqKJxFg", "https://open.spotify.com/track/3pgoGjjFNc6OkuDHVyVDoh"};


        //hit single (1 track): hit
        String[] g19 = {"https://open.spotify.com/track/0uIw1c0E2nyFWWwEVzhl30"};


        //an ode new tracks album (11 tracks): hit, lie again, fear, let me hear you say, 247, second life, network love, back it up, lucky, snap shoot, happy ending (korean ver.)
        String[] g20 = {"https://open.spotify.com/track/0uIw1c0E2nyFWWwEVzhl30", "https://open.spotify.com/track/5uUK45snr9SPeUuI2aubcF", "https://open.spotify.com/track/481yKEOzsONgSgVXlUfOhy", "https://open.spotify.com/track/6wgC1bu0BIx0K9TBbkINDA", "https://open.spotify.com/track/1FlIEnP3DdFgeP3dhVfNZf", "https://open.spotify.com/track/6RJxJpOaCZ4DamSgJaMoJ8", "https://open.spotify.com/track/30S8t6er5QvMBugOzLJnV9", "https://open.spotify.com/track/6c5ccrEzRtGQdIM04xNtSI", "https://open.spotify.com/track/6BuUJqtxrQZWKOJFibfFFv", "https://open.spotify.com/track/1Yimn9plSAWNv9G3ePzITO", "https://open.spotify.com/track/2lYLfG1WddMzvyJvc7imyB"};


        //sweetest thing ost single (2 tracks): sweetest thing, sweetest thing - instrumental
        String[] g21 = {"https://open.spotify.com/track/7azfhO8VHtektSng0PX5dL", "https://open.spotify.com/track/2w0xNU9qdueLOPgLcZrRhs"};


        //fallin' flower single (3 tracks): fallin' flower, good to me - japanese ver., smile flower - japanese ver.
        String[] g22 = {"https://open.spotify.com/track/6toOcGbnoQgsExJB9gIjMD", "https://open.spotify.com/track/5WaJKsI66o4dr25Oi2U9Mz", "https://open.spotify.com/track/7dtvk4sz96QMYtOJPHQ6qH"};


        //heng:garæ album (6 tracks): fearless, left & right, i wish, my my, kidult, together
        String[] g23 = {"https://open.spotify.com/track/1bhuTWST1TYIVdrsEaQDKa", "https://open.spotify.com/track/065yxZRBAsenRLZacB1uc2", "https://open.spotify.com/track/3YtIeHuvBXkJAyv3twOYCC", "https://open.spotify.com/track/4rnvC8St4YDHGuQdBEByRz", "https://open.spotify.com/track/1kmmKv3L4kGmoPu8aDFOmk", "https://open.spotify.com/track/4yLHe4OAlIFnHerGgHNXBm"};


        //24h single (1 track): 24h
        String[] g24 = {"https://open.spotify.com/track/5jXlUt3NS0iu7pHYPqpK2O"};


        //24h mini album (5 tracks): 24h, pinwheel - japanese ver., 247 - japanese ver., chilli - japanese ver., together - japanese ver.
        String[] g25 = {"https://open.spotify.com/track/5jXlUt3NS0iu7pHYPqpK2O", "https://open.spotify.com/track/6CSlnSL7YojFoHg6lH2NUm", "https://open.spotify.com/track/1DOmNSj2SZ5IzOBpJqEYvm", "https://open.spotify.com/track/3hq32mYRzuuSFez0N7thp8", "https://open.spotify.com/track/1OIvtRP340w1rr306ToHle"};


        //17 (feat. joshua and dk) single (1 track): 17 (feat. joshua and dk)
        String[] g26 = {"https://open.spotify.com/track/5SifNhmUO8iSEoWFQU8kxH"};


        //;[semicolon] album (6 tracks): home;run, do re mi, hey buddy, light a flame, ah! love, all my love
        String[] g27 = {"https://open.spotify.com/track/4w25m2448QReLEsiuqhpLt", "https://open.spotify.com/track/4wcyQo2iV46LinjXE55RtG", "https://open.spotify.com/track/1hd8IgMElWy3OqcFVjZMUx", "https://open.spotify.com/track/2QeqvHnADmf2fN5sowptuO", "https://open.spotify.com/track/5TgfB8nBnuKaytBbjmrzO7", "https://open.spotify.com/track/11zGbqR6W7biyOgSm3WGSO"};


        //hitorijanai single (3 tracks): hitorijanai, run to you - japanese ver., home;run - japanese ver.
        String[] g28 = {"https://open.spotify.com/track/5UMddRELVtxbeuJzGclmM3", "https://open.spotify.com/track/5Pcyt19ffym6qDirHrPKll", "https://open.spotify.com/track/748HZyUpqoafPp9MELCThm"};


        //your choice album (6 tracks): heaven's cloud, ready to love, anyone, gam3 bo1, wave, same dream, same mind, same night
        String[] g29 = {"https://open.spotify.com/track/2Q4D2Pz1HDt1x4NukBID5Q", "https://open.spotify.com/track/5Pqo2Fel77vnFY03uGFtiD", "https://open.spotify.com/track/12jngD7Hu6if6sIzPkO2k4", "https://open.spotify.com/track/5Zt86CL16kbPvuwcmHMEg8", "https://open.spotify.com/track/7awomfKxYCpcqUlfZav6PD", "https://open.spotify.com/track/1afEbbD4hZvdA5orDq1sPj"};


        //warrior ost single (1 track): warrior (joshua, jun, the8, mingyu, vernon)
        String[] g30 = {"https://open.spotify.com/track/5aypcJTIDUwyddBElM1yxc"};


        //is it still beautiful ost single (2 tracks): is it still beautiful, is it still beautiful - instrumental
        String[] g31 = {"https://open.spotify.com/track/4rrGSoMxUV0diSX4zpoCTf", "https://open.spotify.com/track/2h1Ul51I7yWhu2KcI6RSaO"};


        //attacca album (7 tracks): to you, rock with you, crush, pang!, imperfect love, i can't run away, 2 minus 1 (bonus track)
        String[] g32 = {"https://open.spotify.com/track/25osmdhvjltPlN7gI2Javd", "https://open.spotify.com/track/6LnEoRQKMcaFTR5UvaKuBy", "https://open.spotify.com/track/68kHuoBxtNcWZWxBu1V007", "https://open.spotify.com/track/1ZpiUfzl9P0pMkA03xqmUy", "https://open.spotify.com/track/35jvwACXmrreYIEOAGc2Kr", "https://open.spotify.com/track/0bFiLUmBmFX0aWyhVqIwiN", "https://open.spotify.com/track/6o2Pu5qZcinw4mlDlQZFqu"};


        //power of love single (3 tracks): power of love, home - japanese ver., snap shoot - japanese ver.
        String[] g33 = {"https://open.spotify.com/track/3I5W8iA8iZAyO62UVceK3F", "https://open.spotify.com/track/2UHaIBd2uiIFLZ9pgHMpJl", "https://open.spotify.com/track/74rpBQDDUA116sss0a0Tiy"};


        //darl+ing single (1 track): darl+ing
        String[] g34 = {"https://open.spotify.com/track/2j1Es5qEl4pD8GEe2WsYgP"};


        //face the sun album (9 tracks): darl+ing, hot, don quixote, march, domino, shadow, 'bout you, if you leave me, ash
        String[] g35 = {"https://open.spotify.com/track/2j1Es5qEl4pD8GEe2WsYgP", "https://open.spotify.com/track/6I2tqFhk8tq69iursYxuxd", "https://open.spotify.com/track/7BiEgR5r0yMmFoWC9kOTGf", "https://open.spotify.com/track/5Av3flFGhQPu960OvjeNhm", "https://open.spotify.com/track/1sjObenL1HryPaQOiMDVZ9", "https://open.spotify.com/track/2rwJP8OEao5y3xexw52HfD", "https://open.spotify.com/track/5O7UzcP9xERulidcIULOEj", "https://open.spotify.com/track/0ilwFWjTwXszzwaG3XlNWj", "https://open.spotify.com/track/5kc5p2mwO2GFq93zw5ZFWV"};


        //sector 17 repackage album new tracks (4 tracks): Circles, _WORLD, Fallin' Flower (Korean Ver.), CHEERS
        String[] g36 = {"https://open.spotify.com/track/6rurduYegrf5XSZrphuyF2", "https://open.spotify.com/track/3QwiidVHfeE9y5jl4n2MTC", "https://open.spotify.com/track/0AnMBa8yQZlD2B7B1myBuf", "https://open.spotify.com/track/1pdFdv8R6ezIAUUNkn785b"};


        String[] g37 = {"https://open.spotify.com/track/2j1Es5qEl4pD8GEe2WsYgP", "https://open.spotify.com/track/6I2tqFhk8tq69iursYxuxd", "https://open.spotify.com/track/7BiEgR5r0yMmFoWC9kOTGf", "https://open.spotify.com/track/5Av3flFGhQPu960OvjeNhm", "https://open.spotify.com/track/1sjObenL1HryPaQOiMDVZ9", "https://open.spotify.com/track/2rwJP8OEao5y3xexw52HfD", "https://open.spotify.com/track/5O7UzcP9xERulidcIULOEj", "https://open.spotify.com/track/0ilwFWjTwXszzwaG3XlNWj", "https://open.spotify.com/track/5kc5p2mwO2GFq93zw5ZFWV"};


        //_world (feat. anne-marie) single (1 track): _world (feat. anne-marie)
        String[] g38 = {"https://open.spotify.com/track/2kDrUAONMhG6CbDGBkhdrY"};


        //dream ep album (4 tracks): dream, rock with you - japanese ver., all my love - japanese ver., darl+ing - holiday ver.
        String[] g39 = {"https://open.spotify.com/track/1DOgZjmj0WnG9lJx12bdI2", "https://open.spotify.com/track/3sNVR4S8cqLi9iTAubDjtY", "https://open.spotify.com/track/14PwX86SHtCsdYNBbtWNJd", "https://open.spotify.com/track/6uPfEWF2CXICTugIoxGCxi"};


        //betting ost single (1 track): betting
        String[] g40 = {"https://open.spotify.com/track/2D4FPjRVAWPGZUnO3Qzz8d"};


        //fml album (6 tracks): f*ck my life, super, fire, i don't understand but i luv u, dust, april shower
        String[] g41 = {"https://open.spotify.com/track/1DI66g4SmYOnZQVdZd51Oa", "https://open.spotify.com/track/3ZpfXyQgcqdSA1TGNc7Ret", "https://open.spotify.com/track/2hqn75Y9fEzL0qPoPRXCvX", "https://open.spotify.com/track/3acGHJqr9xU1cnCEfLX1Lx", "https://open.spotify.com/track/7v8v911KfBuFkqXvuDOtNm", "https://open.spotify.com/track/7rIXkPCaibFJTs4rKS29OS"};


        //sara sara single (1 track): sara sara
        String[] g42 = {"https://open.spotify.com/track/7blRMabWMREl9clNkAhvFS"};


        //always yours new tracks album (2 tracks): ima -even if the world ends tomorrow-, sara sara
        String[] g43 = {"https://open.spotify.com/track/2dThVzsCkB0L8tWFvQH53N", "https://open.spotify.com/track/7blRMabWMREl9clNkAhvFS"};


        //always yours best album (25 tracks):
        String[] g44 = {"https://open.spotify.com/track/31d4AK9HwMELTaoTZKVz5v", "https://open.spotify.com/track/6bk9pQwgyR4ihccicvOL9L", "https://open.spotify.com/track/6toOcGbnoQgsExJB9gIjMD", "https://open.spotify.com/track/5jXlUt3NS0iu7pHYPqpK2O", "https://open.spotify.com/track/5UMddRELVtxbeuJzGclmM3", "https://open.spotify.com/track/2r3aqjJhVFc5JjQAaFKNdR", "https://open.spotify.com/track/1DOgZjmj0WnG9lJx12bdI2", "https://open.spotify.com/track/6wO7MuWE2dcqonEwfUO56V", "https://open.spotify.com/track/600K1v7mGmeOD3oWJXN5EZ", "https://open.spotify.com/track/5V3U5OV8s71kqYrllbsFvv", "https://open.spotify.com/track/698iYBQkgOCpBDL8W81U25", "https://open.spotify.com/track/0C49m3uL232ZGOwrEZucxS", "https://open.spotify.com/track/3pgoGjjFNc6OkuDHVyVDoh", "https://open.spotify.com/track/5WaJKsI66o4dr25Oi2U9Mz", "https://open.spotify.com/track/7dtvk4sz96QMYtOJPHQ6qH", "https://open.spotify.com/track/6CSlnSL7YojFoHg6lH2NUm", "https://open.spotify.com/track/1DOmNSj2SZ5IzOBpJqEYvm", "https://open.spotify.com/track/3hq32mYRzuuSFez0N7thp8", "https://open.spotify.com/track/1OIvtRP340w1rr306ToHle", "https://open.spotify.com/track/5Pcyt19ffym6qDirHrPKll", "https://open.spotify.com/track/748HZyUpqoafPp9MELCThm", "https://open.spotify.com/track/1GzYKagCh7jmdETXLcxT3H", "https://open.spotify.com/track/3bxt2gMvBO1Q1g0WZVOSdq", "https://open.spotify.com/track/3sNVR4S8cqLi9iTAubDjtY", "https://open.spotify.com/track/14PwX86SHtCsdYNBbtWNJd"};


        //dirty dancing remix single (1 tracks): dirty dancing (feat. joshua, dk & dino
        String[] g45 = {"https://open.spotify.com/track/6KfYVOicblNB8CaDZwbxiT"};


        //seventeenth heaven album (8 tracks): sos, gom, diamond days, back 2 back, monster, yawn, headliner, gom (inst.)
        String[] g46 = {"https://open.spotify.com/track/3oTDi9MWC0JB39FcsLRon3", "https://open.spotify.com/track/4MTNimMDRyFZv37Thcktwa", "https://open.spotify.com/track/6n5M2Al3QgTScpO4AZH9OI", "https://open.spotify.com/track/40PKBUQRjtW2pUg4zv3y7r", "https://open.spotify.com/track/1RMnVmHGSvxlexnenQEXSb", "https://open.spotify.com/track/1qzvzPfqzpNQ01ZBOEkVlf", "https://open.spotify.com/track/6Es0Sxn1yE7L0T1YxrYHKX", "https://open.spotify.com/track/0Qaw6haFnOnzDxQvXnxmGG"};


        //golm (3 tracks) golm, gom (trot remix), golm (inst.)
        String[] g47 = {"https://open.spotify.com/track/0xZ4WU5UfctiSeETi6pMEo", "https://open.spotify.com/track/6h13gMfEDlVlXFb8iDVaXb", "https://open.spotify.com/track/7viNY0jOjNJuLwsgAOPsBK"};


        //super (workout remix) 1 track
        String[] g48 = {"https://open.spotify.com/track/6P7m3AZlTUm39hkeAgQNMk"};


        //17 is right here best album (33 tracks)
        String[] g49 = {"https://open.spotify.com/track/2UE9XGbAzicJIyo4bB6sqM", "https://open.spotify.com/track/45xiC13XQsLhV57FxQLlLV", "https://open.spotify.com/track/2L6QRccSHAsdZDc9gz6Bfi", "https://open.spotify.com/track/1XvOEvWtfa879Wk1wKHZ1M"};
        String[] g50 = {"https://open.spotify.com/track/469YeZRBzZw8AnNQvG5GRS"};
        String[] g51 = {"https://open.spotify.com/track/2lYLfG1WddMzvyJvc7imyB", "https://open.spotify.com/track/0AnMBa8yQZlD2B7B1myBuf"};
        String[] g52 = {"https://open.spotify.com/track/1r8KUc67Ur0rX5phChNg1B", "https://open.spotify.com/track/1cqUmROW9Pxm7bCNYcQg7i", "https://open.spotify.com/track/0DirozYGvisibHzZhdgRSQ", "https://open.spotify.com/track/4QJ3R0wwwtmll1eAxvV3PB", "https://open.spotify.com/track/2NSCKPxS53FFgIOgiMAFZy"};
        String[] g53 = {"https://open.spotify.com/track/7sEQgmTiEWwMzdnRA28OW1", "https://open.spotify.com/track/26OTyz9vMgYKvTvJONpNk4", "https://open.spotify.com/track/2mFCN72V3rTq1BT4WWddIF", "https://open.spotify.com/track/3nAUdBQxle8l1EeOxW3m0R", "https://open.spotify.com/track/4wwEpkAwaT65hVmcg9zQSi", "https://open.spotify.com/track/1WEk8mX0loccWCAcTZqVH8", "https://open.spotify.com/track/0pIJiHChaM9jlrlPCAP4aI", "https://open.spotify.com/track/2MveMeTbVlWtumO4VPOodG", "https://open.spotify.com/track/4ldXW2srmZMpwqy5SayT6i", "https://open.spotify.com/track/3qOdLKfizw3Sc4KmDLeABG", "https://open.spotify.com/track/481yKEOzsONgSgVXlUfOhy", "https://open.spotify.com/track/065yxZRBAsenRLZacB1uc2", "https://open.spotify.com/track/4w25m2448QReLEsiuqhpLt", "https://open.spotify.com/track/5Pqo2Fel77vnFY03uGFtiD", "https://open.spotify.com/track/4CAK2Dmo5YVGDQxs789pbx", "https://open.spotify.com/track/3g9z9amouOxjEZve1SpSTE", "https://open.spotify.com/track/2TLzrymJ9lpH2wXp1ub5Aj", "https://open.spotify.com/track/1DI66g4SmYOnZQVdZd51Oa", "https://open.spotify.com/track/3ZpfXyQgcqdSA1TGNc7Ret", "https://open.spotify.com/track/6KNp9wSUGYhtbE33su6xZv"};
        String[] g54 = {"https://open.spotify.com/track/3FT1B7OCBJ4SWxEsc1hX0T"};


        //maestro remix single (3 tracks): maestro, maestro (orchestra remix), maestro (inst.)
        String[] g55 = {"https://open.spotify.com/track/743yOACnWcrrijTnWdT5YN", "https://open.spotify.com/track/36LiHWhPhdKScTlDpEsUyv", "https://open.spotify.com/track/74OpaW8zaYTx4TUuvipmxn"};


        //spill the feels album (6 tracks): eyes on you, love, money, fame, 1 to 13, candy, rain, water
        String[] g56 = {"https://open.spotify.com/track/7qkv7ZLTIMkObkyhNo6sdQ", "https://open.spotify.com/track/3I2OBA3kKdbDYzFAkDuc81", "https://open.spotify.com/track/5UpOKgvHCp0HkXDgxmWM7F", "https://open.spotify.com/track/3CEm0R0huTRT1IcxYhuTWv", "https://open.spotify.com/track/6rp55IcEsq3nJgTc0kMa0h", "https://open.spotify.com/track/1DQGGkXu9SIwWiK5uuBvcO"};


        //love, money, fame remixes album (6 tracks)
        String[] g57 = {"https://open.spotify.com/track/61HEVn08IpqpAHnqqc38RB", "https://open.spotify.com/track/5NfUbEKgLTdUWHTcU7F56Q", "https://open.spotify.com/track/61r3yzUmILG3cIquKdFRZO", "https://open.spotify.com/track/2kMUi2FZkuj8d4lNo3UtzY", "https://open.spotify.com/track/2LBoWyCgW1BBwNbtN61Ik6", "https://open.spotify.com/track/36LcCpAK7ColfpTTRNChhz"};


        //shohikigen album (3 tracks): shohikigen, circles - japanese ver., maestro - japanese ver.
        String[] g58 = {"https://open.spotify.com/track/2dWiIeBifOmLN3r74JwqJ2", "https://open.spotify.com/track/1DvDOdE2R3wlpFZMfdPAeK", "https://open.spotify.com/track/05QpqXYyWHX30UrrqScDub"};


        //happy burstday album (16 tracks)
        String[] g59 = {"https://open.spotify.com/track/6E0o3c4mgb7K5DB2TXg4XX", "https://open.spotify.com/track/6oeMntjclWLoguzwj5ECTo", "https://open.spotify.com/track/2B0l8kFr4PzxH6gqX3NIoi", "https://open.spotify.com/track/6GrZkYlCYIuHEjPpTZ3qDb", "https://open.spotify.com/track/6HmKlhejcNEEsQZEGjnrmR", "https://open.spotify.com/track/5V5r0GBQFvNNgVfIFFpkic", "https://open.spotify.com/track/5X6A8puJNGzQaAhHJgx1Ld", "https://open.spotify.com/track/3ESkEsiPkaXl0CCRUMGkIk", "https://open.spotify.com/track/1MO3vlEZjAQHM6i1HJtZMA", "https://open.spotify.com/track/4nHwPRwu1imdTzmbIDJD6z", "https://open.spotify.com/track/36Z4DNWV6g6Vr9c5eSSPK3", "https://open.spotify.com/track/73j3bR9wX3Gip4P7zsmkWV", "https://open.spotify.com/track/1N7EvHKdB4bCzfF1C5GhwN", "https://open.spotify.com/track/6Z9QbzkKGGiMJGWiEvdAax", "https://open.spotify.com/track/1e6nbIrqZMduZNRCpBfbvl", "https://open.spotify.com/track/6AwBSWBq9WvZmJRqqv12Fa"};


        //til my fingers bleed single (1 track): til my fingers bleed (with dino, duckwrth & telle)
        String[] g60 = {"https://open.spotify.com/track/5ZwXgb8dQuK1GC15s7tG5L"};


        //where love passed japanese digital single (1 track): where love passed
        String[] g61 = {"https://open.spotify.com/track/6lYyAMPOD6XXVNrVyxakAL"};


        //love is gone single (2 tracks): love is gone (with joshua and dylan matthew), love is gone (with joshua)
        String[] g62 = {"https://open.spotify.com/track/0L3tD2Sc15kj9WQyUF7uTm", "https://open.spotify.com/track/4FTcJ9B6S2QXObqRr9UG8U"};


        //illegal + seventeen single (1 track): illegal + seventeen
        String[] g63 = {"https://open.spotify.com/track/2c6uK2BQ9ccN9KOgQPfrop"};


        //tiny light single (1 track): tiny light
        String[] g64 = {"https://open.spotify.com/track/0r4WKpapZS9Fit7iJr3XM1"};


        //Execute pipeline
        printSumOfGroup(driver, g1);
        printSumOfGroup(driver, g2);
        printSumOfGroup(driver, g3);
        printSumOfGroup(driver, g4);
        printSumOfGroup(driver, g5);


        long g6Sum = getGroupTotal(driver, g6);
        long g7Sum = getGroupTotal(driver, g7);
        System.out.println(nf.format(g6Sum + g7Sum));
        System.out.println(nf.format(g6Sum));


        printSumOfGroup(driver, g8);
        printSumOfGroup(driver, g9);
        printSumOfGroup(driver, g10);
        printSumOfGroup(driver, g11);
        printSumOfGroup(driver, g12);
        printSumOfGroup(driver, g13);
        printSumOfGroup(driver, g14);
        printSumOfGroup(driver, g15);
        printSumOfGroup(driver, g16);
        printSumOfGroup(driver, g17);
        printSumOfGroup(driver, g18);
        printSumOfGroup(driver, g19);


        long g20_allSum = 0;
        long g20_last10Sum = 0;
        for (int i = 0; i < g20.length; i++) {
            long count = fetchCount(driver, g20[i]);
            g20_allSum += count;
            if (i >= 1) g20_last10Sum += count;
        }
        System.out.println(nf.format(g20_last10Sum));
        System.out.println(nf.format(g20_allSum));


        printSumOfGroup(driver, g21);
        printSumOfGroup(driver, g22);
        printSumOfGroup(driver, g23);
        printSumOfGroup(driver, g24);
        printSumOfGroup(driver, g25);
        printSumOfGroup(driver, g26);
        printSumOfGroup(driver, g27);
        printSumOfGroup(driver, g28);
        printSumOfGroup(driver, g29);
        printSumOfGroup(driver, g30);
        printSumOfGroup(driver, g31);
        printSumOfGroup(driver, g32);
        printSumOfGroup(driver, g33);
        printSumOfGroup(driver, g34);


        long g35_allSum = 0;
        long g35_last8Sum = 0;
        for (int i = 0; i < g35.length; i++) {
            long count = fetchCount(driver, g35[i]);
            g35_allSum += count;
            if (i >= 1) g35_last8Sum += count;
        }
        System.out.println(nf.format(g35_last8Sum));
        System.out.println(nf.format(g35_allSum));


        long g36Sum = getGroupTotal(driver, g36);
        long g37Sum = getGroupTotal(driver, g37);
        System.out.println(nf.format(g36Sum + g37Sum));
        System.out.println(nf.format(g36Sum));


        printSumOfGroup(driver, g38);
        printSumOfGroup(driver, g39);
        printSumOfGroup(driver, g40);
        printSumOfGroup(driver, g41);
        printSumOfGroup(driver, g42);


        long g43Sum = getGroupTotal(driver, g43);
        long g44Sum = getGroupTotal(driver, g44);
        System.out.println(nf.format(g43Sum + g44Sum));
        System.out.println(nf.format(g43Sum));


        printSumOfGroup(driver, g45);
        printSumOfGroup(driver, g46);
        printSumOfGroup(driver, g47);
        printSumOfGroup(driver, g48);


        long g49Sum = getGroupTotal(driver, g49);
        long g50Sum = getGroupTotal(driver, g50);
        long g51Sum = getGroupTotal(driver, g51);
        long g52Sum = getGroupTotal(driver, g52);
        long g53Sum = getGroupTotal(driver, g53);
        long g54Sum = getGroupTotal(driver, g54);


        System.out.println(nf.format(g49Sum + g50Sum + g51Sum + g52Sum + g53Sum + g54Sum));
        System.out.println(nf.format(g49Sum));
        System.out.println(nf.format(g49Sum + g50Sum + g52Sum + g54Sum));


        long g55_last2Sum = 0;
        for (int i = 0; i < g55.length; i++) {
            long count = fetchCount(driver, g55[i]);
            if (i >= 1) g55_last2Sum += count;
        }
        System.out.println(nf.format(g55_last2Sum));


        printSumOfGroup(driver, g56);
        printSumOfGroup(driver, g57);
        printSumOfGroup(driver, g58);
        printSumOfGroup(driver, g59);
        printSumOfGroup(driver, g60);
        printSumOfGroup(driver, g61);
        printSumOfGroup(driver, g62);
        printSumOfGroup(driver, g63);
        printSumOfGroup(driver, g64);


        // Final extraction step: Monthly Listeners
        fetchMonthlyListeners();
        // Total group streams use original releases and standalone singles.
        // Best-of compilations repeat recordings under alternative Spotify IDs;
        // including all of those IDs inflates the artist-wide total.
        printTotalStreams(new String[][]{
            g1,g2,g3,g4,g5,g6,g7,g8,g9,g10,g11,g12,g13,g14,g15,g16,
            g17,g18,g19,g20,g21,g22,g23,g24,g25,g26,g27,g28,g29,g30,g31,g32,
            g33,g34,g35,g36,g37,g38,g39,g40,g41,g42,g43,g44,g45,g46,g47,g48,
            g55,g56,g57,g58,g59,g60,g61,g62,g63,g64
        });



        // Clean shutdown (No killing your personal Chrome tabs)
        try {
            if (driver != null) driver.quit();
        } catch (Exception ignored) {}


        System.out.println("\n=== Process finished successfully ===");
    }


    private static long fetchCount(WebDriver activeDriver, String songUrl) throws InterruptedException {
        if (songUrl.contains("?si=")) {
            songUrl = songUrl.split("\\?si=")[0];
        }


        if (streamCache.containsKey(songUrl)) {
            long cachedValue = Long.parseLong(streamCache.get(songUrl).replaceAll("[^\\d]", ""));
            System.out.println(nf.format(cachedValue));
            return cachedValue;
        }


        String text = "0";
        int attempts = 0;
        final int MAX_ATTEMPTS = 6;


        while (attempts < MAX_ATTEMPTS) {
            try {
                driver.get(songUrl);
                Thread.sleep(2200 + (int)(Math.random() * 1800));


                ((JavascriptExecutor) driver).executeScript("window.scrollBy(0, 800);");
                Thread.sleep(800);


                WebElement el = driver.findElement(By.xpath("//span[@data-testid='playcount']"));
                text = el.getText().trim();


                if (!text.isEmpty() && text.matches(".*\\d.*") && !text.equals("0")) {
                    streamCache.put(songUrl, text);
                    long value = Long.parseLong(text.replaceAll("[^\\d]", ""));
                    System.out.println(nf.format(value));
                    return value;
                }
                attempts++;
            } catch (Exception e) {
                attempts++;
                if (attempts >= 4) restartDriver();
                Thread.sleep(8000);
            }
        }


        // Final aggressive try
        try {
            driver.get(songUrl);
            Thread.sleep(4500);
            WebElement el = driver.findElement(By.xpath("//span[@data-testid='playcount']"));
            text = el.getText().trim();
        } catch (Exception ignored) {}


        long parsedValue = 0;
        try {
            parsedValue = Long.parseLong(text.replaceAll("[^\\d]", ""));
        } catch (Exception ignored) {}


        System.out.println(nf.format(parsedValue));
        return parsedValue;
    }


    private static void printSumOfGroup(WebDriver driver, String[] group) throws InterruptedException {
        long total = 0;
        for (String song : group) {
            total += fetchCount(driver, song);
        }
        System.out.println(nf.format(total));
    }


    private static long getGroupTotal(WebDriver driver, String[] group) throws InterruptedException {
        long total = 0;
        for (String song : group) {
            total += fetchCount(driver, song);
        }
        return total;
    }


    private static void fetchMonthlyListeners() {
        try {
            driver.get("https://open.spotify.com/artist/7nqOGRxlXj7N2JYbgNEjYH");
            Thread.sleep(2500);
            long listenersCount = getMonthlyListenersCount(driver);
            System.out.println(nf.format(listenersCount));
        } catch (Exception e) {
            System.out.println("Failed to fetch monthly listeners");
        }
    }


    private static long getMonthlyListenersCount(WebDriver driver) throws InterruptedException {
        for (int attempt = 0; attempt < 6; attempt++) {
            long parsedFromPageText = parseMonthlyListeners(getBodyText(driver));
            if (parsedFromPageText > 0) {
                return parsedFromPageText;
            }


            List<WebElement> candidates = driver.findElements(By.xpath("//*[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'monthly listener')]"));
            for (WebElement candidate : candidates) {
                long parsedValue = parseMonthlyListeners(candidate.getText());
                if (parsedValue > 0) {
                    return parsedValue;
                }
            }


            List<WebElement> oldClassCandidates = driver.findElements(By.className("OfUgH_tIc38f08wU"));
            for (WebElement candidate : oldClassCandidates) {
                long parsedValue = parseNumber(candidate.getText());
                if (parsedValue > 0) {
                    return parsedValue;
                }
            }


            Thread.sleep(1500);
        }


        throw new RuntimeException("Monthly listeners count not found");
    }


    private static String getBodyText(WebDriver driver) {
        Object bodyText = ((JavascriptExecutor) driver).executeScript("return document.body ? document.body.innerText : '';");
        return bodyText == null ? "" : bodyText.toString();
    }


    private static long parseMonthlyListeners(String text) {
        Matcher matcher = MONTHLY_LISTENERS_PATTERN.matcher(text);
        if (matcher.find()) {
            return parseNumber(matcher.group(1));
        }
        return 0;
    }


    private static long parseNumber(String text) {
        String digitsOnly = text.replaceAll("[^\\d]", "");
        if (digitsOnly.isEmpty()) {
            return 0;
        }
        return Long.parseLong(digitsOnly);
    }


    // Count each Spotify track only once across original releases.
    // Compilation-specific IDs remain available in their album totals,
    // but are not automatically treated as new songs in the artist total.
    private static void printTotalStreams(String[][] releases) {
        java.util.Set<String> ids = new java.util.HashSet<>();
        for (String[] release : releases) {
            for (String url : release) {
                ids.add(url.split(java.util.regex.Pattern.quote("?"))[0]);
            }
        }
        long total = 0;
        int missing = 0;
        for (String id : ids) {
            String value = streamCache.get(id);
            if (value == null) {
                missing++;
                continue;
            }
            total += parseNumber(value);
        }
        if (missing > 0) {
            System.out.println("Total Streams: unavailable (" + missing + " tracks missing)");
            return;
        }
        System.out.println("Total Streams: " + nf.format(total));
        System.out.println("STAT_TOTAL_STREAMS|" + total);
    }

    private static void restartDriver() {
        try {
            if (driver != null) driver.quit();
        } catch (Exception ignored) {}
        driver = new ChromeDriver(getFastChromeOptions());
    }
}

