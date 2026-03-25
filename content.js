// Flip the Shell Extension v3.0 - RunningHub Integration Pro
let iconPosition = 'top-right'; // Default to top-right to match ellipsis
const shellCache = new WeakMap();
const iconMap = new WeakMap();

const SKIP_W_RATIO = 0.40;
const SKIP_H_RATIO = 0.08;

chrome.storage.local.get(['iconPosition'], (result) => { if (result.iconPosition) iconPosition = result.iconPosition; });
chrome.storage.onChanged.addListener((changes) => { if (changes.iconPosition) iconPosition = changes.iconPosition.newValue; });

function createPersistentIcon(img) {
    if (iconMap.has(img)) return iconMap.get(img);

    const icon = document.createElement('div');
    icon.className = 'flip-the-shell-action-btn';
    // Style to match RunningHub's UI feel (glassmorphism/dark mode friendly)
    icon.style.cssText = `
        position: absolute; width: 30px; height: 30px; 
        background-color: rgba(255, 255, 255, 0.2);
        background-image: url(${chrome.runtime.getURL('icons/view_icon.png')});
        background-size: 60%; background-position: center; background-repeat: no-repeat;
        border-radius: 6px; cursor: pointer; z-index: 2147483640;
        backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.3);
        transition: all 0.2s ease;
        display: flex; align-items: center; justify-content: center;
    `;
    
    icon.onmouseover = () => { icon.style.backgroundColor = 'rgba(255, 255, 255, 0.4)'; icon.style.transform = 'scale(1.1)'; };
    icon.onmouseout = () => { icon.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; icon.style.transform = 'scale(1)'; };

    icon.onclick = (e) => { 
        e.preventDefault(); e.stopPropagation(); 
        decodeImage(img); 
    };

    const updatePos = () => {
        if (!img.isConnected || !document.body.contains(img)) {
            icon.remove(); return;
        }
        const rect = img.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            icon.style.display = 'none'; return;
        }
        icon.style.display = 'flex';
        const iconSize = 30; let left, top; const margin = 8;
        
        // Position relative to the viewport + scroll
        switch(iconPosition) {
            case 'top-left': left = rect.left + margin; top = rect.top + margin; break;
            case 'bottom-left': left = rect.left + margin; top = rect.bottom - iconSize - margin; break;
            case 'bottom-right': left = rect.right - iconSize - margin; top = rect.bottom - iconSize - margin; break;
            case 'center': left = rect.left + rect.width/2 - iconSize/2; top = rect.top + rect.height/2 - iconSize/2; break;
            default: // top-right (match ellipsis position)
                left = rect.right - iconSize - margin; top = rect.top + margin;
        }
        icon.style.left = (window.scrollX + left) + 'px';
        icon.style.top = (window.scrollY + top) + 'px';
    };

    document.body.appendChild(icon);
    iconMap.set(img, icon);
    
    updatePos();
    // High frequency update for smoother scroll/hover response
    const interval = setInterval(updatePos, 200);
    
    return icon;
}

async function fetchPixels(img) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    } catch (e) {
        const resp = await fetch(img.src);
        const blob = await resp.blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width; canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    }
}

async function checkShellSignature(img) {
    if (img.naturalWidth < 30) return null;
    if (shellCache.has(img)) return shellCache.get(img);

    try {
        const pixels = await fetchPixels(img);
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const skipW = width < 150 ? 0 : Math.floor(width * SKIP_W_RATIO);
        const skipH = height < 150 ? 0 : Math.floor(height * SKIP_H_RATIO);

        for (let k of [4, 2, 8]) {
            const divisor = Math.pow(2, k);
            let bits = [];
            outer: for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (x < skipW && y < skipH) continue;
                    if (x === 0 && y === 0) continue;
                    const idx = (y * width + x) * 4;
                    for (let c = 0; c < 3; c++) {
                        const val = pixels[idx + c] % divisor;
                        for (let b = k - 1; b >= 0; b--) {
                            bits.push((val >> b) & 1);
                            if (bits.length >= 80) break outer;
                        }
                    }
                }
                if (y > 200 && bits.length === 0) break;
            }

            if (bits.length >= 72) {
                const pack = (b) => {
                    let res = new Uint8Array(9);
                    for(let i=0; i<9; i++) for(let j=0; j<8; j++) res[i] = (res[i]<<1) | b[i*8+j];
                    return res;
                };
                const sig = new TextDecoder().decode(pack(bits).slice(4, 9));
                if (sig === "SNAIL") {
                    const res = { isShell: true, k, pixels };
                    shellCache.set(img, res);
                    return res;
                }
            }
        }
        shellCache.set(img, { isShell: false });
        return null;
    } catch (e) { return null; }
}

function scanImages() {
    const images = document.querySelectorAll('img:not(.history-icon):not([src^="data:image/svg+xml"])');
    images.forEach(img => {
        if (img.naturalWidth > 30 && !iconMap.has(img)) {
            checkShellSignature(img).then(data => {
                if (data && data.isShell) {
                    createPersistentIcon(img);
                }
            });
        }
    });
}

// Global observer for dynamic content
const pageObserver = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            shouldScan = true; break;
        }
    }
    if (shouldScan) scanImages();
});
pageObserver.observe(document.body, { childList: true, subtree: true });

// Initial scan and regular polling
setInterval(scanImages, 2000);
if (document.readyState === 'complete') scanImages();
else window.addEventListener('load', scanImages);

async function decodeImage(img) {
    const cached = shellCache.get(img);
    if (!cached || !cached.isShell) return;
    const { k, pixels } = cached;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const skipW = width < 150 ? 0 : Math.floor(width * SKIP_W_RATIO);
    const skipH = height < 150 ? 0 : Math.floor(height * SKIP_H_RATIO);
    const divisor = Math.pow(2, k);
    
    try {
        let bits = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (x < skipW && y < skipH) continue;
                if (x === 0 && y === 0) continue;
                const idx = (y * width + x) * 4;
                for (let c = 0; c < 3; c++) {
                    const val = pixels[idx + c] % divisor;
                    for (let b = k - 1; b >= 0; b--) bits.push((val >> b) & 1);
                }
            }
        }
        
        const pack = (bArr) => {
            const bytes = new Uint8Array(Math.floor(bArr.length / 8));
            for (let i = 0; i < bytes.length; i++) for (let j = 0; j < 8; j++) bytes[i] = (bytes[i] << 1) | bArr[i * 8 + j];
            return bytes;
        };
        
        const packedAll = pack(bits);
        const headerLen = new DataView(packedAll.buffer).getUint32(0);
        const header = packedAll.slice(4, 4 + headerLen);
        let idx = 5; // Skip SNAIL
        const hasPwd = header[idx++] === 1;
        if (hasPwd) { alert("Password needed"); return; }
        const extLen = header[idx++];
        const ext = new TextDecoder().decode(header.slice(idx, idx + extLen));
        idx += extLen;
        const dataLen = new DataView(header.buffer, header.byteOffset, header.byteLength).getUint32(idx);
        idx += 4;
        showSnailOverlay(header.slice(idx, idx + dataLen), ext);
    } catch (e) { alert("Failed to decode snail."); }
}

function showSnailOverlay(data, ext) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:zoom-out;backdrop-filter:blur(10px);`;
    overlay.onclick = () => document.body.removeChild(overlay);
    const container = document.createElement('div');
    container.style.cssText = "max-width: 90%; max-height: 85%; display: flex; flex-direction: column; align-items: center;";
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext.toLowerCase())) {
        const url = URL.createObjectURL(new Blob([data], { type: `image/${ext.toLowerCase()}` }));
        const img = document.createElement('img');
        img.src = url; img.style.cssText = `max-width: 100%; max-height: 100%; border: 5px solid white; border-radius: 8px; box-shadow: 0 0 30px rgba(255,255,255,0.2);`;
        container.appendChild(img);
        overlay.onclick = () => { document.body.removeChild(overlay); URL.revokeObjectURL(url); };
    } else if (ext.toLowerCase() === 'mp4') {
        const url = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
        const video = document.createElement('video');
        video.src = url; video.controls = true; video.autoplay = true; video.loop = true;
        video.style.cssText = `max-width: 100%; max-height: 100%; border: 5px solid white; border-radius: 8px; box-shadow: 0 0 30px rgba(255,255,255,0.2);`;
        container.appendChild(video);
        overlay.onclick = (e) => { if(e.target === overlay) { document.body.removeChild(overlay); URL.revokeObjectURL(url); } };
    } else {
        const textBox = document.createElement('div');
        textBox.innerText = new TextDecoder().decode(data);
        textBox.style.cssText = `padding: 30px; background: white; border-radius: 12px; color: #333; font-family: monospace; font-size: 16px; white-space: pre-wrap; max-width: 600px; overflow-y: auto;`;
        container.appendChild(textBox);
    }
    const label = document.createElement('div');
    label.innerText = `SNAIL REVEALED (${ext.toUpperCase()})`;
    label.style.cssText = `color: white; font-family: sans-serif; font-weight: bold; font-size: 20px; margin-bottom: 15px;`;
    overlay.appendChild(label);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
}
