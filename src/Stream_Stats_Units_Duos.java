package Practice;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.text.NumberFormat;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Stream_Stats_Units_Duos {

    private static final Map<String, String> streamCache = new HashMap<>();
    private static final Pattern MONTHLY_LISTENERS_PATTERN = Pattern.compile("(\\d[\\d,.]*)\\s+monthly listeners?", Pattern.CASE_INSENSITIVE);
    private static NumberFormat nf;

    public static void main(String[] args) throws InterruptedException {

        nf = NumberFormat.getInstance(Locale.US);

        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-blink-features=AutomationControlled");
        options.addArguments("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36");

        if (System.getenv("SVT_FOLLOWERS_ONLY") != null) {
            org.openqa.selenium.logging.LoggingPreferences logPrefs = new org.openqa.selenium.logging.LoggingPreferences();
            logPrefs.enable("performance", java.util.logging.Level.ALL);
            options.setCapability("goog:loggingPrefs", logPrefs);
        }
        WebDriver driver = new ChromeDriver(options);
        if (System.getenv("SVT_FOLLOWERS_ONLY") != null)
            ((ChromeDriver) driver).executeCdpCommand("Network.enable", new HashMap<String, Object>());

        //artist: jeonghan

        //better half (2 tracks): better half (feat. omoinotake), better half -japanese ver.-
        String[] jeonghan_g1 = {"https://open.spotify.com/track/1beUALLSloBEvYre65QiW6", "https://open.spotify.com/track/2KG4bJIKnzH7ZOEBmKsevL"};
        //g2: like you, 12 o'clock, outside, one plus one, coloring, no looking back
        String[] jeonghan_g2 = {"https://open.spotify.com/track/5ZMx7DaPnVisUBLcrFcnCl", "https://open.spotify.com/track/1dp1GI9YcKDoxrKBpp0u9F", "https://open.spotify.com/track/4XBeSUSswrGhqYrwm3IS7A", "https://open.spotify.com/track/1bGAA82A31CWflD6bqY5g6", "https://open.spotify.com/track/69umJ9yk5uay7PQmhBOKk8", "https://open.spotify.com/track/2lDG4sMZwAC2TTlXNHMgA1"};

        long jeonghan_g1Sum = getGroupTotal(driver, jeonghan_g1);
        System.out.println(nf.format(jeonghan_g1Sum)); //better half total
        long jeonghan_g2Sum = getGroupTotal(driver, jeonghan_g2);
        System.out.println(nf.format(jeonghan_g2Sum)); //six new tracks total
        System.out.println(nf.format(jeonghan_g1Sum + jeonghan_g2Sum)); //jeonghan all songs total
        printMonthlyListeners(driver, "https://open.spotify.com/artist/6KDLlQYeeqUe5OQ2JrdNzF"); //jeonghan monthly listeners
        skipTwoLines();

        //artist: joshua

        //g1: our vacation (2 tracks): our vacation, our vacation (inst.)
        String[] joshua_g1 = {"https://open.spotify.com/track/4AJqFqxzozDSZC1iSZIi2S?si=3578d4f1209d4a39", "https://open.spotify.com/track/3s1ipXxVqZqn3qF8pIJXR2?si=ace6a32008354f5b"};
        //g2: shingiru (2 tracks): shingiru, shingiru (inst.)
        String[] joshua_g2 = {"https://open.spotify.com/track/6DVzKtEZUuYW38ac4sTL53?si=f652c4749c8d4c0b", "https://open.spotify.com/track/3QrufE7sgsepVALV7lzFOT?si=0ce43fde2c6d4a81 "};
        //g3: love is gone (2 tracks): love is gone (with joshua and dylan matthew), love is gone (with joshua)
        String[] joshua_g3 = {"https://open.spotify.com/track/4iIx4KfhlrkWBw1nTBo313?si=ae4913d0c93e41e2", "https://open.spotify.com/track/0L3tD2Sc15kj9WQyUF7uTm?si=4d4872e9edf34ec5"};
        //g4: so many roads (1 track): so many roads
        String[] joshua_g4 = {"https://open.spotify.com/track/7hDtClqgAMxBNlLosya834?si=56c9373ba6e14997"};
        //g5: one more dance (1 track): one more dance
        String[] joshua_g5 = {"https://open.spotify.com/track/3TXlqTa1baUv7YCe9yEJEH"};
        //g6: ear (1 track): ear
        String[] joshua_g6 = {"https://open.spotify.com/track/3LO5YMHSmjgNr0TEs5u1uW?si=2bff6a98f655430b"};
        //g7: baby come home (2 tracks): baby come home, baby come home - english ver.
        String[] joshua_g7 = {"https://open.spotify.com/track/2dDvzJ48BUOOrP0Lm5KVnH?si=a3fc67483cc84f6b", "https://open.spotify.com/track/5oJNUXG0wL3eKRdzNfBHDL?si=440867213d964562"};
        //g8: like you, 12 o'clock, outside, one plus one, not personal, no looking back
        String[] joshua_g8 = {"https://open.spotify.com/track/5ZMx7DaPnVisUBLcrFcnCl", "https://open.spotify.com/track/1dp1GI9YcKDoxrKBpp0u9F", "https://open.spotify.com/track/4XBeSUSswrGhqYrwm3IS7A", "https://open.spotify.com/track/1bGAA82A31CWflD6bqY5g6", "https://open.spotify.com/track/2SWWDlOjKqgVvocnIfxId9", "https://open.spotify.com/track/2lDG4sMZwAC2TTlXNHMgA1"};

        long joshua_g1Sum = getGroupTotal(driver, joshua_g1);
        System.out.println(nf.format(joshua_g1Sum)); //our vacation total
        long joshua_g2Sum = getGroupTotal(driver, joshua_g2);
        System.out.println(nf.format(joshua_g2Sum)); //shingiru total
        long joshua_g3Sum = getGroupTotal(driver, joshua_g3);
        System.out.println(nf.format(joshua_g3Sum)); //love is gone (with joshua) total
        long joshua_g4Sum = getGroupTotal(driver, joshua_g4);
        System.out.println(nf.format(joshua_g4Sum)); //so many roads total
        long joshua_g5Sum = getGroupTotal(driver, joshua_g5);
        System.out.println(nf.format(joshua_g5Sum)); //one more dance total
        long joshua_g6Sum = getGroupTotal(driver, joshua_g6);
        System.out.println(nf.format(joshua_g6Sum)); //ear total
        long joshua_g7Sum = getGroupTotal(driver, joshua_g7);
        System.out.println(nf.format(joshua_g7Sum)); //baby come home total
        long joshua_g8Sum = getGroupTotal(driver, joshua_g8);
        System.out.println(nf.format(joshua_g8Sum)); //six new tracks total

        System.out.println(nf.format(joshua_g1Sum + joshua_g2Sum + joshua_g3Sum + joshua_g4Sum + joshua_g5Sum + joshua_g6Sum + joshua_g7Sum + joshua_g8Sum)); //joshua total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/74AwWFYdjQ3ER5vHO4H7b0?si=x9EC-iH4RRaodgt36c8nTg"); //joshua monthly listener
        skipTwoLines();

        //artist: jun

        //g1: dream (1 track): dream
        String[] jun_g1 = {"https://open.spotify.com/track/2FpI3GCkEQOT40yuAvMj7r?si=625a232581344bc5"};
        //g2: crow (1 track): crow
        String[] jun_g2 = {"https://open.spotify.com/track/7fTc6aBevhBfM6vjSQuWHZ?si=e6358e6f1a614256"};
        //g3: silent boarding gate (1 track): silent boarding gate
        String[] jun_g3 = {"https://open.spotify.com/track/0fSuP4hMUK1CqDAYV62BHF?si=3f5dd93e853548fc"};
        //g4: limbo (1 track counted): Chinese and Korean versions are connected
        String[] jun_g4Chinese = {"https://open.spotify.com/track/1mRv9y4YompRDM1W9LFGwo?si=0179d1429e8849fc"};
        String[] jun_g4Korean = {"https://open.spotify.com/track/54p6HYutzI4V4aXN0UiJ8n?si=519f891be5774e97"};
        //g5: psycho (1 track): psycho
        String[] jun_g5 = {"https://open.spotify.com/track/41B92XjIUVxOqhNAwzlMpp?si=14331d355c2d4bd0"};
        //g6: 赤脚的人 (1 track): 赤脚的人 (仲夏毕业歌会主题曲)
        String[] jun_g6 = {"https://open.spotify.com/track/7H82PsvBZMdW2oESx29hAs?si=72703cc2effe49b7"};
        //g7: worth it (1 track): worth it
        String[] jun_g7 = {"https://open.spotify.com/track/3AMK4O3ct2KmNjNoXdJVYa?si=bd2131a2c0254c2f"};
        //g8: 独家童话 (1 track): 独家童话 (《独家童话》网络剧同名主题曲)
        String[] jun_g8 = {"https://open.spotify.com/track/0LxoYfRVw4g0D6G6ZihIt2?si=877f488b77d740a0"};
        //g9: 殘月 (2 tracks): 殘月 (《长安二十四计》电视剧插曲), 殘月 - 伴奏
        String[] jun_g9 = {"https://open.spotify.com/track/6RItztBk0wvXv81GRXvOXo?si=3580b282e5e3422b", "https://open.spotify.com/track/2HfKxC4Qc4FCgqqzItyogk?si=de157aac4af548f6"};
        //g10: 9 (7 tracks): 360, Yuebei, I See You, Desire, Inward, 4give, 9
        String[] jun_g10 = {"https://open.spotify.com/track/5aUs4Q7h1CGzrh9zx8QyzL?si=f616b5c0d26f4f86", "https://open.spotify.com/track/1OXgXacZCpVYDryihbfUCj?si=7a7b4357367f47b6", "https://open.spotify.com/track/3UZPiRtK3e7UM3h2lOUpWh?si=c2669c5b14c74074", "https://open.spotify.com/track/5fKEfBrvtCM4CNnlSAskuD?si=87f2bd645b9648db", "https://open.spotify.com/track/1fP7HQ7MDoTXQEDG3tYp2Z?si=6a7420161147476b", "https://open.spotify.com/track/7m0VvxYpb8FhWtSKsjrGEW?si=f1935cec23524b5f", "https://open.spotify.com/track/0e0NzRp8SIGy4g801e5jj1?si=6b53d4b213744352"};

        long jun_g1Sum = getGroupTotal(driver, jun_g1);
        System.out.println(nf.format(jun_g1Sum)); //dream total
        long jun_g2Sum = getGroupTotal(driver, jun_g2);
        System.out.println(nf.format(jun_g2Sum)); //crow total
        long jun_g3Sum = getGroupTotal(driver, jun_g3);
        System.out.println(nf.format(jun_g3Sum)); //silent boarding gate total
        long jun_g4ChineseSum = getGroupTotal(driver, jun_g4Chinese);
        long jun_g4KoreanSum = getGroupTotal(driver, jun_g4Korean);
        long jun_g4Sum = jun_g4ChineseSum + jun_g4KoreanSum;
        System.out.println(nf.format(jun_g4Sum)); //limbo total
        long jun_g5Sum = getGroupTotal(driver, jun_g5);
        System.out.println(nf.format(jun_g5Sum)); //psycho total
        long jun_g6Sum = getGroupTotal(driver, jun_g6);
        System.out.println(nf.format(jun_g6Sum)); //赤脚的人 total
        long jun_g7Sum = getGroupTotal(driver, jun_g7);
        System.out.println(nf.format(jun_g7Sum)); //worth it total
        long jun_g8Sum = getGroupTotal(driver, jun_g8);
        System.out.println(nf.format(jun_g8Sum)); //独家童话 total
        long jun_g9Sum = getGroupTotal(driver, jun_g9);
        System.out.println(nf.format(jun_g9Sum)); //殘月 total
        long jun_g10Sum = getGroupTotal(driver, jun_g10);
        System.out.println(nf.format(jun_g10Sum)); //9 total

        System.out.println(nf.format(jun_g1Sum + jun_g2Sum + jun_g3Sum + jun_g4Sum + jun_g5Sum + jun_g6Sum + jun_g7Sum + jun_g8Sum + jun_g9Sum + jun_g10Sum)); //jun total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/38Gn0ZVC8TQwuaMxBK1yRV?si=YtjG0PTkReK0k45edAhk2Q"); //jun monthly listener
        skipTwoLines();

        //artist: hoshi

        //spider (1 track): spider
        String[] hoshi_g1 = {"https://open.spotify.com/track/2TwB7aK39tnZBQjBPgcbCj?si=a4a15394751a4429"};
        //g1: our vacation (2 tracks): our vacation, our vacation (inst.)
        String[] hoshi_g2 = {"https://open.spotify.com/track/4AJqFqxzozDSZC1iSZIi2S?si=3578d4f1209d4a39", "https://open.spotify.com/track/3s1ipXxVqZqn3qF8pIJXR2?si=ace6a32008354f5b"};
        //g2: shingiru (2 tracks): shingiru, shingiru (inst.)
        String[] hoshi_g3 = {"https://open.spotify.com/track/6DVzKtEZUuYW38ac4sTL53?si=f652c4749c8d4c0b", "https://open.spotify.com/track/3QrufE7sgsepVALV7lzFOT?si=0ce43fde2c6d4a81 "};
        //screen time (2 tracks): screen time, screen time b-roll version
        String[] hoshi_g4 = {"https://open.spotify.com/track/4yorFTfi9Tay8tG0NNK7vB?si=618f92cbff664f47", "https://open.spotify.com/track/5wGg3XXTgENKBTSc1M5TNR?si=920e8cc9f0ad4461"};
        //goddess of despair (1 track): goddess of despair
        String[] hoshi_g5 = {"https://open.spotify.com/track/1kMuSPY0CrZsrrUfbGTbnf?si=edb3616908da4bd9"};
        //take a shot (1 track): take a shot
        String[] hoshi_g6 = {"https://open.spotify.com/track/1JTPqGG7hHzLsBWK6caGQz?si=502fcfb10951485d"};
        //fallen superstar (1 track): fallen superstar
        String[] hoshi_g7 = {"https://open.spotify.com/track/4cIL0R9GS1XEqZqEyDvxCn?si=35a36295a4a54d60"};
        //baby, honey (1 track): baby, honey
        String[] hoshi_g8 = {"https://open.spotify.com/track/1UeL63z2l6pAFTDsKdcNLz?si=18e0ff07f37545c2"};
        //snapback (1 track): snapback
        String[] hoshi_g9 = {"https://open.spotify.com/track/3CVdqafJ9WtmiCGkR2d9rJ"};
        //boyfriend (1 track): boyfriend
        String[] hoshi_g10 = {"https://open.spotify.com/track/0Yyh9XpPntsMhbJcC80VfH?si=faa1acd922e4475d"};

        long hoshi_g1Sum = getGroupTotal(driver, hoshi_g1);
        System.out.println(nf.format(hoshi_g1Sum)); //spider total
        long hoshi_g2Sum = getGroupTotal(driver, hoshi_g2);
        System.out.println(nf.format(hoshi_g2Sum)); //our vacation total
        long hoshi_g3Sum = getGroupTotal(driver, hoshi_g3);
        System.out.println(nf.format(hoshi_g3Sum)); //shingiru total
        long hoshi_g4Sum = getGroupTotal(driver, hoshi_g4);
        System.out.println(nf.format(hoshi_g4Sum)); //screen time total
        long hoshi_g5Sum = getGroupTotal(driver, hoshi_g5);
        System.out.println(nf.format(hoshi_g5Sum)); //goddess of despair total
        long hoshi_g6Sum = getGroupTotal(driver, hoshi_g6);
        System.out.println(nf.format(hoshi_g6Sum)); //take a shot total
        long hoshi_g7Sum = getGroupTotal(driver, hoshi_g7);
        System.out.println(nf.format(hoshi_g7Sum)); //fallen superstar total
        long hoshi_g8Sum = getGroupTotal(driver, hoshi_g8);
        System.out.println(nf.format(hoshi_g8Sum)); //baby, honey total
        long hoshi_g9Sum = getGroupTotal(driver, hoshi_g9);
        System.out.println(nf.format(hoshi_g9Sum)); //snapback total
        long hoshi_g10Sum = getGroupTotal(driver, hoshi_g10);
        System.out.println(nf.format(hoshi_g10Sum)); //boyfriend total

        System.out.println(nf.format(hoshi_g1Sum + hoshi_g2Sum + hoshi_g3Sum + hoshi_g4Sum + hoshi_g5Sum + hoshi_g6Sum + hoshi_g7Sum + hoshi_g8Sum + hoshi_g9Sum + hoshi_g10Sum)); //hoshi total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/6nWKAdMv1BDq1zHfZzkdbR?si=DYsu82vsTiy3R9RYkIqz1g "); //hoshi monthly listener
        skipTwoLines();

        //artist: wonwoo

        //bittersweet (1 track): bittersweet (feat. leehi)
        String[] wonwoo_g1 = {"https://open.spotify.com/track/347PJwH4XqRbeaKaIW9sX3?si=2b088e814a9d49c0 "};
        //gogae (1 track): gogae
        String[] wonwoo_g2 = {"https://open.spotify.com/track/27HQm8e5nnVq5y7rHR3ROl?si=8eeb2747da8a4843"};
        //spring, summer, fall, winter (2 tracks): korean ver., japanese ver.
        String[] wonwoo_g3 = {"https://open.spotify.com/track/4KDr3ViGsomHd9cZJsgZDh?si=d4c9093dcc074dd8", "https://open.spotify.com/track/4bZzDnXwhZ9vrQoW8A6Qyz?si=c4ca95725724406f"};

        long wonwoo_g1Sum = getGroupTotal(driver, wonwoo_g1);
        System.out.println(nf.format(wonwoo_g1Sum)); //bittersweet total
        long wonwoo_g2Sum = getGroupTotal(driver, wonwoo_g2);
        System.out.println(nf.format(wonwoo_g2Sum)); //gogae total
        long wonwoo_g3Sum = getGroupTotal(driver, wonwoo_g3);
        System.out.println(nf.format(wonwoo_g3Sum)); //spring, summer, fall, winter total

        System.out.println(nf.format(wonwoo_g1Sum + wonwoo_g2Sum + wonwoo_g3Sum)); //wonwoo total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/3rHcBT06Vb1XGVUWhDALZt?si=NvkHmGXbSbq5qGy0Rplehg"); //wonwoo monthly listener
        skipTwoLines();

        //artist: woozi

        //yosm (1 track): yosm
        String[] woozi_g1 = {"https://open.spotify.com/track/3euYNE8OgAMAy6caUKOUeL?si=00c44960b32446e1 "};
        //miracle (2 tracks): miracle, miracle - inst.
        String[] woozi_g2 = {"https://open.spotify.com/track/0YLLRbbpq3Qte4rszcddMk?si=82c55f0745554380", "https://open.spotify.com/track/6NgPTrPpxDfZ5lsIiSrH4P?si=db758295d1204f4b"};
        //ruby (1 track): ruby
        String[] woozi_g3 = {"https://open.spotify.com/track/5ljGBxXb9LthJK0rW61G6X?si=be5d3b5a99ae4002"};
        //what kind of future (1 track): what kind of future
        String[] woozi_g4 = {"https://open.spotify.com/track/1DXomndYd10iSX9uZSPv6e?si=7050fa4670b3492e"};
        //blooming (1 track): blooming
        String[] woozi_g5 = {"https://open.spotify.com/track/27mTIjFv2rSlcN89dS9YDF?si=5b723b5fe0b44ddf"};

        long woozi_g1Sum = getGroupTotal(driver, woozi_g1);
        System.out.println(nf.format(woozi_g1Sum)); //yosm total
        long woozi_g2Sum = getGroupTotal(driver, woozi_g2);
        System.out.println(nf.format(woozi_g2Sum)); //miracle total
        long woozi_g3Sum = getGroupTotal(driver, woozi_g3);
        System.out.println(nf.format(woozi_g3Sum)); //ruby total
        long woozi_g4Sum = getGroupTotal(driver, woozi_g4);
        System.out.println(nf.format(woozi_g4Sum)); //what kind of future total
        long woozi_g5Sum = getGroupTotal(driver, woozi_g5);
        System.out.println(nf.format(woozi_g5Sum)); //blooming total

        System.out.println(nf.format(woozi_g1Sum + woozi_g2Sum + woozi_g3Sum + woozi_g4Sum + woozi_g5Sum)); //woozi total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/4TdiASPlU3QdZvGQBothcQ?si=OkD5mhGTQCeyQMLnDyW5YQ"); //woozi monthly listener
        skipTwoLines();

        //artist: dokyeom

        //달의 몰락 / 인연 (2 tracks): 달의 몰락 (금 나와라 뚝딱 아기도깨비), 인연 (금 나와라 뚝딱 아기도깨비)
        String[] dk_g1 = {"https://open.spotify.com/track/1aXSHBuFmpAtmdvOn5uu1T?si=3257a8d4b8bc4254", "https://open.spotify.com/track/4TlvThZjOgBvswhK3Un7Qs?si=83d620b142274ee7"};
        //missed connections (2 tracks): missed connections, missed connections (inst.)
        String[] dk_g2 = {"https://open.spotify.com/track/4jAh51yhz3LUtbm1p7vOfY?si=3dff81f249ec4341", "https://open.spotify.com/track/11MmuNZlo9KSmMniQPGXGl?si=5fa6fb7ea70440e4"};
        //cinematic love (1 track): cinematic love
        String[] dk_g3 = {"https://open.spotify.com/track/3rB5fYZr3nSD2tBAvfYPb2?si=68bb1e0e20ce474b"};
        //go! (2 tracks): go!, go! (inst.)
        String[] dk_g4 = {"https://open.spotify.com/track/4hzeoIOERTL4jdTXAQ0FWr?si=5a5f8018adb64572", "https://open.spotify.com/track/5Qna4lljRXUSkYDAcHQcR5?si=01de8a60ad704f65"};
        //die schatten werden laenger (1 track): die schatten werden laenger
        String[] dk_g5 = {"https://open.spotify.com/track/7cpl3k7BKvYYq3vYcYf946?si=34d3b7539a724ca6"};
        //short hair (2 tracks): short hair, short hair - inst.
        String[] dk_g6 = {"https://open.spotify.com/track/4JCHRuXg9IRWBXtXtjgWxd?si=f3457b2cbef7452f", "https://open.spotify.com/track/7BErfsfMu9wUd13j7NT0oL?si=cbbca9f2135c475d"};
        //it's you (2 tracks): it's you, it's you - instrumental
        String[] dk_g7 = {"https://open.spotify.com/track/2XtNYB72kf5QEhYDdPZdc7?si=08843251d9344db9", "https://open.spotify.com/track/5p9PbCdXSqeqgn9jTQGWA5?si=88035cd0503c439f"};
        //never losing (2 tracks): never losing, never losing - inst.
        String[] dk_g8 = {"https://open.spotify.com/track/3b0Bxz2ZxN8aYUAnNCnXqT?si=c9d5555be8154a88", "https://open.spotify.com/track/13cY5VPi1l0myceVdxouaa?si=ae5e2585f5224297"};
        //best scene (2 tracks): best scene, best scene (instrumental)
        String[] dk_g9 = {"https://open.spotify.com/track/4pvUtXwvtZx0kl7vlv8gf9?si=c33c7428625349d8", "https://open.spotify.com/track/76ZxYJHOCJxvMEDUirZKv7?si=2097cc3b86264257"};
        //stay with me (2 tracks): stay with me, stay with me (inst.)
        String[] dk_g10 = {"https://open.spotify.com/track/21xVKf7NUrDgdTYOUzccLb?si=751f2cdf656c42e7", "https://open.spotify.com/track/6Qz7Fg8192Poj0yfb8A4JE?si=fb7585e907dc42e5"};

        long dk_g1Sum = getGroupTotal(driver, dk_g1);
        System.out.println(nf.format(dk_g1Sum)); //total for 달의 몰락 / 인연
        long dk_g2Sum = getGroupTotal(driver, dk_g2);
        System.out.println(nf.format(dk_g2Sum)); //missed connections total
        long dk_g3Sum = getGroupTotal(driver, dk_g3);
        System.out.println(nf.format(dk_g3Sum)); //cinematic love total
        long dk_g4Sum = getGroupTotal(driver, dk_g4);
        System.out.println(nf.format(dk_g4Sum)); //go! total
        long dk_g5Sum = getGroupTotal(driver, dk_g5);
        System.out.println(nf.format(dk_g5Sum)); //die schatten werden laenger total
        long dk_g6Sum = getGroupTotal(driver, dk_g6);
        System.out.println(nf.format(dk_g6Sum)); //short hair total
        long dk_g7Sum = getGroupTotal(driver, dk_g7);
        System.out.println(nf.format(dk_g7Sum)); //it's you total
        long dk_g8Sum = getGroupTotal(driver, dk_g8);
        System.out.println(nf.format(dk_g8Sum)); //never losing total
        long dk_g9Sum = getGroupTotal(driver, dk_g9);
        System.out.println(nf.format(dk_g9Sum)); //best scene total
        long dk_g10Sum = getGroupTotal(driver, dk_g10);
        System.out.println(nf.format(dk_g10Sum)); //stay with me total

        System.out.println(nf.format(dk_g1Sum + dk_g2Sum + dk_g3Sum + dk_g4Sum + dk_g5Sum + dk_g6Sum + dk_g7Sum + dk_g8Sum + dk_g9Sum + dk_g10Sum)); //dokyeom total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/7G1kUsPtQCdolV6CPwHmh2?si=8GeYahuDR46akby8J--OGg"); //dokyeom monthly listener
        skipTwoLines();

        //artist: mingyu

        //bittersweet (1 track): bittersweet (feat. leehi)
        String[] mingyu_g1 = {"https://open.spotify.com/track/347PJwH4XqRbeaKaIW9sX3?si=2b088e814a9d49c0 "};

        long mingyu_g1Sum = getGroupTotal(driver, mingyu_g1);
        System.out.println(nf.format(mingyu_g1Sum)); //bittersweet total

        System.out.println(nf.format(mingyu_g1Sum)); //mingyu total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/5gUpo0BRmo6EOTbyU3z5Ay?si=27R_xpfcTimOZ42L3BhBXQ "); //mingyu monthly listener
        skipTwoLines();

        //artist: the8

        //maze (1 track): maze
        String[] the8_g1 = {"https://open.spotify.com/track/6lWicdbY0xMkeLxYeswFxL?si=db5f1e82795a41db"};
        //side by side (2 tracks): side by side (chinese version), side by side (korean version)
        String[] the8_g2 = {"https://open.spotify.com/track/2Y6E1VaruSbPTNLTvyRKdF?si=a4a06fb2f7c440e2", "https://open.spotify.com/track/4FXKLGkXw4v5Kw3pEWCTYV?si=443928193d2a4f7a"};
        //藏 (2 tracks): 藏 (影视剧《谁是凶手》推广曲), 藏 (影视剧《谁是凶手》推广曲) [和声伴奏版]
        String[] the8_g3 = {"https://open.spotify.com/track/13hGqGFyC0PSVJhzir7Vcj?si=8e599de35c24474e", "https://open.spotify.com/track/5vx4AWcMBMEEyvLxbefZ79?si=3ba59fb2e6b146b3"};
        //hai cheng (1 track): hai cheng
        String[] the8_g4 = {"https://open.spotify.com/track/3kBfE92drjZEgYffx22zbl?si=51ea4ffea1e9444e"};
        //尝一口夏天 (3 tracks): 尝一口夏天, 尝一口夏天-件类, 会一山夏天- 和声伴奏
        String[] the8_g5 = {"https://open.spotify.com/track/2bSxLQkTVPmJHNgm0q35nl?si=f4de4a92d7214f3b", "https://open.spotify.com/track/69rednReVMNsLC6dNbpdVw?si=94115c08886b4ab8", "https://open.spotify.com/track/1ZV80AOcLQrBSsKDisDjNR?si=74ac740162d14516"};
        //fly! birdy friends (3 tracks): fly! birdy friends - korean version, fly! birdy friends - chinese version, fly! birdy friends - instrumental
        String[] the8_g6 = {"https://open.spotify.com/track/5NAza02m7G3hPAaz3EWry8?si=29ca21c173ca42f6", "https://open.spotify.com/track/5sVj7d0R7o1bubCFHgKk2G?si=e9b231207c1e437e", "https://open.spotify.com/track/5r6f2p9evm7f54RP63tAsR?si=91906259c76443f1"};
        //风吹来的时候 (2 tracks): 风吹来的时候 (电视剧《巴海重明》悸动曲), 风吹来的时候（电视剧《四海重明》悸动曲） - 人声伴奏版
        String[] the8_g7 = {"https://open.spotify.com/track/2qA2YPrXWbHlMuI6aVo1Bj?si=f84da27734504a5b", "https://open.spotify.com/track/4UGbzfz3623WOuypoGoTw8?si=372b9452fb1c48ca"};
        //stardust 1st ep china (3 tracks): 54321 (lift off) (feat. vernon), orbit, cold love
        String[] the8_g8 = {"https://open.spotify.com/track/1PFP2Zrgg9P8OHNifYEuEK?si=f94daaff7b85488f", "https://open.spotify.com/track/6P22aoxidK8c7r3dRc8YQv?si=c9025874f1b4482f", "https://open.spotify.com/track/60CbzqNbxBx7uRanCFiVxx?si=d7fd09c575484644"};
        //star crossing night (1 track): star crossing night
        String[] the8_g9 = {"https://open.spotify.com/track/2qCiLobSDsNsxlNW3GJZ7W?si=93baa68cc5ef4907"};
        //april drift (1 track): april drift
        String[] the8_g10 = {"https://open.spotify.com/track/3vhA8aHNutDpXhLpZAg6CH?si=e8ac5bdc4d254b39"};
        //love is gone (1 track): love is gone
        String[] the8_g11 = {"https://open.spotify.com/track/6kkFC7qnkFNpd6zv31mVdU?si=3cd78d784910453b"};
        //v8 (7 track): friends, beat, singasong, coloring, girlsnboys, 8dm, rat race
        String[] the8_g12 = {"https://open.spotify.com/track/3Zha4O3O4pPyO332FhsgUD", "https://open.spotify.com/track/5a6eOHprTOEtOCvgYYJ11c", "https://open.spotify.com/track/1uDVTuH0e2XaMPsX3yox1T", "https://open.spotify.com/track/1R0kXShLtjjIkZoET8vdb1", "https://open.spotify.com/track/0Jnh3156FyIz7SHWgKHRmp", "https://open.spotify.com/track/7qNXDUu4dkeOm67eF35qiL", "https://open.spotify.com/track/3cHzq4HX4ijdisuJ0a8SEj"};

        long the8_g1Sum = getGroupTotal(driver, the8_g1);
        System.out.println(nf.format(the8_g1Sum)); //maze total
        long the8_g2Sum = getGroupTotal(driver, the8_g2);
        System.out.println(nf.format(the8_g2Sum)); //side by side total
        long the8_g3Sum = getGroupTotal(driver, the8_g3);
        System.out.println(nf.format(the8_g3Sum)); //藏 total
        long the8_g4Sum = getGroupTotal(driver, the8_g4);
        System.out.println(nf.format(the8_g4Sum)); //hai cheng total
        long the8_g5Sum = getGroupTotal(driver, the8_g5);
        System.out.println(nf.format(the8_g5Sum)); //尝一口夏天 total
        long the8_g6Sum = getGroupTotal(driver, the8_g6);
        System.out.println(nf.format(the8_g6Sum)); //fly! birdy friends total
        long the8_g7Sum = getGroupTotal(driver, the8_g7);
        System.out.println(nf.format(the8_g7Sum)); //风吹来的时候 total
        long the8_g8Sum = getGroupTotal(driver, the8_g8);
        System.out.println(nf.format(the8_g8Sum)); //1st ep china - stardust total
        long the8_g9Sum = getGroupTotal(driver, the8_g9);
        System.out.println(nf.format(the8_g9Sum)); //star crossing night total
        long the8_g10Sum = getGroupTotal(driver, the8_g10);
        System.out.println(nf.format(the8_g10Sum)); //april drift total
        long the8_g11Sum = getGroupTotal(driver, the8_g11);
        System.out.println(nf.format(the8_g11Sum)); //love is gone total
        long the8_g12Sum = getGroupTotal(driver, the8_g12);
        System.out.println(nf.format(the8_g12Sum)); //v8 total

        System.out.println(nf.format(the8_g1Sum + the8_g2Sum + the8_g3Sum + the8_g4Sum + the8_g5Sum + the8_g6Sum + the8_g7Sum + the8_g8Sum + the8_g9Sum + the8_g10Sum + the8_g11Sum + the8_g12Sum)); //the8 total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/4DqFd6XE3dX4LWXHJVVpLk?si=n8rfroOJSIWSVMMQA_Lo0Q"); //the8 monthly listener
        skipTwoLines();

        //artist: seungkwan

        //sorry (lumberjack) (1 track): sorry (lumberjack)
        String[] sk_g1 = {"https://open.spotify.com/track/25iqfryJdCYQazGeePgoIN?si=5fec6f7591f54117 "};
        //kind of love (2 tracks): kind of love, kind of love - instrumental
        String[] sk_g2 = {"https://open.spotify.com/track/5SqEWwdYt55W8Tz7j8WtwQ?si=469ab764e4294b98", "https://open.spotify.com/track/1rnnc85HFGnJj7ky4hZrja?si=bd6686ce23864c5b"};
        //go (2 tracks): go, go - instrumental
        String[] sk_g3 = {"https://open.spotify.com/track/51W0tWQB56AvnLhIauJuSc?si=dd1c66311cc0417d", "https://open.spotify.com/track/5RcdGr06UALeho84O30JTc?si=b993fd912e624c7b"};
        //the reason (2 tracks): the reason, the reason - inst.
        String[] sk_g4 = {"https://open.spotify.com/track/2q2M0JapDnsgIS0qtgMoZG?si=edb3f1d05d754242", "https://open.spotify.com/track/07vYOaWMxVZXh1qTjs10I7?si=a0aeda4acfc34457"};
        //pit a pat (2 tracks): pit a pat, pit a pat - inst.
        String[] sk_g5 = {"https://open.spotify.com/track/5bmr4XB9X2QQPpnrY6PwwZ?si=608066927754474f", "https://open.spotify.com/track/1SfK92mBfNFcedtVnEyLmF?si=70b195a9dcb94f71"};
        //as it was (1 track): as it was
        String[] sk_g6 = {"https://open.spotify.com/track/1lUNlmwyhsJy6kXmmrO11t?si=d29184fb33564e70"};
        //still you (2 tracks): still you, still you (inst.)
        String[] sk_g7 = {"https://open.spotify.com/track/6pKyakfga6xnwP7xgQr5vo?si=55ee877bd8cd44c3", "https://open.spotify.com/track/6T9pGYi0IozXdw3pFAIOtP?si=70b9aee748f54dfa"};
        //the moment you arrive (2 tracks): the moment you arrive, the moment you arrive - instrumental
        String[] sk_g8 = {"https://open.spotify.com/track/74jC2OHiPnRCCCSdBGXHVo?si=2853758fc92f43ee", "https://open.spotify.com/track/2D4HVYoP9wTcl6PDp3rKOv?si=4fbe709376ac40f8"};
        //dandelion (1 track): dandelion
        String[] sk_g9 = {"https://open.spotify.com/track/6Gxl4O8CQIHsYPlCMnimG7?si=69e0d83169e04103"};
        //lonely stars (3 tracks): lonely stars (korean ver.), lonely stars (english ver.), lonely stars (japanese ver.)
        String[] sk_g10 = {"https://open.spotify.com/track/5EIMmyT519rdZzdeSGEj0m?si=04b001600f6042b1", "https://open.spotify.com/track/2B5UI74yd7FpWv6A5zqmQd?si=87e837432b3843ce", "https://open.spotify.com/track/4AwbPqatpbXscfxZfBqj7j?si=ee87d374b02e4d4e"};
        //somewhere in this universe (2 tracks): somewhere in this universe, somewhere in this universe (inst.)
        String[] sk_g11 = {"https://open.spotify.com/track/4oAp3etVXydrLaVBcXHvDZ?si=a64d86b74304454e", "https://open.spotify.com/track/0NEXpWus0oFDefTzmUNH7b?si=8abd8bbb5f9e4741"};
        //like spring (1 track): like spring
        String[] sk_g12 = {"https://open.spotify.com/track/67YLguFMT7wbJl2dSXeNGE?si=968f19a5521f47de"};

        long sk_g1Sum = getGroupTotal(driver, sk_g1);
        System.out.println(nf.format(sk_g1Sum)); //sorry (lumberjack) total
        long sk_g2Sum = getGroupTotal(driver, sk_g2);
        System.out.println(nf.format(sk_g2Sum)); //kind of love total
        long sk_g3Sum = getGroupTotal(driver, sk_g3);
        System.out.println(nf.format(sk_g3Sum)); //go total
        long sk_g4Sum = getGroupTotal(driver, sk_g4);
        System.out.println(nf.format(sk_g4Sum)); //the reason total
        long sk_g5Sum = getGroupTotal(driver, sk_g5);
        System.out.println(nf.format(sk_g5Sum)); //pit a pat love total
        long sk_g6Sum = getGroupTotal(driver, sk_g6);
        System.out.println(nf.format(sk_g6Sum)); //as it was - spotify singles total
        long sk_g7Sum = getGroupTotal(driver, sk_g7);
        System.out.println(nf.format(sk_g7Sum)); //still you total
        long sk_g8Sum = getGroupTotal(driver, sk_g8);
        System.out.println(nf.format(sk_g8Sum)); //the moment you arrive total
        long sk_g9Sum = getGroupTotal(driver, sk_g9);
        System.out.println(nf.format(sk_g9Sum)); //dandelion total
        long sk_g10Sum = getGroupTotal(driver, sk_g10);
        System.out.println(nf.format(sk_g10Sum)); //lonely stars total
        long sk_g11Sum = getGroupTotal(driver, sk_g11);
        System.out.println(nf.format(sk_g11Sum)); //somewhere in this universe total
        long sk_g12Sum = getGroupTotal(driver, sk_g12);
        System.out.println(nf.format(sk_g12Sum)); //like spring total

        System.out.println(nf.format(sk_g1Sum + sk_g2Sum + sk_g3Sum + sk_g4Sum + sk_g5Sum + sk_g6Sum + sk_g7Sum + sk_g8Sum + sk_g9Sum + sk_g10Sum + sk_g11Sum + sk_g12Sum)); //seungkwan total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/0Vb2DjojEYsasFpc3aTZb6?si=TdqsbAKUSPKC3BDck1n8Fw "); //seungkwan monthly listener
        skipTwoLines();

        //artist: vernon

        //lotto (1 track): lotto
        String[] vernon_g1 = {"https://open.spotify.com/track/1Jg92FCIcH6fcAl30QZfZi?si=cd0ffff39cce47c1"};
        //bucket list / i need you (2 tracks): bucket list, i need you
        String[] vernon_g1_older = {"https://open.spotify.com/track/5uflZOj1mUcIkgjNT3yrH3?si=5fc5a4fe8c0e4d40", "https://open.spotify.com/track/2lHFNxA0W3rUg3C9vZXVey?si=f8f892c822bc47b8"};
        //sickness (1 track): sickness
        String[] vernon_g2 = {"https://open.spotify.com/track/1xy1i731FugTcS1e9RFX1d?si=43271890861f423c"};
        //bumaye - remix (1 track): bumaye - remix
        String[] vernon_g2_remix = {"https://open.spotify.com/track/66OyXBzznixSkifQMx2AW3?si=989f73f17c5f4283"};
        //looped up (1 track): looped up
        String[] vernon_g3 = {"https://open.spotify.com/track/5InZzHAvyMPSMEXT4AeDQ3?si=28038b89125e4064"};
        //beg for you (1 track): beg for you
        String[] vernon_g4 = {"https://open.spotify.com/track/3teT4GffWtZUYQVmUwL14d?si=f2df0bc3b94b424c"};
        //wrecker (1 track): wrecker
        String[] vernon_g5 = {"https://open.spotify.com/track/3vn5FDDhTZaFbGpm9Xixio?si=531582f66f064547"};
        //black eye (1 track): black eye
        String[] vernon_g6 = {"https://open.spotify.com/track/0aW2wxU16UTuwohjldJ5v0?si=0efb09136c3a48f6"};
        //miss you (1 track): miss you
        String[] vernon_g7 = {"https://open.spotify.com/track/6MrNcToqeejjpYcstmKBHi?si=d786900fedc544b8"};
        //54321 (lift off) (1 track): 54321 (lift off) (feat. vernon)
        String[] vernon_g8 = {"https://open.spotify.com/track/1PFP2Zrgg9P8OHNifYEuEK?si=f8f95ae6df2d4db2"};
        //v8 (7 track): friends, beat, singasong, mia, coloring, girlsnboys, rat race
        String[] vernon_g9 = {"https://open.spotify.com/track/3Zha4O3O4pPyO332FhsgUD", "https://open.spotify.com/track/5a6eOHprTOEtOCvgYYJ11c", "https://open.spotify.com/track/1uDVTuH0e2XaMPsX3yox1T", "https://open.spotify.com/track/42m5wYT5EOnP1UoDF2pCxh", "https://open.spotify.com/track/1R0kXShLtjjIkZoET8vdb1", "https://open.spotify.com/track/0Jnh3156FyIz7SHWgKHRmp", "https://open.spotify.com/track/3cHzq4HX4ijdisuJ0a8SEj"};
        //i'll be back (1 track): i'll be back
        String[] vernon_g10 = {"https://open.spotify.com/track/1hs4eGCcvX3wz5Z6nNqcxl?si=d61a3d6d58ff4874"};

        long vernon_g1Sum = getGroupTotal(driver, vernon_g1);
        System.out.println(nf.format(vernon_g1Sum)); //lotto total

        long vernon_g1OlderSum = getGroupTotal(driver, vernon_g1_older);
        System.out.println(nf.format(vernon_g1OlderSum)); //bucket list / i need you total

        long vernon_g2Sum = getGroupTotal(driver, vernon_g2);
        System.out.println(nf.format(vernon_g2Sum)); //sickness total

        long vernon_g2RemixSum = getGroupTotal(driver, vernon_g2_remix);
        System.out.println(nf.format(vernon_g2RemixSum)); //bumaye - remix duplication total

        long vernon_g3Sum = getGroupTotal(driver, vernon_g3);
        System.out.println(nf.format(vernon_g3Sum)); //looped up total
        long vernon_g4Sum = getGroupTotal(driver, vernon_g4);
        System.out.println(nf.format(vernon_g4Sum)); //beg for you total
        long vernon_g5Sum = getGroupTotal(driver, vernon_g5);
        System.out.println(nf.format(vernon_g5Sum)); //wrecker total
        long vernon_g6Sum = getGroupTotal(driver, vernon_g6);
        System.out.println(nf.format(vernon_g6Sum)); //black eye total
        long vernon_g7Sum = getGroupTotal(driver, vernon_g7);
        System.out.println(nf.format(vernon_g7Sum)); //miss you total
        long vernon_g8Sum = getGroupTotal(driver, vernon_g8);
        System.out.println(nf.format(vernon_g8Sum)); //54321 (lift off) (feat. vernon) total
        long vernon_g9Sum = getGroupTotal(driver, vernon_g9);
        System.out.println(nf.format(vernon_g9Sum)); //v8 total
        long vernon_g10Sum = getGroupTotal(driver, vernon_g10);
        System.out.println(nf.format(vernon_g10Sum)); //i'll be back total

        System.out.println(nf.format(vernon_g1Sum + vernon_g1OlderSum + vernon_g2Sum + vernon_g2RemixSum + vernon_g2RemixSum + vernon_g3Sum + vernon_g4Sum + vernon_g5Sum + vernon_g6Sum + vernon_g7Sum + vernon_g8Sum + vernon_g9Sum + vernon_g10Sum)); //vernon total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/2Y34b9AOK30zXgL7cAH4NG?si=aLwp3UUWQ_6Ft15X3Q79Fw"); //vernon monthly listener
        skipTwoLines();

        //artist: dino

        //icarus (2 tracks): icarus, icarus (inst.)
        String[] dino_g1 = {"https://open.spotify.com/track/6F3JheiZtQnzGfjbAocreQ?si=2f8bf7dbefc64ca1", "https://open.spotify.com/track/47DASVFyegev3sT21EbV9c?si=c70ab593dde04f87"};
        //wait (1 track): wait
        String[] dino_g2 = {"https://open.spotify.com/track/1KkC3Nzxv3OZorm5m1843p?si=7f1de8ab241e4aa1"};
        //beyond the dream (2 tracks): beyond the dream, beyond the dream (instrumental)
        String[] dino_g3 = {"https://open.spotify.com/track/7i6UHwUwuNvH63uQMBpXvr?si=b8fe7a75cd354179", "https://open.spotify.com/track/6PzNZQN9zhIKvbNbbY5Fis?si=fd143329ed7f4049"};
        //board(gilboard) (2 tracks): zzan, like it
        String[] dino_g4 = {"https://open.spotify.com/track/6lfWCCeGpsldAQi8JxKwpg?si=7a53811521b3487d", "https://open.spotify.com/track/5MZktJvCYmskdeY1PwuxL4?si=ec56582df5c74654"};
        //automatic (1 track): automatic
        String[] dino_g5 = {"https://open.spotify.com/track/1juuiRXGTR6SFQFv7vVCRL"};

        long dino_g1Sum = getGroupTotal(driver, dino_g1);
        System.out.println(nf.format(dino_g1Sum)); //icarus total
        long dino_g2Sum = getGroupTotal(driver, dino_g2);
        System.out.println(nf.format(dino_g2Sum)); //wait total
        long dino_g3Sum = getGroupTotal(driver, dino_g3);
        System.out.println(nf.format(dino_g3Sum)); //beyond the dream total
        long dino_g4Sum = getGroupTotal(driver, dino_g4);
        System.out.println(nf.format(dino_g4Sum)); //board(gilboard) total
        long dino_g5Sum = getGroupTotal(driver, dino_g5);
        System.out.println(nf.format(dino_g5Sum)); //automatic total

        System.out.println(nf.format(dino_g1Sum + dino_g2Sum + dino_g3Sum + dino_g4Sum + dino_g5Sum)); //dino total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/5YaeXxzvqGNBCguELlKo6G?si=SCV7vSDHScC-6qj67R061Q"); //dino monthly listener / followers
        skipTwoLines();

        //artist: bss

        //just do it (1 track): just do it
        String[] bss_g1 = {"https://open.spotify.com/track/57ITlzpnOMkSE6oHGbvTqi?si=8619bac475de4f7c"};
        //second wind album (3 tracks): fighting, lunch, 7pm
        String[] bss_g2 = {"https://open.spotify.com/track/7eBpUuPnDTfbeP1P4P93CS?si=c2cf06fc670b4306", "https://open.spotify.com/track/0MMIrw3mCssQj4uqJlBzdp?si=0c9d0eb6ea044ccb", "https://open.spotify.com/track/6tAPw1Rtt3SGEOm6ohYi8l?si=2b4bda5069f9417f"};
        //the reasons of my smiles (2 tracks): the reasons of my smiles, the reasons of my smiles - inst.
        String[] bss_g3 = {"https://open.spotify.com/track/1amowbJ9HHFFSFdg2ubM7G?si=eeac537612c54003", "https://open.spotify.com/track/4QSkY17gPTuGfb7RZFTGXD?si=26af64557a744b99"};
        //teleparty album (3 tracks): cbz (prime time), happy alone, love song
        String[] bss_g4 = {"https://open.spotify.com/track/0ofqcEBPdlyczRjUhjCiIS?si=8dd38aae11354ab9", "https://open.spotify.com/track/5WzKTday2lCOKk4HjjyFZt?si=be285b38b9ff487f", "https://open.spotify.com/track/0jwreQKzqgsEKtp46d2Ita?si=b2cd2b013a344fbb"};
        //good day 2025 (1 track): good day 2025 (telepathy + by the moonlight window)
        String[] bss_g5 = {"https://open.spotify.com/track/4SinziOMDPR58wWHakWP9v?si=f5ea4b831d624707"};

        long bss_g1Sum = getGroupTotal(driver, bss_g1);
        System.out.println(nf.format(bss_g1Sum)); //just do it total
        long bss_g2Sum = getGroupTotal(driver, bss_g2);
        System.out.println(nf.format(bss_g2Sum)); //1st single album - second wind total
        long bss_g3Sum = getGroupTotal(driver, bss_g3);
        System.out.println(nf.format(bss_g3Sum)); //the reasons of my smiles total
        long bss_g4Sum = getGroupTotal(driver, bss_g4);
        System.out.println(nf.format(bss_g4Sum)); //2nd single album - teleparty total
        long bss_g5Sum = getGroupTotal(driver, bss_g5);
        System.out.println(nf.format(bss_g5Sum)); //good day 2025 (telepathy + by the moonlight window) total

        System.out.println(nf.format(bss_g1Sum + bss_g2Sum + bss_g3Sum + bss_g4Sum + bss_g5Sum)); //bss total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/1uAT5bTSp6dWbNmixIUP5t?si=YTfiD7WMS969JVQo5sD55w"); //bss monthly listener
        skipTwoLines();

        //artist: jxw

        //this man album (3 tracks): last night, beautiful monster, leftover
        String[] jxw_g1 = {"https://open.spotify.com/track/0Qh8dlEJ3jVWk57Ql6XrdS?si=f9711774c3bf464f", "https://open.spotify.com/track/3Sd2E80Y6WGk82qrHoq7pa?si=60082104ef9f4d26", "https://open.spotify.com/track/1zHPzyKOs6AsnJcnWSjZhO?si=67e89dbfb5134651"};

        long jxw_g1Sum = getGroupTotal(driver, jxw_g1);
        System.out.println(nf.format(jxw_g1Sum)); //1st single album - this man total

        System.out.println(nf.format(jxw_g1Sum)); //jxw total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/7GvlsjcgBrsE578yghOq7D?si=FVv_bzarTsmJ4BDiard2Lg"); //jxw monthly listener
        skipTwoLines();

        //artist: hxw

        //beam album (3 tracks): pinocchio, 96ers, stupid idiot
        String[] hxw_g1 = {"https://open.spotify.com/track/29GCuNZT4ihntQllYTPXQf?si=ca8a0c5b07ea460b", "https://open.spotify.com/track/6AvxOYstG9cCD4RVQp4aJz?si=05c0dcf49b32433c", "https://open.spotify.com/track/298BoO0FqEs3hfwO4K86fI?si=badac6127afb463b"};
        //echo! (1 track): echo!
        String[] hxw_g2 = {"https://open.spotify.com/track/2ZmjUVTEA6UjJmqyiRGBBd?si=073e7f438d4f456b"};

        long hxw_g1Sum = getGroupTotal(driver, hxw_g1);
        System.out.println(nf.format(hxw_g1Sum)); //1st single album - beam total
        long hxw_g2Sum = getGroupTotal(driver, hxw_g2);
        System.out.println(nf.format(hxw_g2Sum)); //echo! total

        System.out.println(nf.format(hxw_g1Sum + hxw_g2Sum)); //hxw total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/1EReYiseDwE51FzGm7EK9n?si=0I1CYjXXR7SBgJai42Sn1g"); //hxw monthly listener
        skipTwoLines();

        //artist: cxm

        //hype vibes album (6 tracks): fiesta, 5,4,3 (pretty woman) (feat. lay bankz), worth it, for you, young again, earth
        String[] cxm_g1 = {"https://open.spotify.com/track/0ANyGUmVsiCjLQWhAuCl9Q?si=35d6cc12b6544f7b", "https://open.spotify.com/track/4eTDkRxOmm4llv4Yr1bteq?si=cef82bc334884f80", "https://open.spotify.com/track/04f4d0aG5ckrLifRzlv93z?si=b0d5e1b9484e4b62", "https://open.spotify.com/track/4Nwv6KF2jayQih4H2B7psX?si=b8178badc543476f", "https://open.spotify.com/track/7g7k7CezQFUEsPjVbNv7X8?si=978ddd83e7184dba", "https://open.spotify.com/track/7rutYN9WlI8WXrV6rHySEB?si=edcbc1a1799044ae"};
        //5,4,3 (pretty woman) remix (1 track): 5,4,3 (pretty woman) (feat. flo milli)
        String[] cxm_g2 = {"https://open.spotify.com/track/5mhfitGY8xcWNbqVVpwk8o?si=b37b5fe7e31d4963"};

        long cxm_g1Sum = getGroupTotal(driver, cxm_g1);
        System.out.println(nf.format(cxm_g1Sum)); //1st mini album - hype vibes album total
        long cxm_g2Sum = getGroupTotal(driver, cxm_g2);
        System.out.println(nf.format(cxm_g2Sum)); //5,4,3 (pretty woman) (feat. flo milli) total

        System.out.println(nf.format(cxm_g1Sum + cxm_g2Sum)); //cxm total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/7kjuLdYbtTkWBToMu2ebZN?si=7rP1Mv4OQyqv1ziIP-TdZw"); //cxm monthly listener
        skipTwoLines();

        //artist: dxs

        //serenade album (6 tracks): rockstar (dk solo), blue, guilty pleasure, silence, dream serenade (seungkwan solo), prelude of love
        String[] dxs_g1 = {"https://open.spotify.com/track/6pPy2mkcDeVu7SJaOGnCUv?si=6b717cd4427c4137", "https://open.spotify.com/track/7KOijaSUhe0dyiKNZLsl8X?si=7471b52457124cd6", "https://open.spotify.com/track/0heGUlCMT03UZmVRxABlX3?si=5921792db2744767", "https://open.spotify.com/track/1RwOJEuRRHBHlvbD9S7C1N?si=695b59955a4849a3", "https://open.spotify.com/track/21nI1v1Fps5ARtJvaRqaC8?si=de1bf5bed1c549b4", "https://open.spotify.com/track/1jstmwO12KospQ2e5tPXre?si=267c60df078a48f3"};
        //feel me (2 tracks): feel me, feel me - inst.
        String[] dxs_g2 = {"https://open.spotify.com/track/2psEOi0dDz19G9BljUiL2v?si=4d5249feb88b4250", "https://open.spotify.com/track/7N0ONXAgsGFk9Hm4Nf8LLE?si=2c660f1592bd4591"};
        //one (1 track): one
        String[] dxs_g3 = {"https://open.spotify.com/track/6xOoHI8ap5SFkDiBLb3ucf?si=0cdcb63356c54494"};

        long dxs_g1Sum = getGroupTotal(driver, dxs_g1);
        System.out.println(nf.format(dxs_g1Sum)); //1st mini album - serenade album total
        long dxs_g2Sum = getGroupTotal(driver, dxs_g2);
        System.out.println(nf.format(dxs_g2Sum)); //feel me total
        long dxs_g3Sum = getGroupTotal(driver, dxs_g3);
        System.out.println(nf.format(dxs_g3Sum)); //one total

        System.out.println(nf.format(dxs_g1Sum + dxs_g2Sum + dxs_g3Sum)); //dxs total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/4wBjmEkWhY4T22q00CiF5V?si=tCMmuH2JTvuqBnvhI-cMOg"); //dxs monthly listener
        skipTwoLines();

        //artist: v8

        //v8 (8 tracks): friends, beat, singasong, mia, coloring, girlsnboys, 8dm, rat race
        String[] v8 = {"https://open.spotify.com/track/3Zha4O3O4pPyO332FhsgUD", "https://open.spotify.com/track/5a6eOHprTOEtOCvgYYJ11c", "https://open.spotify.com/track/1uDVTuH0e2XaMPsX3yox1T", "https://open.spotify.com/track/42m5wYT5EOnP1UoDF2pCxh", "https://open.spotify.com/track/1R0kXShLtjjIkZoET8vdb1", "https://open.spotify.com/track/0Jnh3156FyIz7SHWgKHRmp", "https://open.spotify.com/track/7qNXDUu4dkeOm67eF35qiL", "https://open.spotify.com/track/3cHzq4HX4ijdisuJ0a8SEj"};

        long v8Sum = getGroupTotal(driver, v8);
        System.out.println(nf.format(v8Sum)); //v8 total streams (8 tracks)

        skipTwoLines();

        //artist: picheolin

        //love sick (1 track): love sick
        String[] picheolin_g1 = {"https://open.spotify.com/track/3Y0ZwgYVHuwbW0JGjsYodR?si=a5947d811f1b42da&nd=1&dlsi=4c5c98bc631f4cca"};
        //mi-cheo mi-cheo (1 track): mi-cheo mi-cheo
        String[] picheolin_g2 = {"https://open.spotify.com/track/594CTGIIVVTitwRhQJcWgM?si=48f1482414874053"};
        //gilboard (6 tracks): zzan, party rock rock, sincerely, mi-cheo mi-cheo, love sick, for jeong and love
        String[] picheolin_g3 = {"https://open.spotify.com/track/6lfWCCeGpsldAQi8JxKwpg?si=7a53811521b3487d", "https://open.spotify.com/track/5wsPiyVi6oIHY0RAz8Ay0G?si=b50ff39d1e6049b8", "https://open.spotify.com/track/3iyw6fYasTWIRSYfyNUDt4?si=09e4963316c14a90", "https://open.spotify.com/track/34wTGQ1yV5XtrSMR5dMLWY?si=96b3eca9a35e4ad8", "https://open.spotify.com/track/5W1bn5PzFgKok4GAZ1JUAw?si=964392f17e4346b8", "https://open.spotify.com/track/0zszdbIntzvgxPSe9U0QcT?si=a655ea2fdf9e4f57"};

        long picheolin_g1Sum = getGroupTotal(driver, picheolin_g1);
        System.out.println(nf.format(picheolin_g1Sum)); //love sick total
        long picheolin_g2Sum = getGroupTotal(driver, picheolin_g2);
        System.out.println(nf.format(picheolin_g2Sum)); //mi-cheo mi-cheo total
        long picheolin_g3Sum = getGroupTotal(driver, picheolin_g3);
        System.out.println(nf.format(picheolin_g3Sum)); //gilboard total
        System.out.println(nf.format(picheolin_g3Sum)); //picheolin total streams
        printMonthlyListeners(driver, "https://open.spotify.com/artist/3V2EC4dPYLgtbi0TtrB1RA?si=Z8U-zPWQQoSUQyJaYuE74Q"); //picheolin monthly listener
        skipTwoLines();

        //artist: gilboard

        //gilboard (7 tracks): zzan, party rock rock, sincerely, mi-cheo mi-cheo, love sick, for jeong and love, like it
        String[] gilboard = {"https://open.spotify.com/track/6lfWCCeGpsldAQi8JxKwpg?si=7a53811521b3487d", "https://open.spotify.com/track/5wsPiyVi6oIHY0RAz8Ay0G?si=b50ff39d1e6049b8", "https://open.spotify.com/track/3iyw6fYasTWIRSYfyNUDt4?si=09e4963316c14a90", "https://open.spotify.com/track/34wTGQ1yV5XtrSMR5dMLWY?si=96b3eca9a35e4ad8", "https://open.spotify.com/track/5W1bn5PzFgKok4GAZ1JUAw?si=964392f17e4346b8", "https://open.spotify.com/track/0zszdbIntzvgxPSe9U0QcT?si=a655ea2fdf9e4f57", "https://open.spotify.com/track/5MZktJvCYmskdeY1PwuxL4?si=ec56582df5c74654"};

        long gilboardSum = getGroupTotal(driver, gilboard);
        System.out.println(nf.format(gilboardSum)); //gilboard total streams (7 tracks)
        skipTwoLines();

        //shared tracks (7 tracks): like you, 12 o'clock, outside, one plus one, not personal, coloring, no looking back
        String[] sharedTracks = {"https://open.spotify.com/track/5ZMx7DaPnVisUBLcrFcnCl", "https://open.spotify.com/track/1dp1GI9YcKDoxrKBpp0u9F", "https://open.spotify.com/track/4XBeSUSswrGhqYrwm3IS7A", "https://open.spotify.com/track/1bGAA82A31CWflD6bqY5g6", "https://open.spotify.com/track/2SWWDlOjKqgVvocnIfxId9", "https://open.spotify.com/track/69umJ9yk5uay7PQmhBOKk8", "https://open.spotify.com/track/2lDG4sMZwAC2TTlXNHMgA1"};
        long sharedTracksSum = getGroupTotal(driver, sharedTracks);
        System.out.println(nf.format(sharedTracksSum)); //shared tracks total streams (7 tracks)

        skipTwoLines();

        driver.quit();
    }

    private static void printMonthlyListeners(WebDriver driver, String listenerUrl) {
        if (System.getenv("SVT_ONLY_TRACKS") != null) return;
        try {
            driver.get(listenerUrl);
            Thread.sleep(4000 + (int) (Math.random() * 4000));
            long listenersCount = getMonthlyListenersCount(driver);
            System.out.println(nf.format(listenersCount));
        } catch (Exception e) {
            System.out.println("0");
        }
        // A retry of missing SONGS must not rescan 18 artist pages.
        if (System.getenv("SVT_ONLY_TRACKS") == null) {
            fetchExactArtistFollowers(driver, listenerUrl);
        }
    }

    /**
     * Exact artist follower count, scoped to the opened About dialog.
     * Never convert abbreviated public-facing K/M numbers into invented totals.
     * V8 and JxJ have no individual Spotify artist profiles.
     */
    /** Read public artist statistics already delivered to the browser.
     * The response must identify the exact requested Spotify artist URI.
     */
    private static Long fetchExactNetworkFollowers(WebDriver browser, String artistId) {
        if (!(browser instanceof ChromeDriver)) return null;
        ChromeDriver driver = (ChromeDriver) browser;
        try {
            org.openqa.selenium.json.Json json = new org.openqa.selenium.json.Json();
            for (org.openqa.selenium.logging.LogEntry entry : driver.manage().logs().get("performance")) {
                try {
                    Map<?, ?> event = json.toType(entry.getMessage(), Map.class);
                    Map<?, ?> message = event.get("message") instanceof Map
                        ? (Map<?, ?>) event.get("message") : null;
                    if (message == null || !"Network.responseReceived".equals(message.get("method"))) continue;
                    Map<?, ?> params = message.get("params") instanceof Map
                        ? (Map<?, ?>) message.get("params") : null;
                    if (params == null) continue;
                    Map<?, ?> response = params.get("response") instanceof Map
                        ? (Map<?, ?>) params.get("response") : null;
                    if (response == null ||
                        !String.valueOf(response.get("url")).contains("api-partner.spotify.com/pathfinder")) continue;
                    Object req = params.get("requestId");
                    if (req == null) continue;
                    Map<String, Object> cdp = driver.executeCdpCommand(
                        "Network.getResponseBody", Map.of("requestId", String.valueOf(req)));
                    Object body = cdp.get("body");
                    if (!(body instanceof String)) continue;
                    String payload = (String) body;
                    if (Boolean.TRUE.equals(cdp.get("base64Encoded")))
                        payload = new String(java.util.Base64.getDecoder().decode(payload),
                            java.nio.charset.StandardCharsets.UTF_8);
                    Map<?, ?> document = json.toType(payload, Map.class);
                    if (document == null) continue;
                    Map<?, ?> data = document.get("data") instanceof Map
                        ? (Map<?, ?>) document.get("data") : null;
                    Map<?, ?> artist = data != null && data.get("artistUnion") instanceof Map
                        ? (Map<?, ?>) data.get("artistUnion") : null;
                    if (artist == null || !("spotify:artist:" + artistId).equals(artist.get("uri"))) continue;
                    Map<?, ?> stats = artist.get("stats") instanceof Map
                        ? (Map<?, ?>) artist.get("stats") : null;
                    Object followers = stats == null ? null : stats.get("followers");
                    if (!(followers instanceof Number)) continue;
                    long count = ((Number) followers).longValue();
                    if (count > 0 && count <= 1000000000L) return count;
                } catch (Exception ignored) {
                    // Some network response bodies are no longer retained by Chrome.
                }
            }
        } catch (Exception ignored) {
            // Network logging is optional; use the existing DOM fallback.
        }
        return null;
    }

    private static void fetchExactArtistFollowers(WebDriver driver, String artistUrl) {
        final String artistId;
        try {
            artistId = artistUrl.split("/artist/")[1].split("\\?")[0].trim();
        } catch (Exception e) {
            return;
        }
        try {
            Long networkCount = fetchExactNetworkFollowers(driver, artistId);
            if (networkCount != null) {
                System.out.println("STAT_FOLLOWERS|" + artistId + "|" + networkCount);
                System.out.println("STAT_FOLLOWERS_SOURCE|" + artistId + "|artist-page-network");
                return;
            }
            String artistName = "";
            List<WebElement> headings = driver.findElements(By.cssSelector("h1"));
            if (!headings.isEmpty()) artistName = headings.get(0).getText().trim();
            boolean aboutClicked = false;
            String clickMethod = "none";
            // Match OT13's successful exact artist-named button method first.
            // The img itself is the fallback for artist pages using clickable artwork.
            for (int attempt = 0; attempt < 10; attempt++) {
                if (!aboutClicked && !artistName.isBlank()) {
                    for (WebElement artistButton : driver.findElements(By.cssSelector("button[aria-label]"))) {
                        try {
                            if (!artistButton.isDisplayed()) continue;
                            if (!artistName.equalsIgnoreCase(artistButton.getAttribute("aria-label"))) continue;
                            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", artistButton);
                            aboutClicked = true;
                            clickMethod = "artist-named-button";
                            break;
                        } catch (Exception ignored) {}
                    }
                }
                // First inspect Spotify's exact visible Followers
                // structure independently of whether the UI uses a dialog.
                // It is a value sibling followed by a 'Followers' label.
                for (WebElement label : driver.findElements(By.xpath(
                        "//*[text()[normalize-space(.)='Followers']]"))) {
                    try {
                        if (!label.isDisplayed()) continue;
                        WebElement value = label.findElement(By.xpath("preceding-sibling::*[1]"));
                        String raw = value.getText().replace((char)160, ' ').trim();
                        if (!raw.matches("[0-9]{1,3}(?:[, ]+[0-9]{3})+|[0-9]{4,11}")) continue;
                        long count = Long.parseLong(raw.replaceAll("[^0-9]", ""));
                        if (count > 0 && count < 1000000000L) {
                            System.out.println("STAT_FOLLOWERS|" + artistId + "|" + count);
                            return;
                        }
                    } catch (Exception ignored) {}
                }
                // Spotify's profile artwork opens the artist About dialog.
                // Prefer the actual artist image (alt="JEONGHAN", etc.)
                // instead of relying on the old artist-named button.
                // After an inert click, try the About heading/control instead.
                if (!aboutClicked && attempt < 2) {
                    // The artist image may have a different alt spelling from
                    // the H1, so prefer matching alt, then the primary profile
                    // image in the artist header. Ignore album/track artwork.
                    List<WebElement> pictures = driver.findElements(By.cssSelector(
                        "img[alt][src*='ab676161'], img[alt][src*='scdn.co/image/']"));
                    WebElement chosen = null;
                    for (WebElement picture : pictures) {
                        try {
                            if (!picture.isDisplayed()) continue;
                            String alt = picture.getAttribute("alt");
                            if (alt != null && !artistName.isBlank() &&
                                alt.trim().equalsIgnoreCase(artistName)) { chosen = picture; break; }
                        } catch (Exception ignored) {}
                    }
                    if (chosen == null) {
                        for (WebElement picture : pictures) {
                            try {
                                if (!picture.isDisplayed()) continue;
                                String src = picture.getAttribute("src");
                                if (src != null && src.contains("ab676161")) {
                                    chosen = picture;
                                    break;
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                    if (chosen != null) {
                        try {
                            // Spotify listens on the image wrapper on many
                            // artist pages. Clicking the child image through
                            // JS can be a no-op. Prefer its actual interactive
                            // ancestor and a Selenium pointer click.
                            WebElement clickTarget = chosen;
                            try {
                                WebElement ancestor = chosen.findElement(By.xpath(
                                  "./ancestor::*[self::button or @role='button' or @tabindex='0'][1]"));
                                if (ancestor.isDisplayed()) clickTarget = ancestor;
                            } catch (Exception ignored) {}
                            ((JavascriptExecutor) driver).executeScript(
                                "arguments[0].scrollIntoView({block:'center'});", clickTarget);
                            try {
                                new org.openqa.selenium.interactions.Actions(driver)
                                   .moveToElement(clickTarget).pause(Duration.ofMillis(250))
                                   .click().perform();
                                clickMethod = clickTarget.equals(chosen)
                                   ? "artist-image-pointer" : "artist-image-wrapper-pointer";
                            } catch (Exception pointerError) {
                                ((JavascriptExecutor) driver).executeScript(
                                    "arguments[0].click();", clickTarget);
                                clickMethod = clickTarget.equals(chosen)
                                   ? "artist-image-js" : "artist-image-wrapper-js";
                            }
                            aboutClicked = true;
                        } catch (Exception ignored) {}
                    }
                }
                // Spotify has changed from an artist-named button to an
                // About control in some layouts. Try visible controls first.
                if (!aboutClicked) {
                List<WebElement> buttons = driver.findElements(By.cssSelector(
                    "button, [role='button'], a[href$='/about']"));
                for (WebElement button : buttons) {
                    try {
                        if (!button.isDisplayed()) continue;
                        String label = String.valueOf(button.getAttribute("aria-label"));
                        String title = String.valueOf(button.getAttribute("title"));
                        String visible = button.getText().trim();
                        String content = (label + " " + title + " " + visible).trim();
                        boolean matches = (!artistName.isBlank() &&
                            (visible.equalsIgnoreCase(artistName) || label.equalsIgnoreCase(artistName)))
                            || content.matches("(?is).*\\babout(?: the artist)?\\b.*");
                        if (!matches) continue;
                        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", button);
                        aboutClicked = true;
                        clickMethod = "visible-control";
                        break;
                    } catch (Exception ignored) {}
                }
                }
                if (!aboutClicked && !headings.isEmpty()) {
                    try {
                        WebElement heading = headings.get(0);
                        WebElement parent = heading.findElement(By.xpath(
                            "./ancestor::*[self::button or @role='button'][1]"));
                        if (parent.isDisplayed()) {
                            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", parent);
                            aboutClicked = true;
                            clickMethod = "artist-heading-parent";
                        }
                    } catch (Exception ignored) {}
                }
                // An ordinary 'About' heading is NOT an interactive control.
                // Do not record it as an opened popup: this was masking the
                // true missing-dialog failure for several artist profiles.
                if (aboutClicked) {
                    Thread.sleep(1300);
                } else {
                    Thread.sleep(1200);
                }
                // If the artwork was not interactive after all, don't keep
                // treating the first click as successful for every retry.
                // The next loop may try the alternate About controls.
                if (aboutClicked && clickMethod.startsWith("artist-image")) {
                    boolean dialogOpen = false;
                    for (WebElement box : driver.findElements(By.cssSelector(
                            "dialog[open], [role='dialog']"))) {
                        try { if (box.isDisplayed()) { dialogOpen = true; break; } }
                        catch (Exception ignored) {}
                    }
                    if (!dialogOpen && attempt >= 1) {
                        // Allow the other visible About buttons to be tried
                        // instead of clicking an inert profile image 10 times.
                        aboutClicked = false;
                    }
                }
                // Read the exact integer in the SAME compact Spotify
                // Followers container supplied by the current About markup:
                // <div><div>118,017</div><div>Followers</div></div>.
                // Only accept an unabridged number next to the Followers
                // label, never an unrelated number or a rounded K/M badge.
                for (WebElement label : driver.findElements(By.xpath(
                        "//*[normalize-space(text())='Followers']"))) {
                    try {
                        if (!label.isDisplayed()) continue;
                        // The value is the immediate preceding sibling of the label.
                        WebElement value = label.findElement(By.xpath("preceding-sibling::*[1]"));
                        if (!value.isDisplayed()) continue;
                        String raw = value.getText().replace((char)160, ' ').trim();
                        if (!raw.matches("[0-9]{1,3}(?:[, ]+[0-9]{3})+|[0-9]{4,11}")) continue;
                        long count = Long.parseLong(raw.replaceAll("[^0-9]", ""));
                        if (count < 1 || count > 1000000000L) continue;
                        System.out.println("STAT_FOLLOWERS|" + artistId + "|" + count);
                        return;
                    } catch (Exception ignored) {}
                }
                List<WebElement> dialogs = driver.findElements(By.cssSelector(
                    "dialog[open], [role='dialog']"));
                for (WebElement dialog : dialogs) {
                    if (!dialog.isDisplayed()) continue;
                    String content = dialog.getText().replace((char)160, ' ').trim();
                    Pattern before = Pattern.compile(
                        "([0-9]{1,3}(?:[, ]+[0-9]{3})+|[0-9]{4,11})\\s+followers?\\b",
                        Pattern.CASE_INSENSITIVE);
                    Pattern after = Pattern.compile(
                        "\\bfollowers?\\s+([0-9]{1,3}(?:[, ]+[0-9]{3})+|[0-9]{4,11})\\b",
                        Pattern.CASE_INSENSITIVE);
                    Matcher matcher = before.matcher(content);
                    if (!matcher.find()) {
                        matcher = after.matcher(content);
                        if (!matcher.find()) continue;
                    }
                    long count = Long.parseLong(matcher.group(1).replaceAll("[^0-9]", ""));
                    if (count >= 1000 && count <= 1000000000L) {
                        System.out.println("STAT_FOLLOWERS|" + artistId + "|" + count);
                        return;
                    }
                }
            }
            // Fallback for Spotify layouts that display the exact count in
            // the artist's page rather than opening an About dialog. Never
            // convert abbreviated labels such as 1.2M into invented numbers.
            String pageText = getBodyText(driver).replace((char)160, ' ');
            Matcher exactPageFollowers = Pattern.compile(
                "(?<![\\d.])([0-9]{1,3}(?:[, ]+[0-9]{3})+|[0-9]{4,11})\\s+followers?\\b",
                Pattern.CASE_INSENSITIVE).matcher(pageText);
            if (exactPageFollowers.find()) {
                long count = Long.parseLong(exactPageFollowers.group(1).replaceAll("[^0-9]", ""));
                if (count >= 1000 && count <= 1000000000L) {
                    System.out.println("STAT_FOLLOWERS|" + artistId + "|" + count);
                    return;
                }
            }
            // Diagnostic only: record page structure, never claim a shortened
            // K/M follower badge is an exact integer.
            int displayedDialogs = 0;
            for (WebElement dialog : driver.findElements(By.cssSelector("dialog[open], [role='dialog']"))) {
                if (dialog.isDisplayed()) displayedDialogs++;
            }
            final String artistLabel = artistName;
            long namedButtons = driver.findElements(By.cssSelector("button[aria-label]")).stream()
                .filter(button -> {
                    try { return artistLabel.equalsIgnoreCase(button.getAttribute("aria-label")); }
                    catch (Exception ignored) { return false; }
                }).count();
            long profileImages = driver.findElements(By.cssSelector("img[alt][src*='ab676161']")).size();
            long matchingArtistImages = driver.findElements(By.cssSelector("img[alt][src*='ab676161']")).stream()
                .filter(image -> {
                    try { return artistLabel.equalsIgnoreCase(image.getAttribute("alt")); }
                    catch (Exception ignored) { return false; }
                }).count();
            long exactFollowerLabels = driver.findElements(By.xpath(
                "//*[text()[normalize-space(.)='Followers']]")).size();
            System.out.println("STAT_FOLLOWERS_DIAGNOSTIC|" + artistId +
                "|artist-heading-present=" + !artistName.isBlank() +
                "|profile-images=" + profileImages + "|artist-images=" + matchingArtistImages +
                "|follower-labels=" + exactFollowerLabels + "|matching-about-buttons=" + namedButtons +
                "|clicked=" + aboutClicked + "|click-method=" + clickMethod +
                "|visible-dialogs=" + displayedDialogs);
            System.out.println("STAT_FOLLOWERS_UNAVAILABLE|" + artistId + "|exact-about-number-not-found");
        } catch (Exception e) {
            System.out.println("STAT_FOLLOWERS_UNAVAILABLE|" + artistId + "|" + e.getClass().getSimpleName());
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
            int i = 11;
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

    private static void skipTwoLines() {
        System.out.println();
        System.out.println();
    }

    private static long fetchCount(WebDriver driver, String songUrl) throws InterruptedException {
        songUrl = normalizeSongUrl(songUrl);
        // Recovery pass only requests songs which failed the full collection.
        String onlyTracks = System.getenv("SVT_ONLY_TRACKS");
        if (onlyTracks != null && !onlyTracks.isBlank()) {
            String songId = songUrl.replace("https://open.spotify.com/track/", "").split("\\?")[0];
            if (!java.util.Arrays.asList(onlyTracks.split(",")).contains(songId)) return 0;
        }

        if (streamCache.containsKey(songUrl)) {
            long cachedValue = Long.parseLong(streamCache.get(songUrl).replace(",", "").replace(".", ""));
            System.out.println(nf.format(cachedValue));
            return cachedValue;
        }

        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                driver.get(songUrl);
                String text = new WebDriverWait(driver, Duration.ofSeconds(25))
                        .until(d -> {
                            // Spotify alternates span/div markup, and some pages
                            // expose a playcount in the aria-label instead.
                            for (WebElement element : d.findElements(By.cssSelector(
                                    "[data-testid='playcount'], [aria-label*=' plays'], [aria-label*=' streams']"))) {
                                String candidate = element.getText().trim();
                                if (candidate.isEmpty()) candidate = element.getAttribute("aria-label");
                                if (candidate == null) continue;
                                java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                                    "(?<![0-9])([0-9]{1,3}(?:[,\\s][0-9]{3})+|[0-9]{4,15})(?![0-9])")
                                    .matcher(candidate);
                                if (m.find()) return m.group(1);
                            }
                            return null;
                        });
                long parsedValue = Long.parseLong(text.replaceAll("[^0-9]", ""));
                if (parsedValue <= 0) throw new IllegalStateException("Empty Spotify playcount");
                streamCache.put(songUrl, text);
                System.out.println(nf.format(parsedValue));
                return parsedValue;
            } catch (Exception e) {
                // A Spotify page can load without a playcount (regional or
                // temporary restriction). Never substitute yesterday's total.
                if (attempt == 2) {
                    System.out.println("STAT_TRACK_UNAVAILABLE|" + songUrl +
                        "|" + e.getClass().getSimpleName());
                }
                if (attempt < 2) Thread.sleep(1400L * (attempt + 1));
            }
        }

        // Some Spotify track pages omit their play count even when their album
        // still shows an exact count for that recording. Try that strict fallback
        // before declaring the track unavailable. Never guess a value.
        long parsedValue = fetchTrackCountFromAlbum(driver, songUrl);
        if (parsedValue > 0) {
            streamCache.put(songUrl, Long.toString(parsedValue));
            System.out.println(nf.format(parsedValue));
            return parsedValue;
        }

        System.out.println("0");
        return 0;
    }

    private static long fetchTrackCountFromAlbum(WebDriver driver, String songUrl) {
        final String trackId = songUrl.replace("https://open.spotify.com/track/", "").split("\\?")[0];
        java.util.LinkedHashSet<String> albums = new java.util.LinkedHashSet<>();
        try {
            for (WebElement link : driver.findElements(By.cssSelector("a[href*='/album/']"))) {
                String href = link.getAttribute("href");
                if (href != null && href.matches("https://open\\.spotify\\.com/album/[A-Za-z0-9]{22}.*")) {
                    albums.add(href.split("\\?")[0]);
                }
                if (albums.size() >= 2) break;
            }
        } catch (Exception ignored) {}
        for (String album : albums) {
            try {
                driver.get(album);
                String exact = new WebDriverWait(driver, Duration.ofSeconds(18)).until(d -> {
                    for (WebElement row : d.findElements(By.cssSelector(
                            "[data-testid='tracklist-row'], [role='row']"))) {
                        boolean matchingTrack = false;
                        for (WebElement link : row.findElements(By.cssSelector("a[href*='/track/']"))) {
                            String href = link.getAttribute("href");
                            if (href != null && href.contains("/track/" + trackId)) {
                                matchingTrack = true;
                                break;
                            }
                        }
                        if (!matchingTrack) continue;
                        for (WebElement count : row.findElements(By.cssSelector(
                                "[data-testid='playcount'], [aria-label*=' plays'], [aria-label*=' streams']"))) {
                            String candidate = count.getText().trim();
                            if (candidate.isEmpty()) candidate = count.getAttribute("aria-label");
                            if (candidate == null) continue;
                            java.util.regex.Matcher number = java.util.regex.Pattern.compile(
                                    "(?<![0-9])([0-9]{1,3}(?:[,\\s][0-9]{3})+|[0-9]{4,15})(?![0-9])")
                                    .matcher(candidate);
                            if (number.find()) return number.group(1);
                        }
                    }
                    return null;
                });
                long value = Long.parseLong(exact.replaceAll("[^0-9]", ""));
                if (value > 0) {
                    System.out.println("STAT_ALBUM_FALLBACK|" + songUrl + "|" + album);
                    return value;
                }
            } catch (Exception ignored) {
                // A failed fallback remains unverified and must not be published.
            }
        }
        return 0;
    }

    private static String normalizeSongUrl(String songUrl) {
        String normalizedSongUrl = songUrl.trim();
        if (normalizedSongUrl.contains("?si=")) {
            normalizedSongUrl = normalizedSongUrl.split("\\?si=")[0];
        }
        return normalizedSongUrl;
    }

    private static long getGroupTotal(WebDriver driver, String[] group) throws InterruptedException {
        long total = 0;
        for (String song : group) {
            total += fetchCount(driver, song);
        }
        return total;
    }
}
