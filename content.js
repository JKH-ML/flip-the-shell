// Flip the Shell Extension v2.9 - Ultimate Detection Fix
let hoverIcon = null;
let currentImg = null;
let iconPosition = 'center';
const shellCache = new WeakMap();

const SKIP_W_RATIO = 0.40;
const SKIP_H_RATIO = 0.08;

chrome.storage.local.get(['iconPosition'], (result) => { if (result.iconPosition) iconPosition = result.iconPosition; });
chrome.storage.onChanged.addListener((changes) => { if (changes.iconPosition) iconPosition = changes.iconPosition.newValue; });

function createHoverIcon() {
    const icon = document.createElement('div');
    icon.id = 'flip-the-shell-icon';
    icon.style.cssText = `
        position: absolute; width: 32px; height: 32px; background-color: white;
        background-image: url(${chrome.runtime.getURL('icons/view_icon.png')});
        background-size: 70%; background-position: center; background-repeat: no-repeat;
        border-radius: 50%; cursor: pointer; z-index: 2147483647; display: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 2px solid #5d4037;
        transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
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
        // High-privilege fetch for extension bypassing CORS
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
    if (img.naturalWidth < 50) return null;
    if (shellCache.has(img)) return shellCache.get(img);

    try {
        const pixels = await fetchPixels(img);
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const skipW = Math.floor(width * SKIP_W_RATIO);
        const skipH = Math.floor(height * SKIP_H_RATIO);

        // Try all possible bit-depths (k=2, 4, 8) to find SNAIL signature
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
                if (y > 200 && bits.length === 0) break; // Efficiency
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
    if (window.shellHoverTimer) return;
    window.shellHoverTimer = setTimeout(() => {
        window.shellHoverTimer = null;
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const img = elements.find(el => el.tagName === 'IMG');
        
        if (img && img.naturalWidth > 100) {
            checkShellSignature(img).then(data => {
                if (data && data.isShell) {
                    if (!hoverIcon) hoverIcon = createHoverIcon();
                    currentImg = img;
                    const rect = img.getBoundingClientRect();
                    const iconSize = 32; let left, top; const margin = 10;
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
                } else if (hoverIcon && !elements.includes(hoverIcon)) hoverIcon.style.display = 'none';
            });
        } else if (hoverIcon && !elements.includes(hoverIcon)) hoverIcon.style.display = 'none';
    }, 100);
}, true);

async function decodeImage(img) {
    const cached = shellCache.get(img);
    if (!cached || !cached.isShell) return;
    const { k, pixels } = cached;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const skipW = Math.floor(width * SKIP_W_RATIO);
    const skipH = Math.floor(height * SKIP_H_RATIO);
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
