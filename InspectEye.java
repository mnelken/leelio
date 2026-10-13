import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;

public class InspectEye {
  public static void main(String[] args) throws Exception {
    BufferedImage img = ImageIO.read(new File("public/avatar.jpg"));
    System.out.println("Left Eye (x=518):");
    for (int y = 158; y <= 174; y++) {
      int rgb = img.getRGB(518, y);
      int r = (rgb >> 16) & 0xFF;
      int g = (rgb >> 8) & 0xFF;
      int b = rgb & 0xFF;
      System.out.printf("y=%d: R=%d G=%d B=%d%n", y, r, g, b);
    }
    System.out.println("Right Eye (x=571):");
    for (int y = 158; y <= 174; y++) {
      int rgb = img.getRGB(571, y);
      int r = (rgb >> 16) & 0xFF;
      int g = (rgb >> 8) & 0xFF;
      int b = rgb & 0xFF;
      System.out.printf("y=%d: R=%d G=%d B=%d%n", y, r, g, b);
    }
  }
}
