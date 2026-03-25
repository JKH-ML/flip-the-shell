# Flip the Shell 🐚 + SnailShell 🐌

**Flip the Shell** is a powerful Chrome extension that detects and instantly extracts hidden data (images, videos, etc.) from **Shell Images** uploaded to the web.

This tool is perfectly integrated with the [ComfyUI-SnailShell](https://github.com/JKH-ML/ComfyUI-SnailShell) custom node, allowing users to verify hidden content directly in the browser without any complex decoding processes.

## 🌟 Key Feature: SNAIL Steganography Integration

Beyond simple shell detection, it restores hidden data encrypted/compressed with the **SNAIL Protocol** in real-time within the web environment.

- **Real-time Detection:** Automatically scans for hidden data when hovering over images on any webpage.
- **SNAIL Signature Recognition:** Employs the `k-auto-scan` algorithm to find hidden data regardless of the bit-depth (k=2, 4, 8).
- **Instant Extraction & Playback:** Displays hidden images in a popup and provides instant streaming for **MP4 videos**.
- **CORS Bypass:** Utilizes extension privileges to analyze images even on sites with strict security policies.

## 🛠 Usage (The Snail Workflow)

### 1. Hide Data (ComfyUI)
Use [ComfyUI-SnailShell](https://github.com/JKH-ML/ComfyUI-SnailShell) to generate a "Shell Image" that hides a secret image or video. The output looks like a perfectly normal image to the naked eye.

### 2. Upload & Share
Upload the generated image to any community, SNS, or image hosting site.

### 3. Reveal Data (Flip the Shell)
- View the image using a browser with **Flip the Shell** installed.
- Hover over the image to see a **magnifying glass icon** appear at the center (or your configured position).
- Click the icon to instantly reveal the hidden image or video in its original quality!

## 🚀 Installation

<div align="center">
  <a href="https://chromewebstore.google.com/detail/flip-the-shell/opplmeompodbeojbbccnllpbjhcbnnbn?hl=ko&utm_source=ext_sidebar">
    <img src="https://storage.googleapis.com/chrome-gcm-v1.appspot.com/badges/en/chrome_web_store-static.png" alt="Available in the Chrome Web Store" height="70">
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
