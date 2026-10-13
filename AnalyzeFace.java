import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;

public class AnalyzeFace {
  public static void main(String[] args) throws Exception {
    BufferedImage img = ImageIO.read(new File("public/avatar.jpg"));
    System.out.println("Size: " + img.getWidth() + "x" + img.getHeight());
    int x = 548;
    for (int y = 215; y <= 265; y++) {
      int rgb = img.getRGB(x, y);
      int r = (rgb >> 16) & 0xFF;
      int g = (rgb >> 8) & 0xFF;
      int b = rgb & 0xFF;
      System.out.printf("y=%d: R=%d G=%d B=%d%n", y, r, g, b);
    }
    // Also find left and right mouth corners along y=233
    System.out.println("--- Mouth row y=233 ---");
    for (int mx = 515; mx <= 580; mx++) {
      int rgb = img.getRGB(mx, 233);
      int r = (rgb >> 16) & 0xFF;
      int g = (rgb >> 8) & 0xFF;
      int b = rgb & 0xFF;
      System.out.printf("x=%d: R=%d G=%d B=%d%n", mx, r, g, b);
    }
  }
}
