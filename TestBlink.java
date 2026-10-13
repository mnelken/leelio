import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;

public class TestBlink {
  public static void main(String[] args) throws Exception {
    BufferedImage src = ImageIO.read(new File("public/avatar.jpg"));
    int w = src.getWidth();
    int h = src.getHeight();
    BufferedImage dst = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);

    float blinkAmt = 1.0f; // fully closed

    for (int y = 0; y < h; y++) {
      for (int x = 0; x < w; x++) {
        float Px = x;
        float Py = y;
        float lash = 0f;

        // Left Eye: center (518, 166), rx=13, ry=7
        float dLx = (Px - 518.0f) / 13.0f;
        float dLy = (Py - 166.0f) / 7.0f;
        if (dLx * dLx + dLy * dLy < 1.0f) {
          float archL = (float) Math.sqrt(Math.max(0.0, 1.0 - dLx * dLx));
          float topL = 166.0f - 7.0f * archL;
          float botL = 166.0f + 7.0f * archL;
          float lidY = topL + (botL - topL) * blinkAmt;

          if (Py < lidY) {
            float norm = (Py - topL) / Math.max(0.1f, lidY - topL);
            Py = (topL - 2.5f) * (1f - norm) + 158.0f * norm;
          }
          float dist = Math.abs(Py - lidY);
          if (dist < 1.6f) lash = Math.max(lash, (1.6f - dist) / 1.6f);
        }

        // Right Eye: center (571, 167), rx=12, ry=7
        float dRx = (Px - 571.0f) / 12.0f;
        float dRy = (Py - 167.0f) / 7.0f;
        if (dRx * dRx + dRy * dRy < 1.0f) {
          float archR = (float) Math.sqrt(Math.max(0.0, 1.0 - dRx * dRx));
          float topR = 167.0f - 7.0f * archR;
          float botR = 167.0f + 7.0f * archR;
          float lidY = topR + (botR - topR) * blinkAmt;

          if (Py < lidY) {
            float norm = (Py - topR) / Math.max(0.1f, lidY - topR);
            Py = (topR - 2.5f) * (1f - norm) + 159.0f * norm;
          }
          float dist = Math.abs(Py - lidY);
          if (dist < 1.6f) lash = Math.max(lash, (1.6f - dist) / 1.6f);
        }

        int sx = Math.min(w - 1, Math.max(0, Math.round(Px)));
        int sy = Math.min(h - 1, Math.max(0, Math.round(Py)));
        int rgb = src.getRGB(sx, sy);
        if (lash > 0.01f) {
          int r = (int) (((rgb >> 16) & 0xFF) * (1f - 0.58f * lash));
          int g = (int) (((rgb >> 8) & 0xFF) * (1f - 0.58f * lash));
          int b = (int) ((rgb & 0xFF) * (1f - 0.58f * lash));
          rgb = (r << 16) | (g << 8) | b;
        }
        dst.setRGB(x, y, rgb);
      }
    }
    ImageIO.write(dst, "png", new File("test_blink_closed.png"));
    System.out.println("Blink test saved.");
  }
}
