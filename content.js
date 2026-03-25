// Flip the Shell Extension v4.0 - Zero-Latency Visibility Fix
let hoverIcon = null;
let currentImg = null;
let iconPosition = 'center';
let playbackSpeed = 1.0;
const shellCache = new WeakMap();

const SKIP_W_RATIO = 0.40;
const SKIP_H_RATIO = 0.08;

const DL_ICON_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWRvd25sb2FkLWljb24gbHVjaWRlLWRvd25sb2FkIj48cGF0aCBkPSJNMTIgMTVWMyIvPjxwYXRoIGQ9Ik0yMSAxNXY0YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0ydi00Ii8+PHBhdGggZD0ibTcgMTAgNSA1IDUtNSIvPjwvc3ZnPg==`;

// Load saved settings
chrome.storage.local.get(['iconPosition', 'playbackSpeed'], (result) => { 
    if (result.iconPosition) iconPosition = result.iconPosition; 
    if (result.playbackSpeed) playbackSpeed = parseFloat(result.playbackSpeed);
});

chrome.storage.onChanged.addListener((changes) => { 
    if (changes.iconPosition) iconPosition = changes.iconPosition.newValue; 
    if (changes.playbackSpeed) playbackSpeed = parseFloat(changes.playbackSpeed.newValue);
});

// Auto-Highlight Shell Images
function autoHighlightShells() {
    const images = document.querySelectorAll('img:not(.history-icon):not([src^="data:image/svg+xml"])');
    images.forEach(img => {
        if (img.naturalWidth > 30 && !img.dataset.shellScanned) {
            checkShellSignature(img).then(data => {
                if (data && data.isShell) {
                    img.classList.add('shell-highlighted');
                }
                img.dataset.shellScanned = "true";
            });
        }
    });
}
setInterval(autoHighlightShells, 3000);

// Visibility Watchdog: Check every 100ms if currentImg is still valid
setInterval(() => {
    if (hoverIcon && hoverIcon.style.display === 'block') {
        if (!currentImg || !currentImg.isConnected || currentImg.getBoundingClientRect().width === 0) {
            hoverIcon.style.display = 'none';
            currentImg = null;
        }
    }
}, 100);

// Context Menu Message Listener
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "contextMenuDecode" && request.srcUrl) {
        const img = Array.from(document.querySelectorAll('img')).find(i => i.src === request.srcUrl);
        if (img) decodeImage(img);
    }
});

function createHoverIcon() {
    const icon = document.createElement('div');
    icon.id = 'flip-the-shell-icon';
    icon.style.cssText = `
        position: absolute; width: 42px; height: 42px; background-color: white;
        background-image: url(${chrome.runtime.getURL('icons/view_icon.png')});
        background-size: 75%; background-position: center; background-repeat: no-repeat;
        border-radius: 50%; cursor: pointer; z-index: 2147483647; display: none;
        box-shadow: 0 6px 16px rgba(0,0,0,0.5); border: 3px solid #5d4037;
        transition: transform 0.1s ease-out; pointer-events: auto;
    `;
    icon.onmouseover = () => { icon.style.transform = 'scale(1.15)'; };
    icon.onmouseout = () => { icon.style.transform = 'scale(1)'; };
    icon.onclick = (e) => { e.stopPropagation(); if (currentImg) decodeImage(currentImg); };
    document.body.appendChild(icon);
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

document.addEventListener('mousemove', (e) => {
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const img = elements.find(el => el.tagName === 'IMG' && el.id !== 'flip-the-shell-icon');
    
    if (img) {
        if (img.naturalWidth > 30) {
            checkShellSignature(img).then(data => {
                if (data && data.isShell) {
                    if (!hoverIcon) hoverIcon = createHoverIcon();
                    currentImg = img;
                    const rect = img.getBoundingClientRect();
                    const iconSize = 42; let left, top; const margin = 8;
                    switch(iconPosition) {
                        case 'top-left': left = rect.left + margin; top = rect.top + margin; break;
                        case 'top-right': left = rect.right - iconSize - margin; top = rect.top + margin; break;
                        case 'bottom-left': left = rect.left + margin; top = rect.bottom - iconSize - margin; break;
                        case 'bottom-right': left = rect.right - iconSize - margin; top = rect.bottom - iconSize - margin; break;
                        default: left = rect.left + rect.width/2 - iconSize/2; top = rect.top + rect.height/2 - iconSize/2;
                    }
                    hoverIcon.style.left = (window.scrollX + left) + 'px';
                    hoverIcon.style.top = (window.scrollY + top) + 'px';
                    hoverIcon.style.display = 'block';
                } else if (hoverIcon && !elements.includes(hoverIcon)) {
                    hoverIcon.style.display = 'none';
                }
            });
        } else if (hoverIcon && !elements.includes(hoverIcon)) {
            hoverIcon.style.display = 'none';
        }
    } else if (hoverIcon && !elements.includes(hoverIcon)) {
        hoverIcon.style.display = 'none';
    }
}, true);

// Fast hide on any potential trigger
const fastHide = () => { if (hoverIcon) hoverIcon.style.display = 'none'; };
window.addEventListener('scroll', fastHide, true);
window.addEventListener('resize', fastHide, true);
document.addEventListener('click', (e) => { if (hoverIcon && e.target !== hoverIcon) fastHide(); }, true);

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
        const fullPayload = packedAll.slice(4, 4 + headerLen);
        
        let idx = 5; // Skip SNAIL signature
        const hasPwd = fullPayload[idx++] === 1;
        
        if (hasPwd) {
            alert("This shell is encrypted. Password support has been removed in this version.");
            return;
        }
        
        proceedDecode(fullPayload.slice(idx));
    } catch (e) { alert("Failed to decode snail."); }
}

function proceedDecode(decryptedBuffer) {
    try {
        let idx = 0;
        const extLen = decryptedBuffer[idx++];
        const ext = new TextDecoder().decode(decryptedBuffer.slice(idx, idx + extLen));
        idx += extLen;
        const dataLen = new DataView(decryptedBuffer.buffer, decryptedBuffer.byteOffset, decryptedBuffer.byteLength).getUint32(idx);
        idx += 4;
        
        const rawData = decryptedBuffer.slice(idx, idx + dataLen);
        showSnailOverlay(rawData, ext);
    } catch (e) {
        alert("Failed to parse snail data.");
    }
}

function showSnailOverlay(data, ext) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.95);z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:zoom-out;backdrop-filter:blur(10px);`;
    
    const container = document.createElement('div');
    container.style.cssText = "max-width: 90%; max-height: 80%; display: flex; flex-direction: column; align-items: center; cursor: default; position: relative;";
    
    let blobType = `image/${ext.toLowerCase()}`;
    if (ext.toLowerCase() === 'mp4') blobType = 'video/mp4';
    
    const blob = new Blob([data], { type: blobType });
    const url = URL.createObjectURL(blob);
    
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext.toLowerCase())) {
        const img = document.createElement('img');
        img.src = url; img.style.cssText = `max-width: 100%; max-height: 100%; border: 5px solid white; border-radius: 8px; box-shadow: 0 0 30px rgba(255,255,255,0.2);`;
        container.appendChild(img);
    } else if (ext.toLowerCase() === 'mp4') {
        const video = document.createElement('video');
        video.src = url; video.controls = true; video.autoplay = true; video.loop = true;
        video.style.cssText = `max-width: 100%; max-height: 100%; border: 5px solid white; border-radius: 8px; box-shadow: 0 0 30px rgba(255,255,255,0.2);`;
        video.onloadedmetadata = () => { video.playbackRate = playbackSpeed; };
        container.appendChild(video);
    } else {
        const textBox = document.createElement('div');
        textBox.innerText = new TextDecoder().decode(data);
        textBox.style.cssText = `padding: 30px; background: white; border-radius: 12px; color: #333; font-family: monospace; font-size: 16px; white-space: pre-wrap; max-width: 600px; overflow-y: auto;`;
        container.appendChild(textBox);
    }
    
    const dlBtn = document.createElement('div');
    dlBtn.className = 'shell-icon-dl-btn';
    dlBtn.innerHTML = `<img src="${DL_ICON_SVG}" style="width:24px;height:24px;filter:invert(1);">`;
    dlBtn.title = `Download Original ${ext.toUpperCase()}`;
    dlBtn.onclick = (e) => {
        e.stopPropagation();
        const a = document.createElement('a');
        a.href = url;
        a.download = `revealed_shell_${Date.now()}.${ext.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    
    const label = document.createElement('div');
    label.innerText = `SNAIL REVEALED (${ext.toUpperCase()})`;
    label.style.cssText = `color: #87d530; font-family: sans-serif; font-weight: bold; font-size: 24px; margin-bottom: 20px; text-shadow: 0 0 10px rgba(135,213,48,0.5);`;
    
    overlay.appendChild(label);
    overlay.appendChild(container);
    overlay.appendChild(dlBtn);
    document.body.appendChild(overlay);
    
    overlay.onclick = (e) => { 
        if (e.target === overlay) {
            document.body.removeChild(overlay); 
            URL.revokeObjectURL(url); 
        }
    };
}
