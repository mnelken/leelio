import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;

public class TestEyelashBlink {
  public static void main(String[] args) throws Exception {
    BufferedImage src = ImageIO.read(new File("public/avatar.jpg"));
    int w = src.getWidth();
    int h = src.getHeight();
    BufferedImage dst = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);

    float blinkAmt = 0.85f; // natural partial/full blink

    for (int y = 0; y < h; y++) {
      for (int x = 0; x < w; x++) {
        float Px = x;
        float Py = y;

        // Left Eye
        float dLx = (Px - 518.0f) / 12.0f;
        float dLy = (Py - 166.0f) / 6.5f;
        float distL = dLx * dLx + dLy * dLy;
        if (distL < 1.0f && blinkAmt > 0.01f) {
          float arch = (float) Math.sqrt(Math.max(0.0, 1.0 - dLx * dLx));
          float topL = 166.0f - 6.5f * arch;
          float botL = 166.0f + 6.5f * arch;
          float currentLidY = topL + (botL - topL) * blinkAmt;

          if (Py <= currentLidY) {
            // Eyelid skin with eyelash rim
            float relLid = (currentLidY - Py);
            if (relLid < 2.0f) {
              // Dark eyelash line
              float lashT = relLid / 2.0f;
              float r = 25f + 15f * lashT;
              float g = 18f + 10f * lashT;
              float b = 15f + 10f * lashT;
              dst.setRGB(x, y, (((int)r) << 16) | (((int)g) << 8) | ((int)b));
              continue;
            } else {
              // Smooth eyelid skin sampled from above crease
              Py = 160.0f - relLid * 0.4f;
            }
          }
        }

        // Right Eye
        float dRx = (Px - 571.0f) / 11.5f;
        float dRy = (Py - 167.0f) / 6.5f;
        float distR = dRx * dRx + dRy * dRy;
        if (distR < 1.0f && blinkAmt > 0.01f) {
          float arch = (float) Math.sqrt(Math.max(0.0, 1.0 - dRx * dRx));
          float topR = 167.0f - 6.5f * arch;
          float botR = 167.0f + 6.5f * arch;
          float currentLidY = topR + (botR - topR) * blinkAmt;

          if (Py <= currentLidY) {
            float relLid = (currentLidY - Py);
            if (relLid < 2.0f) {
              float lashT = relLid / 2.0f;
              float r = 25f + 15f * lashT;
              float g = 18f + 10f * lashT;
              float b = 15f + 10f * lashT;
              dst.setRGB(x, y, (((int)r) << 16) | (((int)g) << 8) | ((int)b));
              continue;
            } else {
              Py = 160.0f - relLid * 0.4f;
            }
          }
        }

        int sx = Math.min(w - 1, Math.max(0, Math.round(Px)));
        int sy = Math.min(h - 1, Math.max(0, Math.round(Py)));
        dst.setRGB(x, y, src.getRGB(sx, sy));
      }
    }
    ImageIO.write(dst, "png", new File("test_natural_blink.png"));
    System.out.println("Natural blink saved.");
  }
}
