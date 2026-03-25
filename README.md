# Flip the Shell 🐚 + SnailShell 🐌

**Flip the Shell** is a powerful Chrome extension that detects and instantly extracts hidden data (images, videos, etc.) from **Shell Images** uploaded to the web.

This tool is perfectly integrated with the [ComfyUI-SnailShell](https://github.com/JKH-ML/ComfyUI-SnailShell) custom node, allowing users to verify hidden content directly in the browser without any complex decoding processes.

## 🌟 Key Feature: SNAIL Steganography Integration

Beyond simple shell detection, it restores hidden data encrypted/compressed with the **SNAIL Protocol** in real-time within the web environment.

- **Real-time Detection:** Automatically scans for hidden data when hovering over images on any webpage.
- **SNAIL Signature Recognition:** Employs the `k-auto-scan` algorithm to find hidden data regardless of the bit-depth (k=2, 4, 8).
- **Instant Extraction & Playback:** Displays hidden images in a popup and provides instant streaming for **MP4 videos**.
- **CORS Bypass:** Utilizes extension privileges to analyze images even on sites with strict security policies.

## 🛠 Usage (RunningHub Example)

### 1. Hide Your Data
Use the [Demo Workflow (AVoid Censorship by Snail-Shell.json)](https://github.com/JKH-ML/ComfyUI-SnailShell/blob/main/AVoid%20Censorship%20by%20Snail-Shell.json) in ComfyUI or RunningHub. This workflow allows you to hide your own images or sensitive data inside a "Shell Image."

### 2. Check on RunningHub
- After generating the image, go to your **Task List** on RunningHub.
- Click on the generated **Shell Image** to enlarge it.
- Hover your mouse over the enlarged image, and a **view icon (eye/magnifier)** will appear.
- **Tip:** If the icon doesn't appear, try closing the image preview and opening it again to trigger the scan.

### 3. Reveal the Secret
Click the icon to instantly reveal and play the original hidden image or video in high quality!

## 🚀 Installation

<div align="center">
  <a href="https://chromewebstore.google.com/detail/flip-the-shell/opplmeompodbeojbbccnllpbjhcbnnbn?hl=ko&utm_source=ext_sidebar">
    <img src="https://raw.githubusercontent.com/chrome-webstore/badge/main/static/images/en/chrome-web-store-badge-280x80.png" alt="Available in the Chrome Web Store" height="70">
  </a>
</div>

### Developer Mode Installation
1. Clone this repository.
2. Go to `chrome://extensions/` and enable 'Developer mode'.
3. Click 'Load unpacked' and select the project folder.

## 💻 Technical Details

- **SNAIL Protocol:** Variable bit-depth steganography algorithm (Custom Implementation).
- **Performance:** Optimized with `WeakMap` caching and `willReadFrequently` canvas context to maintain smooth browsing.
- **Compatibility:** Based on Manifest V3, optimized for the latest Chrome browsers.

## 📄 Policy & Caution

- **Privacy Policy:** Refer to [index.html](./index.html) (Mandatory for Chrome Web Store).
- This tool is designed for security research and creative data sharing. Please do not use it to infringe upon the rights of others.

---
**Maintained by [JKH-ML](https://github.com/JKH-ML)**
