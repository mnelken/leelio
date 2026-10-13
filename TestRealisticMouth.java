import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;

public class TestRealisticMouth {
  public static void main(String[] args) throws Exception {
    BufferedImage src = ImageIO.read(new File("public/avatar.jpg"));
    renderMouth(src, "test_realistic_ah.png", 0.70f, 0.0f);
    renderMouth(src, "test_realistic_oh.png", 0.60f, -0.30f);
    renderMouth(src, "test_realistic_ee.png", 0.40f, 0.40f);
    renderMouth(src, "test_realistic_subtle.png", 0.25f, 0.0f);
    System.out.println("Rendered realistic mouth tests.");
  }

  static void renderMouth(BufferedImage src, String outFile, float jaw, float spread) throws Exception {
    int w = src.getWidth();
    int h = src.getHeight();
    BufferedImage dst = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);

    float mouthCx = 552.0f;
    float mouthHw = 20.0f * (1.0f + 0.15f * spread);

    for (int y = 0; y < h; y++) {
      for (int x = 0; x < w; x++) {
        float Px = x;
        float Py = y;

        float tx = (Px - mouthCx) / mouthHw;

        if (Math.abs(tx) < 1.35f && Py >= 200 && Py <= 275) {
          float lipSeamY = 229.0f - 1.8f * (tx * tx);

          if (Math.abs(tx) <= 1.0f) {
            float arch = (float) Math.sqrt(Math.max(0.0, 1.0 - tx * tx));
            // Aperture opening: up to 13 pixels
            float openGap = 13.0f * jaw * arch;

            float yUpper = lipSeamY - openGap * 0.15f;
            float yLower = lipSeamY + openGap * 0.85f;

            // 1. INSIDE ORAL CAVITY
            if (jaw > 0.02f && Py >= yUpper && Py <= yLower) {
              float gap = yLower - yUpper;
              float t = (Py - yUpper) / gap; // 0 = upper, 1 = lower

              // Deep natural dark mouth cavity (tones of soft palate / oral shadows)
              float r = 40f + 20f * (float) Math.sin(t * Math.PI);
              float g = 10f + 6f * (float) Math.sin(t * Math.PI);
              float b = 8f + 6f * (float) Math.sin(t * Math.PI);

              // Natural upper incisor teeth sheen (subtle, soft enamel under upper lip)
              if (t > 0.08f && t < 0.40f && openGap > 4.0f) {
                float teethT = (float) Math.sin(((t - 0.08f) / 0.32f) * Math.PI);
                float toothGroove = (float) Math.sin(tx * 32.0f) * 0.08f;
                float teethWeight = Math.max(0.0f, teethT - toothGroove) * 0.45f;
                r = r * (1f - teethWeight) + 145f * teethWeight;
                g = g * (1f - teethWeight) + 135f * teethWeight;
                b = b * (1f - teethWeight) + 128f * teethWeight;
              }

              // Soft rim shadow along upper and lower lips
              float edgeShadow = (float) Math.sin(t * Math.PI);
              edgeShadow = (float) Math.sqrt(edgeShadow);
              r *= (0.55f + 0.45f * edgeShadow);
              g *= (0.55f + 0.45f * edgeShadow);
              b *= (0.55f + 0.45f * edgeShadow);

              int ir = Math.min(255, Math.max(0, (int) r));
              int ig = Math.min(255, Math.max(0, (int) g));
              int ib = Math.min(255, Math.max(0, (int) b));
              dst.setRGB(x, y, (ir << 16) | (ig << 8) | ib);
              continue;
            }

            // 2. LOWER LIP & CHIN DEFORMATION (OUTSIDE APERTURE)
            if (Py > lipSeamY && jaw > 0.02f) {
              float yRim = lipSeamY + openGap * 0.85f;
              if (Py >= yRim) {
                // Lower lip is 10px thick in the original photo (y=229 to 239)
                float lowerLipThick = 10.0f;
                float lowerDisp = (yRim - lipSeamY);

                if (Py <= yRim + lowerLipThick) {
                  // Direct 1:1 reproduction of the original full lower lip vermilion!
                  float lipProgress = (Py - yRim) / lowerLipThick;
                  Py = lipSeamY + lipProgress * lowerLipThick;
                } else {
                  // Chin smoothly descends to collar
                  float chinDist = Py - (yRim + lowerLipThick);
                  float chinRange = 275.0f - (yRim + lowerLipThick);
                  float falloff = (float) Math.max(0.0, 1.0 - chinDist / Math.max(1.0f, chinRange));
                  falloff = falloff * falloff * (3.0f - 2.0f * falloff);
                  Py -= lowerDisp * falloff;
                }
              }
            } else if (Py < lipSeamY && jaw > 0.02f) {
              // Upper lip subtle rise
              float yRim = lipSeamY - openGap * 0.15f;
              if (Py <= yRim) {
                float dist = yRim - Py;
                float falloff = (float) Math.max(0.0, 1.0 - dist / 14.0f);
                falloff = falloff * (3.0f - 2.0f * falloff);
                Py += (openGap * 0.15f) * falloff;
              }
            }
          }

          // Lateral mouth spread modulation
          if (Math.abs(spread) > 0.01f && Py >= 222 && Py <= 245) {
            float spreadInfluence = (float) Math.max(0.0, 1.0 - Math.abs(Py - 229.0f) / 12.0f);
            float spreadDisp = tx * spread * 2.5f * spreadInfluence;
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
