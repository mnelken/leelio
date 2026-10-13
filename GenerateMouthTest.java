import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;

public class GenerateMouthTest {
  public static void main(String[] args) throws Exception {
    BufferedImage src = ImageIO.read(new File("public/avatar.jpg"));
    renderNaturalSpeech(src, "test_speech_vowel_ah_v2.png", 0.75f, 0.0f);
    renderNaturalSpeech(src, "test_speech_vowel_oh_v2.png", 0.65f, -0.35f);
    renderNaturalSpeech(src, "test_speech_vowel_ee_v2.png", 0.45f, 0.45f);
    System.out.println("Rendered v2 tests.");
  }

  static void renderNaturalSpeech(BufferedImage src, String outFile, float jaw, float spread) throws Exception {
    int w = src.getWidth();
    int h = src.getHeight();
    BufferedImage dst = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);

    float mouthCx = 551.0f;
    float mouthHw = 19.0f * (1.0f + 0.15f * spread);

    for (int y = 0; y < h; y++) {
      for (int x = 0; x < w; x++) {
        float Px = x;
        float Py = y;

        float tx = (Px - mouthCx) / mouthHw;

        if (Math.abs(tx) < 1.35f && Py >= 200 && Py <= 275) {
          // Precise lip seam curve of avatar.jpg
          float lipSeamY = 229.0f - 1.8f * (tx * tx);

          if (Math.abs(tx) <= 1.0f) {
            float arch = (float) Math.sqrt(Math.max(0.0, 1.0 - tx * tx));
            float openHeight = 9.5f * jaw * arch;

            float yUpper = lipSeamY - openHeight * 0.18f;
            float yLower = lipSeamY + openHeight * 0.82f;

            if (jaw > 0.02f && Py >= yUpper && Py <= yLower) {
              float gap = yLower - yUpper;
              float t = (Py - yUpper) / gap; // 0 = upper, 1 = lower

              // Photorealistic soft shadowed mouth interior
              // Deep rich dark tones matching lip seam (R=75, G=8, B=5)
              float r = 50f + 25f * (float) Math.sin(t * Math.PI);
              float g = 10f + 8f * (float) Math.sin(t * Math.PI);
              float b = 8f + 8f * (float) Math.sin(t * Math.PI);

              // Very subtle natural tooth sheen under upper lip
              if (t > 0.10f && t < 0.38f && openHeight > 3.5f) {
                float sheen = (float) Math.sin(((t - 0.10f) / 0.28f) * Math.PI);
                r = r * (1f - sheen * 0.40f) + 135f * (sheen * 0.40f);
                g = g * (1f - sheen * 0.40f) + 120f * (sheen * 0.40f);
                b = b * (1f - sheen * 0.40f) + 115f * (sheen * 0.40f);
              }

              // Shadow near upper & lower edges to blend seamlessly into lip vermilion
              float edgeShadow = (float) Math.sin(t * Math.PI);
              edgeShadow = (float) Math.sqrt(edgeShadow);
              r *= (0.60f + 0.40f * edgeShadow);
              g *= (0.60f + 0.40f * edgeShadow);
              b *= (0.60f + 0.40f * edgeShadow);

              int ir = Math.min(255, Math.max(0, (int) r));
              int ig = Math.min(255, Math.max(0, (int) g));
              int ib = Math.min(255, Math.max(0, (int) b));
              dst.setRGB(x, y, (ir << 16) | (ig << 8) | ib);
              continue;
            }

            // OUTSIDE APERTURE:
            if (Py > lipSeamY) {
              // Lower lip & chin drop
              float yRim = lipSeamY + openHeight * 0.82f;
              if (Py >= yRim) {
                float falloff = (float) Math.max(0.0, 1.0 - (Py - yRim) / (262.0f - yRim));
                falloff = falloff * (3.0f - 2.0f * falloff);
                float disp = (openHeight * 0.82f) * falloff;
                Py -= disp;
              }
            } else {
              // Upper lip subtle rise
              float yRim = lipSeamY - openHeight * 0.18f;
              if (Py <= yRim) {
                float falloff = (float) Math.max(0.0, 1.0 - (yRim - Py) / (yRim - 218.0f));
                falloff = falloff * (3.0f - 2.0f * falloff);
                float disp = (openHeight * 0.18f) * falloff;
                Py += disp;
              }
            }
          }

          // Chin depression (mandible descent) below mouth
          if (Py >= 238 && Py <= 270) {
            float chinHoriz = (float) Math.max(0.0, 1.0 - Math.abs(Px - mouthCx) / 38.0f);
            float chinVert = (float) Math.sin(((Py - 238.0f) / 32.0f) * Math.PI);
            float chinDrop = 4.2f * jaw * chinHoriz * chinVert;
            Py -= chinDrop;
          }

          // Mouth spread (lateral stretching of corners)
          if (Math.abs(spread) > 0.01f && Py >= 222 && Py <= 238) {
            float spreadInfluence = (float) Math.max(0.0, 1.0 - Math.abs(Py - 229.0f) / 9.0f);
            float spreadDisp = tx * spread * 2.2f * spreadInfluence;
            Px -= spreadDisp;
          }
        }

        int sx = Math.min(w - 1, Math.max(0, Math.round(Px)));
        int sy = Math.min(h - 1, Math.max(0, Math.round(Py)));
        dst.setRGB(x, y, src.getRGB(sx, sy));
      }
    }

    ImageIO.write(dst, "png", new File(outFile));
  }
}
