# Flip the Shell 🐚 + SnailShell 🐌

**Flip the Shell** is a powerful Chrome extension—**perfectly optimized for RunningHub users**—that detects and instantly extracts hidden data (images, videos, etc.) from **Shell Images** uploaded to the web.

<div align="center">
  <a href="https://chromewebstore.google.com/detail/flip-the-shell/opplmeompodbeojbbccnllpbjhcbnnbn?hl=ko&utm_source=ext_sidebar" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/🚀%20Install%20on%20Chrome%20Web%20Store-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Web Store">
  </a>
  &nbsp;
  <a href="https://www.runninghub.ai/?inviteCode=ux1wt2if" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/⚡%20Run%20on%20RunningHub-87d530?style=for-the-badge&logo=rocket&logoColor=white" alt="RunningHub">
  </a>
</div>

---

### 🌐 Optimized for RunningHub
<a href="https://www.runninghub.ai/?inviteCode=ux1wt2if" target="_blank" rel="noopener noreferrer">RunningHub</a> is the ultimate cloud platform for ComfyUI. **Flip the Shell** is designed to work seamlessly within the RunningHub environment, allowing you to scan task results and reveal hidden "SNAIL" data directly from your dashboard.

This tool is perfectly integrated with the <a href="https://github.com/JKH-ML/ComfyUI-SnailShell" target="_blank" rel="noopener noreferrer">ComfyUI-SnailShell</a> custom node, allowing users to verify hidden content directly in the browser without any complex decoding processes.

## 🌟 Key Feature: SNAIL Steganography Integration

Beyond simple shell detection, it restores hidden data encrypted/compressed with the **SNAIL Protocol** in real-time within the web environment.

- **Real-time Detection:** Automatically scans for hidden data when hovering over images on any webpage.
- **SNAIL Signature Recognition:** Employs the `k-auto-scan` algorithm to find hidden data regardless of the bit-depth (k=2, 4, 8).
- **Instant Extraction & Playback:** Displays hidden images in a popup and provides instant streaming for **MP4 videos**.
- **CORS Bypass:** Utilizes extension privileges to analyze images even on sites with strict security policies.
- **Visual Highlight:** Automatically highlights shell images with a neon pulse effect.
- **Context Menu:** Decode any image directly via right-click menu.
- **Direct Download:** Export extracted files instantly.

## 🛠 Usage (RunningHub Example)

### 1. Hide Your Data
Use the <a href="https://github.com/JKH-ML/ComfyUI-SnailShell/blob/main/AVoid%20Censorship%20by%20Snail-Shell.json" target="_blank" rel="noopener noreferrer">Demo Workflow (AVoid Censorship by Snail-Shell.json)</a> in ComfyUI or RunningHub. This workflow allows you to hide your own images or sensitive data inside a "Shell Image."

### 2. Check on RunningHub
- After generating the image, go to your **Task List** on RunningHub.
- Click on the generated **Shell Image** to enlarge it.
- Hover your mouse over the enlarged image, and a **view icon (eye/magnifier)** will appear.
- **Tip:** If the icon doesn't appear, try closing the image preview and opening it again to trigger the scan.

### 3. Reveal the Secret
Click the icon to instantly reveal and play the original hidden image or video in high quality!

## 💻 Technical Details: The SNAIL Engine

The core of this system is the **SNAIL Protocol**, a custom steganography implementation designed for high-capacity data hiding and rapid browser-side extraction.

### 1. Data Hiding (The Encoder)
The `ComfyUI-SnailShell` node hides binary data within the pixel values of a carrier image (the "Shell").
- **Bit-Depth Steganography (k):** Instead of simple LSB (Least Significant Bit), it uses a variable bit-depth $k \in \{2, 4, 8\}$. This allows for different levels of capacity vs. invisibility.
- **Pixel Modulation:** For each RGB channel of a pixel, the bottom $k$ bits are replaced with the hidden data's bits using the formula: $P_{\text{new}} = (P_{\text{old}} - (P_{\text{old}} \pmod{2^k})) + \text{bits}$.
- **SNAIL Signature:** A 40-bit unique signature (`SNAIL`) is embedded at a specific offset. This signature allows the extension to distinguish between normal images and valid "Shell" images.

### 2. Real-time Detection (The Scanner)
The extension runs an optimized background scanner on every image hover:
- **k-Auto-Scan:** It doesn't know the bit-depth $k$ beforehand. It speculatively decodes the first few bytes using all possible $k$ values (2, 4, 8) until it finds the `SNAIL` signature.
- **Efficiency:** To prevent UI lag, it uses `WeakMap` to cache scan results and skips certain pixel areas (SKIP_W_RATIO, SKIP_H_RATIO) where UI elements or metadata are typically located.
- **CORS Handling:** When a standard `canvas.getImageData()` fails due to Cross-Origin policies, the extension triggers a high-privilege `fetch` to retrieve the raw image data as a Blob and reconstructs it.

### 3. Extraction & Reconstruction (The Decoder)
Once the user clicks the icon, the full bitstream is extracted:
- **Bit-to-Byte Reassembly:** The extracted bits are packed back into a `Uint8Array`.
- **Header Parsing:** It reads the metadata header containing the file extension (e.g., `.png`, `.mp4`) and the total data length.
- **Dynamic Rendering:**
  - **Images:** Converted to a `Blob URL` and displayed in a high-quality overlay.
  - **Videos:** Streamed through a `video` element with hardware acceleration.
  - **Text:** Decoded using `TextDecoder` and shown in a pre-formatted box.

## 📜 Version History

### [v4.0] - 2026-03-26 (Current)
- **Zero-Latency UI:** Implemented a Visibility Watchdog that removes lingering icons within 100ms of an image disappearing.
- **Enhanced Reliability:** Added deep-check for image connectivity and visibility to prevent UI glitches.

### [v3.9] - 2026-03-26
- **UI Refinement:** Replaced text-based download buttons with sleek SVG icons.
- **Improved Aesthetics:** Added glassmorphism effects and hover animations to the action buttons.

### [v3.8] - 2026-03-26
- **Simplified:** Removed password encryption support for better stability and simpler workflow.
- **Direct Download:** Added functionality to export extracted files directly.
- **UI Enhancements:** Increased view icon size and improved response time.

### [v3.5] - 2026-03-26
- **Visual Highlight:** Added auto-highlighting for shell images with neon effects.
- **Context Menu:** Integrated right-click "Flip this Shell" menu.

### [v3.0] - 2026-03-25
- **RunningHub Optimization:** Fully optimized for RunningHub's dashboard and task list.
- **SNAIL v2 Protocol:** Support for variable bit-depth ($k \in \{2, 4, 8\}$) extraction.
- **Video Support:** Added real-time MP4 video extraction and streaming playback.

### [v2.0] - 2026-03-20
- **Manifest V3 Migration:** Complete rewrite for Google's latest extension standard.
- **CORS Bypass:** Implemented high-privilege fetch for cross-origin image analysis.

### [v1.0] - 2026-03-10
- **Initial Release:** Basic steganography detection and PNG extraction.

## 📄 Policy & Caution

- **Privacy Policy:** Detailed information can be found at <a href="https://jkh-ml.github.io/flip-the-shell/" target="_blank" rel="noopener noreferrer">https://jkh-ml.github.io/flip-the-shell/</a>
- **Disclaimer:** This tool is intended for security research and creative data sharing. Users are responsible for ensuring their use of this tool complies with all applicable laws and regulations. Do not use this tool to infringe upon the rights of others.

---
**Maintained by <a href="https://github.com/JKH-ML" target="_blank" rel="noopener noreferrer">JKH-ML</a>**
