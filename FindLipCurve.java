import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;

public class FindLipCurve {
  public static void main(String[] args) throws Exception {
    BufferedImage img = ImageIO.read(new File("public/avatar.jpg"));
    // For each x from 525 to 580, find the y with lowest brightness (the dark lip line)
    // between y=220 and y=245
    for (int x = 525; x <= 580; x++) {
      int bestY = 220;
      int minBrightness = 999999;
      for (int y = 222; y <= 240; y++) {
        int rgb = img.getRGB(x, y);
        int r = (rgb >> 16) & 0xFF;
        int g = (rgb >> 8) & 0xFF;
        int b = rgb & 0xFF;
        int bright = r * 2 + g * 3 + b; // perceived dark
        if (bright < minBrightness) {
          minBrightness = bright;
          bestY = y;
        }
      }
      int rgb = img.getRGB(x, bestY);
      int r = (rgb >> 16) & 0xFF;
      int g = (rgb >> 8) & 0xFF;
      int b = rgb & 0xFF;
      System.out.printf("x=%d -> lipY=%d (R=%d, G=%d, B=%d)%n", x, bestY, r, g, b);
    }
  }
}
