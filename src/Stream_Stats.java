```
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


    private static ChromeOptions getFastChromeOptions() {
        ChromeOptions options = new ChromeOptions();


        options.addArguments("--headless=new");


        options.addArguments("--user-data-dir=/tmp/selenium-seventeen-profile-" + System.currentTimeMillis());
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--remote-debugging-port=0");
        options.addArguments("--disable-extensions");
        options.addArguments("--disable-plugins");
        options.addArguments("--incognito");


        options.addArguments("--disable-blink-features=AutomationControlled");
        options.setExperimentalOption("excludeSwitches", new String[]{"enable-automation"});
        options.setExperimentalOption("useAutomationExtension", false);
        options.addArguments("--disable-devtools");
        options.addArguments("--disable-features=DevTools");


        options.addArguments("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36");


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


        Logger.getLogger("").setLevel(Level.OFF);                    // Root logger
        Logger.getLogger("org.openqa.selenium").setLevel(Level.OFF);
        Logger.getLogger("org.openqa.selenium.devtools").setLevel(Level.OFF);
        Logger.getLogger("org.openqa.selenium.chromium").setLevel(Level.OFF);
        Logger.getLogger("org.openqa.selenium.devtools.CdpVersionFinder").setLevel(Level.OFF);


        System.setProperty("webdriver.chrome.silentOutput", "true");
        System.setProperty("selenium.silent", "true");


        driver = new ChromeDriver(getFastChromeOptions());
        nf = NumberFormat.getInstance(Locale.US);


        String[] g1 = {"https://open.spotify.com/track/4BHThgh4ODCszIJ6e4YGGw", "https://open.spotify.com/track/7sEQgmTiEWwMzdnRA28OW1", "https://open.spotify.com/track/6HzEfSRlDNkgmOZBvedvM6", "https://open.spotify.com/track/5o9VWCaFtNsOcaYsiADCgC", "https://open.spotify.com/track/30KwJprbzKR4uXLKEG8dMM"};


        String[] g2 = {"https://open.spotify.com/track/7ppRZp3i4KpK7UHeNLAHrJ", "https://open.spotify.com/track/26OTyz9vMgYKvTvJONpNk4", "https://open.spotify.com/track/6Cnzpz5iL9MhyDbco7YvOX", "https://open.spotify.com/track/1DyOe08LQyJhsLDcSXiNxO", "https://open.spotify.com/track/17MlnACcP3VDE7xHMaToGF"};


        String[] g3 = {"https://open.spotify.com/track/1pHCzbRvRFg59Kvc7WHckN"};


        String[] g4 = {"https://open.spotify.com/track/6MuMUDjfgftMIz8Q3ruF22"};


        String[] g5 = {"https://open.spotify.com/track/4r08Zd72ZYPcPTOZ8CqPyH", "https://open.spotify.com/track/1117juaaAkSIUsQxTmmcKM", "https://open.spotify.com/track/5KndefUfeQhGoYCluAaDWj", "https://open.spotify.com/track/0Su3Wr6cKTrIkLx9VWgi3l", "https://open.spotify.com/track/1maafRRnys7gGBUXcjhzmM", "https://open.spotify.com/track/7zNRdjBB9HFT7CoOaEVzRF", "https://open.spotify.com/track/1S3Zo9gPe2KCJUKa5wLdVZ", "https://open.spotify.com/track/37V533dS8hn2q2tTkbVAlV", "https://open.spotify.com/track/3ygoTUnTWMCOPqcWoz9cQ5", "https://open.spotify.com/track/5UZJPEEup9UVUojRKXcv0f"};


        String[] g6 = {"https://open.spotify.com/track/3VIWAghaRZzHA1HsQH7EwD", "https://open.spotify.com/track/1Rrj7KyS2R6SP9CQMDJW1w", "https://open.spotify.com/track/1nyzf00hpVfBkHlZSVJuky", "https://open.spotify.com/track/0mv9yj1mjcEJes46dHDib5", "https://open.spotify.com/track/44zJN1C94Xuh5wt6czfvth"};


        String[] g7 = {"https://open.spotify.com/track/4r08Zd72ZYPcPTOZ8CqPyH", "https://open.spotify.com/track/1117juaaAkSIUsQxTmmcKM", "https://open.spotify.com/track/5KndefUfeQhGoYCluAaDWj", "https://open.spotify.com/track/0Su3Wr6cKTrIkLx9VWgi3l", "https://open.spotify.com/track/1maafRRnys7gGBUXcjhzmM", "https://open.spotify.com/track/7zNRdjBB9HFT7CoOaEVzRF", "https://open.spotify.com/track/1S3Zo9gPe2KCJUKa5wLdVZ", "https://open.spotify.com/track/37V533dS8hn2q2tTkbVAlV", "https://open.spotify.com/track/3ygoTUnTWMCOPqcWoz9cQ5", "https://open.spotify.com/track/5UZJPEEup9UVUojRKXcv0f"};


        String[] g8 = {"https://open.spotify.com/track/0fK4XOE0TjcXOcMezZtncZ", "https://open.spotify.com/track/4wwEpkAwaT65hVmcg9zQSi", "https://open.spotify.com/track/6FdIEgj8ErhkOHbtB6aqFF", "https://open.spotify.com/track/25jVJDgG9Nv0jFIIPeb0c7", "https://open.spotify.com/track/0q3caW0ttDdykrD2fOKTpw", "https://open.spotify.com/track/01bnqaE6nQogjdMMrrL1dj", "https://open.spotify.com/track/7cwjntgP717i0JZFGoTPMH", "https://open.spotify.com/track/054sQZ2qmw0Ya7N0XSxl3j"};


        String[] g9 = {"https://open.spotify.com/track/1WEk8mX0loccWCAcTZqVH8", "https://open.spotify.com/track/0ePDb0b1tMQlqP9u58pmcg", "https://open.spotify.com/track/0JPyJEA13qkSemzWS3tOs1", "https://open.spotify.com/track/0WdLp00HrAgjldOqFTpqb5", "https://open.spotify.com/track/0y3KqHpaqKhkHMM50HTeQy", "https://open.spotify.com/track/1EbXVXelBudLyGasyGj7Ot"};


        String[] g10 = {"https://open.spotify.com/track/6qEtE4d5SpNuxSPcuFQpno", "https://open.spotify.com/track/6j6wUN8whCYTwxCg9R240U", "https://open.spotify.com/track/0cbh6m6Ita9t4sKVDJQZFP", "https://open.spotify.com/track/0pIJiHChaM9jlrlPCAP4aI", "https://open.spotify.com/track/047A83COIzAFLcZKLz20MP", "https://open.spotify.com/track/55M6WlPDc8WID9UcmWjbYM", "https://open.spotify.com/track/6MEsfQJ5ZpO1WozVfsVDzZ", "https://open.spotify.com/track/2NvrIHgujKttUQyx2uUMY9", "https://open.spotify.com/track/3wIDLZ8nEHeyxSrVJsD6tv", "https://open.spotify.com/track/3o83eepKSAqhA2pkdxXCkL", "https://open.spotify.com/track/7snRPf9l4LRCMV3hD8WD3W", "https://open.spotify.com/track/3p1J2lefXYI4mMQqXUez75", "https://open.spotify.com/track/0leIXrxhkEBGoR8O8PZQEg"};


        String[] g11 = {"https://open.spotify.com/track/2oGLTWJpqJxr1oM8yM5pwO", "https://open.spotify.com/track/2MveMeTbVlWtumO4VPOodG", "https://open.spotify.com/track/7MhirYiYlbhN8L1y6VwbBu", "https://open.spotify.com/track/01aVuBzov1TL2iCNhwkguC"};


        String[] g12 = {"https://open.spotify.com/track/31d4AK9HwMELTaoTZKVz5v", "https://open.spotify.com/track/6wO7MuWE2dcqonEwfUO56V", "https://open.spotify.com/track/600K1v7mGmeOD3oWJXN5EZ", "https://open.spotify.com/track/5V3U5OV8s71kqYrllbsFvv", "https://open.spotify.com/track/698iYBQkgOCpBDL8W81U25"};


        String[] g13 = {"https://open.spotify.com/track/4ldXW2srmZMpwqy5SayT6i", "https://open.spotify.com/track/5nR49Yw6tAlOd1DLfuwWAA", "https://open.spotify.com/track/7GJGh9jy8I6fj7MIZfJEh1", "https://open.spotify.com/track/5FxM6pVE15a8xYUv8eOIxe", "https://open.spotify.com/track/2RevV77RPztZ3I4snuCzGU", "https://open.spotify.com/track/2EGRE8lyfRRGuq7spra3eR"};


        String[] g14 = {"https://open.spotify.com/track/5P0Uo1LqAgvFuxabQMe81X"};


        String[] g15 = {"https://open.spotify.com/track/65QDnqGpWrHhnViAM1D4Sd"};


        String[] g16 = {"https://open.spotify.com/track/4RWbyug0n12hOVHDxRAj5y", "https://open.spotify.com/track/3qOdLKfizw3Sc4KmDLeABG", "https://open.spotify.com/track/7jPev7m1RQ6gUMYIfGobAl", "https://open.spotify.com/track/6d3kU4E8NXpWbCvJZxmm0l", "https://open.spotify.com/track/0jOxIZxnUN323CjyzRA5om", "https://open.spotify.com/track/4CQsxHBYtQvDuNPnlDo5RE"};


        String[] g17 = {"https://open.spotify.com/track/5G5MW3CIQ26AV08Yl7UV6m"};


        String[] g18 = {"https://open.spotify.com/track/6bk9pQwgyR4ihccicvOL9L", "https://open.spotify.com/track/63jDEQCIg1YJLYeiqKJxFg", "https://open.spotify.com/track/3pgoGjjFNc6OkuDHVyVDoh"};


        String[] g19 = {"https://open.spotify.com/track/0uIw1c0E2nyFWWwEVzhl30"};


        String[] g20 = {"https://open.spotify.com/track/0uIw1c0E2nyFWWwEVzhl30", "https://open.spotify.com/track/5uUK45snr9SPeUuI2aubcF", "https://open.spotify.com/track/481yKEOzsONgSgVXlUfOhy", "https://open.spotify.com/track/6wgC1bu0BIx0K9TBbkINDA", "https://open.spotify.com/track/1FlIEnP3DdFgeP3dhVfNZf", "https://open.spotify.com/track/6RJxJpOaCZ4DamSgJaMoJ8", "https://open.spotify.com/track/30S8t6er5QvMBugOzLJnV9", "https://open.spotify.com/track/6c5ccrEzRtGQdIM04xNtSI", "https://open.spotify.com/track/6BuUJqtxrQZWKOJFibfFFv", "https://open.spotify.com/track/1Yimn9plSAWNv9G3ePzITO", "https://open.spotify.com/track/2lYLfG1WddMzvyJvc7imyB"};


        String[] g21 = {"https://open.spotify.com/track/7azfhO8VHtektSng0PX5dL", "https://open.spotify.com/track/2w0xNU9qdueLOPgLcZrRhs"};


        String[] g22 = {"https://open.spotify.com/track/6toOcGbnoQgsExJB9gIjMD", "https://open.spotify.com/track/5WaJKsI66o4dr25Oi2U9Mz", "https://open.spotify.com/track/7dtvk4sz96QMYtOJPHQ6qH"};


        String[] g23 = {"https://open.spotify.com/track/1bhuTWST1TYIVdrsEaQDKa", "https://open.spotify.com/track/065yxZRBAsenRLZacB1uc2", "https://open.spotify.com/track/3YtIeHuvBXkJAyv3twOYCC", "https://open.spotify.com/track/4rnvC8St4YDHGuQdBEByRz", "https://open.spotify.com/track/1kmmKv3L4kGmoPu8aDFOmk", "https://open.spotify.com/track/4yLHe4OAlIFnHerGgHNXBm"};


        String[] g24 = {"https://open.spotify.com/track/5jXlUt3NS0iu7pHYPqpK2O"};


        String[] g25 = {"https://open.spotify.com/track/5jXlUt3NS0iu7pHYPqpK2O", "https://open.spotify.com/track/6CSlnSL7YojFoHg6lH2NUm", "https://open.spotify.com/track/1DOmNSj2SZ5IzOBpJqEYvm", "https://open.spotify.com/track/3hq32mYRzuuSFez0N7thp8", "https://open.spotify.com/track/1OIvtRP340w1rr306ToHle"};


        String[] g26 = {"https://open.spotify.com/track/5SifNhmUO8iSEoWFQU8kxH"};


        String[] g27 = {"https://open.spotify.com/track/4w25m2448QReLEsiuqhpLt", "https://open.spotify.com/track/4wcyQo2iV46LinjXE55RtG", "https://open.spotify.com/track/1hd8IgMElWy3OqcFVjZMUx", "https://open.spotify.com/track/2QeqvHnADmf2fN5sowptuO", "https://open.spotify.com/track/5TgfB8nBnuKaytBbjmrzO7", "https://open.spotify.com/track/11zGbqR6W7biyOgSm3WGSO"};


        String[] g28 = {"https://open.spotify.com/track/5UMddRELVtxbeuJzGclmM3", "https://open.spotify.com/track/5Pcyt19ffym6qDirHrPKll", "https://open.spotify.com/track/748HZyUpqoafPp9MELCThm"};


        String[] g29 = {"https://open.spotify.com/track/2Q4D2Pz1HDt1x4NukBID5Q", "https://open.spotify.com/track/5Pqo2Fel77vnFY03uGFtiD", "https://open.spotify.com/track/12jngD7Hu6if6sIzPkO2k4", "https://open.spotify.com/track/5Zt86CL16kbPvuwcmHMEg8", "https://open.spotify.com/track/7awomfKxYCpcqUlfZav6PD", "https://open.spotify.com/track/1afEbbD4hZvdA5orDq1sPj"};


        String[] g30 = {"https://open.spotify.com/track/5aypcJTIDUwyddBElM1yxc"};


        String[] g31 = {"https://open.spotify.com/track/4rrGSoMxUV0diSX4zpoCTf", "https://open.spotify.com/track/2h1Ul51I7yWhu2KcI6RSaO"};


        String[] g32 = {"https://open.spotify.com/track/25osmdhvjltPlN7gI2Javd", "https://open.spotify.com/track/6LnEoRQKMcaFTR5UvaKuBy", "https://open.spotify.com/track/68kHuoBxtNcWZWxBu1V007", "https://open.spotify.com/track/1ZpiUfzl9P0pMkA03xqmUy", "https://open.spotify.com/track/35jvwACXmrreYIEOAGc2Kr", "https://open.spotify.com/track/0bFiLUmBmFX0aWyhVqIwiN", "https://open.spotify.com/track/6o2Pu5qZcinw4mlDlQZFqu"};


        String[] g33 = {"https://open.spotify.com/track/3I5W8iA8iZAyO62UVceK3F", "https://open.spotify.com/track/2UHaIBd2uiIFLZ9pgHMpJl", "https://open.spotify.com/track/74rpBQDDUA116sss0a0Tiy"};


        String[] g34 = {"https://open.spotify.com/track/2j1Es5qEl4pD8GEe2WsYgP"};


        String[] g35 = {"https://open.spotify.com/track/2j1Es5qEl4pD8GEe2WsYgP", "https://open.spotify.com/track/6I2tqFhk8tq69iursYxuxd", "https://open.spotify.com/track/7BiEgR5r0yMmFoWC9kOTGf", "https://open.spotify.com/track/5Av3flFGhQPu960OvjeNhm", "https://open.spotify.com/track/1sjObenL1HryPaQOiMDVZ9", "https://open.spotify.com/track/2rwJP8OEao5y3xexw52HfD", "https://open.spotify.com/track/5O7UzcP9xERulidcIULOEj", "https://open.spotify.com/track/0ilwFWjTwXszzwaG3XlNWj", "https://open.spotify.com/track/5kc5p2mwO2GFq93zw5ZFWV"};


        String[] g36 = {"https://open.spotify.com/track/6rurduYegrf5XSZrphuyF2", "https://open.spotify.com/track/3QwiidVHfeE9y5jl4n2MTC", "https://open.spotify.com/track/0AnMBa8yQZlD2B7B1myBuf", "https://open.spotify.com/track/1pdFdv8R6ezIAUUNkn785b"};


        String[] g37 = {"https://open.spotify.com/track/2j1Es5qEl4pD8GEe2WsYgP", "https://open.spotify.com/track/6I2tqFhk8tq69iursYxuxd", "https://open.spotify.com/track/7BiEgR5r0yMmFoWC9kOTGf", "https://open.spotify.com/track/5Av3flFGhQPu960OvjeNhm", "https://open.spotify.com/track/1sjObenL1HryPaQOiMDVZ9", "https://open.spotify.com/track/2rwJP8OEao5y3xexw52HfD", "https://open.spotify.com/track/5O7UzcP9xERulidcIULOEj", "https://open.spotify.com/track/0ilwFWjTwXszzwaG3XlNWj", "https://open.spotify.com/track/5kc5p2mwO2GFq93zw5ZFWV"};


        String[] g38 = {"https://open.spotify.com/track/2kDrUAONMhG6CbDGBkhdrY"};


        String[] g39 = {"https://open.spotify.com/track/1DOgZjmj0WnG9lJx12bdI2", "https://open.spotify.com/track/3sNVR4S8cqLi9iTAubDjtY", "https://open.spotify.com/track/14PwX86SHtCsdYNBbtWNJd", "https://open.spotify.com/track/6uPfEWF2CXICTugIoxGCxi"};


        String[] g40 = {"https://open.spotify.com/track/2D4FPjRVAWPGZUnO3Qzz8d"};


        String[] g41 = {"https://open.spotify.com/track/1DI66g4SmYOnZQVdZd51Oa", "https://open.spotify.com/track/3ZpfXyQgcqdSA1TGNc7Ret", "https://open.spotify.com/track/2hqn75Y9fEzL0qPoPRXCvX", "https://open.spotify.com/track/3acGHJqr9xU1cnCEfLX1Lx", "https://open.spotify.com/track/7v8v911KfBuFkqXvuDOtNm", "https://open.spotify.com/track/7rIXkPCaibFJTs4rKS29OS"};


        String[] g42 = {"https://open.spotify.com/track/7blRMabWMREl9clNkAhvFS"};


        String[] g43 = {"https://open.spotify.com/track/2dThVzsCkB0L8tWFvQH53N", "https://open.spotify.com/track/7blRMabWMREl9clNkAhvFS"};


        String[] g44 = {"https://open.spotify.com/track/31d4AK9HwMELTaoTZKVz5v", "https://open.spotify.com/track/6bk9pQwgyR4ihccicvOL9L", "https://open.spotify.com/track/6toOcGbnoQgsExJB9gIjMD", "https://open.spotify.com/track/5jXlUt3NS0iu7pHYPqpK2O", "https://open.spotify.com/track/5UMddRELVtxbeuJzGclmM3", "https://open.spotify.com/track/2r3aqjJhVFc5JjQAaFKNdR", "https://open.spotify.com/track/1DOgZjmj0WnG9lJx12bdI2", "https://open.spotify.com/track/6wO7MuWE2dcqonEwfUO56V", "https://open.spotify.com/track/600K1v7mGmeOD3oWJXN5EZ", "https://open.spotify.com/track/5V3U5OV8s71kqYrllbsFvv", "https://open.spotify.com/track/698iYBQkgOCpBDL8W81U25", "https://open.spotify.com/track/0C49m3uL232ZGOwrEZucxS", "https://open.spotify.com/track/3pgoGjjFNc6OkuDHVyVDoh", "https://open.spotify.com/track/5WaJKsI66o4dr25Oi2U9Mz", "https://open.spotify.com/track/7dtvk4sz96QMYtOJPHQ6qH", "https://open.spotify.com/track/6CSlnSL7YojFoHg6lH2NUm", "https://open.spotify.com/track/1DOmNSj2SZ5IzOBpJqEYvm", "https://open.spotify.com/track/3hq32mYRzuuSFez0N7thp8", "https://open.spotify.com/track/1OIvtRP340w1rr306ToHle", "https://open.spotify.com/track/5Pcyt19ffym6qDirHrPKll", "https://open.spotify.com/track/748HZyUpqoafPp9MELCThm", "https://open.spotify.com/track/1GzYKagCh7jmdETXLcxT3H", "https://open.spotify.com/track/3bxt2gMvBO1Q1g0WZVOSdq", "https://open.spotify.com/track/3sNVR4S8cqLi9iTAubDjtY", "https://open.spotify.com/track/14PwX86SHtCsdYNBbtWNJd"};


        String[] g45 = {"https://open.spotify.com/track/6KfYVOicblNB8CaDZwbxiT"};


        String[] g46 = {"https://open.spotify.com/track/3oTDi9MWC0JB39FcsLRon3", "https://open.spotify.com/track/4MTNimMDRyFZv37Thcktwa", "https://open.spotify.com/track/6n5M2Al3QgTScpO4AZH9OI", "https://open.spotify.com/track/40PKBUQRjtW2pUg4zv3y7r", "https://open.spotify.com/track/1RMnVmHGSvxlexnenQEXSb", "https://open.spotify.com/track/1qzvzPfqzpNQ01ZBOEkVlf", "https://open.spotify.com/track/6Es0Sxn1yE7L0T1YxrYHKX", "https://open.spotify.com/track/0Qaw6haFnOnzDxQvXnxmGG"};


        String[] g47 = {"https://open.spotify.com/track/0xZ4WU5UfctiSeETi6pMEo", "https://open.spotify.com/track/6h13gMfEDlVlXFb8iDVaXb", "https://open.spotify.com/track/7viNY0jOjNJuLwsgAOPsBK"};


        String[] g48 = {"https://open.spotify.com/track/6P7m3AZlTUm39hkeAgQNMk"};


        String[] g49 = {"https://open.spotify.com/track/2UE9XGbAzicJIyo4bB6sqM", "https://open.spotify.com/track/45xiC13XQsLhV57FxQLlLV", "https://open.spotify.com/track/2L6QRccSHAsdZDc9gz6Bfi", "https://open.spotify.com/track/1XvOEvWtfa879Wk1wKHZ1M"};
        String[] g50 = {"https://open.spotify.com/track/469YeZRBzZw8AnNQvG5GRS"};
        String[] g51 = {"https://open.spotify.com/track/2lYLfG1WddMzvyJvc7imyB", "https://open.spotify.com/track/0AnMBa8yQZlD2B7B1myBuf"};
        String[] g52 = {"https://open.spotify.com/track/1r8KUc67Ur0rX5phChNg1B", "https://open.spotify.com/track/1cqUmROW9Pxm7bCNYcQg7i", "https://open.spotify.com/track/0DirozYGvisibHzZhdgRSQ", "https://open.spotify.com/track/4QJ3R0wwwtmll1eAxvV3PB", "https://open.spotify.com/track/2NSCKPxS53FFgIOgiMAFZy"};
        String[] g53 = {"https://open.spotify.com/track/7sEQgmTiEWwMzdnRA28OW1", "https://open.spotify.com/track/26OTyz9vMgYKvTvJONpNk4", "https://open.spotify.com/track/2mFCN72V3rTq1BT4WWddIF", "https://open.spotify.com/track/3nAUdBQxle8l1EeOxW3m0R", "https://open.spotify.com/track/4wwEpkAwaT65hVmcg9zQSi", "https://open.spotify.com/track/1WEk8mX0loccWCAcTZqVH8", "https://open.spotify.com/track/0pIJiHChaM9jlrlPCAP4aI", "https://open.spotify.com/track/2MveMeTbVlWtumO4VPOodG", "https://open.spotify.com/track/4ldXW2srmZMpwqy5SayT6i", "https://open.spotify.com/track/3qOdLKfizw3Sc4KmDLeABG", "https://open.spotify.com/track/481yKEOzsONgSgVXlUfOhy", "https://open.spotify.com/track/065yxZRBAsenRLZacB1uc2", "https://open.spotify.com/track/4w25m2448QReLEsiuqhpLt", "https://open.spotify.com/track/5Pqo2Fel77vnFY03uGFtiD", "https://open.spotify.com/track/4CAK2Dmo5YVGDQxs789pbx", "https://open.spotify.com/track/3g9z9amouOxjEZve1SpSTE", "https://open.spotify.com/track/2TLzrymJ9lpH2wXp1ub5Aj", "https://open.spotify.com/track/1DI66g4SmYOnZQVdZd51Oa", "https://open.spotify.com/track/3ZpfXyQgcqdSA1TGNc7Ret", "https://open.spotify.com/track/6KNp9wSUGYhtbE33su6xZv"};
        String[] g54 = {"https://open.spotify.com/track/3FT1B7OCBJ4SWxEsc1hX0T"};


        String[] g55 = {"https://open.spotify.com/track/743yOACnWcrrijTnWdT5YN", "https://open.spotify.com/track/36LiHWhPhdKScTlDpEsUyv", "https://open.spotify.com/track/74OpaW8zaYTx4TUuvipmxn"};


        String[] g56 = {"https://open.spotify.com/track/7qkv7ZLTIMkObkyhNo6sdQ", "https://open.spotify.com/track/3I2OBA3kKdbDYzFAkDuc81", "https://open.spotify.com/track/5UpOKgvHCp0HkXDgxmWM7F", "https://open.spotify.com/track/3CEm0R0huTRT1IcxYhuTWv", "https://open.spotify.com/track/6rp55IcEsq3nJgTc0kMa0h", "https://open.spotify.com/track/1DQGGkXu9SIwWiK5uuBvcO"};


        String[] g57 = {"https://open.spotify.com/track/61HEVn08IpqpAHnqqc38RB", "https://open.spotify.com/track/5NfUbEKgLTdUWHTcU7F56Q", "https://open.spotify.com/track/61r3yzUmILG3cIquKdFRZO", "https://open.spotify.com/track/2kMUi2FZkuj8d4lNo3UtzY", "https://open.spotify.com/track/2LBoWyCgW1BBwNbtN61Ik6", "https://open.spotify.com/track/36LcCpAK7ColfpTTRNChhz"};


        String[] g58 = {"https://open.spotify.com/track/2dWiIeBifOmLN3r74JwqJ2", "https://open.spotify.com/track/1DvDOdE2R3wlpFZMfdPAeK", "https://open.spotify.com/track/05QpqXYyWHX30UrrqScDub"};


        String[] g59 = {"https://open.spotify.com/track/6E0o3c4mgb7K5DB2TXg4XX", "https://open.spotify.com/track/6oeMntjclWLoguzwj5ECTo", "https://open.spotify.com/track/2B0l8kFr4PzxH6gqX3NIoi", "https://open.spotify.com/track/6GrZkYlCYIuHEjPpTZ3qDb", "https://open.spotify.com/track/6HmKlhejcNEEsQZEGjnrmR", "https://open.spotify.com/track/5V5r0GBQFvNNgVfIFFpkic", "https://open.spotify.com/track/5X6A8puJNGzQaAhHJgx1Ld", "https://open.spotify.com/track/3ESkEsiPkaXl0CCRUMGkIk", "https://open.spotify.com/track/1MO3vlEZjAQHM6i1HJtZMA", "https://open.spotify.com/track/4nHwPRwu1imdTzmbIDJD6z", "https://open.spotify.com/track/36Z4DNWV6g6Vr9c5eSSPK3", "https://open.spotify.com/track/73j3bR9wX3Gip4P7zsmkWV", "https://open.spotify.com/track/1N7EvHKdB4bCzfF1C5GhwN", "https://open.spotify.com/track/6Z9QbzkKGGiMJGWiEvdAax", "https://open.spotify.com/track/1e6nbIrqZMduZNRCpBfbvl", "https://open.spotify.com/track/6AwBSWBq9WvZmJRqqv12Fa"};


        String[] g60 = {"https://open.spotify.com/track/5ZwXgb8dQuK1GC15s7tG5L"};


        String[] g61 = {"https://open.spotify.com/track/6lYyAMPOD6XXVNrVyxakAL"};


        String[] g62 = {"https://open.spotify.com/track/0L3tD2Sc15kj9WQyUF7uTm", "https://open.spotify.com/track/4FTcJ9B6S2QXObqRr9UG8U"};


        String[] g63 = {"https://open.spotify.com/track/2c6uK2BQ9ccN9KOgQPfrop"};


        String[] g64 = {"https://open.spotify.com/track/0r4WKpapZS9Fit7iJr3XM1"};


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


        fetchMonthlyListeners();


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


    private static void restartDriver() {
        try {
            if (driver != null) driver.quit();
        } catch (Exception ignored) {}
        driver = new ChromeDriver(getFastChromeOptions());
    }
}


```