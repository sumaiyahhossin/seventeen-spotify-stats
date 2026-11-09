import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;

/** Collects admin-added Spotify track IDs without requiring Java source edits. */
public class Admin_Track_Collector {
    public static void main(String[] ids) {
        ChromeOptions options=new ChromeOptions();
        options.addArguments("--headless=new","--no-sandbox","--disable-dev-shm-usage");
        options.addArguments("--disable-blink-features=AutomationControlled");
        WebDriver browser=new ChromeDriver(options);
        try {
            for(String id:ids) {
                if(!id.matches("[A-Za-z0-9]{22}")) continue;
                long plays=0;
                for(int attempt=1;attempt<=3;attempt++) {
                    try {
                        browser.get("https://open.spotify.com/track/"+id);
                        String count=new WebDriverWait(browser,Duration.ofSeconds(20)).until(driver -> {
                            for(WebElement el:driver.findElements(By.cssSelector(
                                "[data-testid='playcount'],[aria-label*=' plays'],[aria-label*=' streams']"))) {
                                String s=el.getText().trim();
                                if(s.isEmpty())s=el.getAttribute("aria-label");
                                if(s==null)continue;
                                java.util.regex.Matcher m=java.util.regex.Pattern.compile(
                                    "(?<![0-9])([0-9]{1,3}(?:[,\\s][0-9]{3})+|[0-9]{4,15})(?![0-9])").matcher(s);
                                if(m.find())return m.group(1);
                            }
                            return null;
                        });
                        plays=Long.parseLong(count.replaceAll("[^0-9]",""));
                        if(plays>0)break;
                    }catch(Exception ignored){}
                }
                if(plays<=0)System.out.println("STAT_TRACK_UNAVAILABLE|https://open.spotify.com/track/"+id+"|NoVerifiedPlaycount");
                System.out.println("STAT_TRACK|https://open.spotify.com/track/"+id+"|"+plays);
            }
        } finally { browser.quit(); }
    }
}
