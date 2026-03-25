// Flip the Shell Extension v3.6 - Encryption Support
let hoverIcon = null;
let currentImg = null;
let iconPosition = 'center';
let playbackSpeed = 1.0;
const shellCache = new WeakMap();

const SKIP_W_RATIO = 0.40;
const SKIP_H_RATIO = 0.08;

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

window.addEventListener('scroll', () => { if (hoverIcon) hoverIcon.style.display = 'none'; }, true);
window.addEventListener('resize', () => { if (hoverIcon) hoverIcon.style.display = 'none'; }, true);

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
        
        if (hasPwd) {
            askForPassword(img, async (pwd) => {
                await proceedDecode(header, packedAll, idx, pwd);
            });
            return;
        }
        
        await proceedDecode(header, packedAll, idx, null);
    } catch (e) { alert("Failed to decode snail."); }
}

async function proceedDecode(header, packedAll, idx, password) {
    const extLen = header[idx++];
    const ext = new TextDecoder().decode(header.slice(idx, idx + extLen));
    idx += extLen;
    const dataLen = new DataView(header.buffer, header.byteOffset, header.byteLength).getUint32(idx);
    idx += 4;
    
    let rawData = header.slice(idx, idx + dataLen);
    
    if (password) {
        // SHA-256 XOR Decryption
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const key = new Uint8Array(hashBuffer);
        
        const decrypted = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; i++) {
            decrypted[i] = rawData[i] ^ key[i % key.length];
        }
        rawData = decrypted;
    }
    
    showSnailOverlay(rawData, ext);
}

function askForPassword(img, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:2147483647;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);`;
    
    const box = document.createElement('div');
    box.className = 'shell-pwd-box';
    box.innerHTML = `
        <h3 style="margin:0 0 10px 0;color:#111;font-family:sans-serif;">🔒 Protected Shell</h3>
        <p style="font-size:13px;color:#555;margin-bottom:20px;font-family:sans-serif;">This content is encrypted with a password.</p>
        <input type="password" class="shell-pwd-input" placeholder="Enter Password" id="shell-pwd-field">
        <div style="display:flex;gap:10px;">
            <button id="shell-pwd-cancel" class="shell-dl-btn" style="background:#eee;color:#333;flex:1;">Cancel</button>
            <button id="shell-pwd-btn" class="shell-dl-btn" style="flex:2;">Unlock & Reveal</button>
        </div>
    `;
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    const input = document.getElementById('shell-pwd-field');
    input.focus();
    
    const submit = () => {
        if (input.value) {
            const pwd = input.value;
            document.body.removeChild(overlay);
            callback(pwd);
        } else {
            input.style.borderColor = 'red';
        }
    };
    
    document.getElementById('shell-pwd-btn').onclick = submit;
    document.getElementById('shell-pwd-cancel').onclick = () => document.body.removeChild(overlay);
    input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
    overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
}

function showSnailOverlay(data, ext) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.95);z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:zoom-out;backdrop-filter:blur(10px);`;
    
    const container = document.createElement('div');
    container.style.cssText = "max-width: 90%; max-height: 80%; display: flex; flex-direction: column; align-items: center; cursor: default;";
    
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
        try {
            const decodedText = new TextDecoder().decode(data);
            textBox.innerText = decodedText;
        } catch (e) {
            textBox.innerText = "Error: Could not decode data. Wrong password?";
        }
        textBox.style.cssText = `padding: 30px; background: white; border-radius: 12px; color: #333; font-family: monospace; font-size: 16px; white-space: pre-wrap; max-width: 600px; overflow-y: auto;`;
        container.appendChild(textBox);
    }
    
    // Download Button
    const dlBtn = document.createElement('button');
    dlBtn.className = 'shell-dl-btn';
    dlBtn.innerText = `💾 Download 원본 ${ext.toUpperCase()}`;
    dlBtn.onclick = () => {
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
