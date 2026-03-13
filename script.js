// ================== DATA GAME ==================
const charactersData = {
    castorice: {
        name: "Castorice",
        element: "quantum",
        baseStats: { hp: 1630, atk: 524, def: 485, spd: 95 },
        traces: { cr: 0.187, cd: 0.133, elemental: 0.144 },
        multipliers: {
            basic: { type: "single", hp: 0.5 },
            skill: { type: "blast", primary: 0.5, adjacent: 0.3 },
            enhanced: { type: "aoe", hp: 0.8 }
        },
        talent: { dmgBoost: 0.6 }
    },
    seele: {
        name: "Seele",
        element: "quantum",
        baseStats: { hp: 1048, atk: 640, def: 485, spd: 115 },
        traces: { cr: 0.12, cd: 0, elemental: 0.144 },
        multipliers: {
            basic: { type: "single", atk: 1.0 },
            skill: { type: "single", atk: 2.2 },
            ult: { type: "single", atk: 4.25 }
        },
        talent: { spdBoost: 0.25 } // hanya contoh, tidak dipakai di sini
    }
    // Tambahkan karakter lain sesuai kebutuhan
};

const lightConesData = {
    none: { name: "None", baseStats: { hp: 0, atk: 0, def: 0 }, effects: [] },
    cruising: { name: "Cruising in the Stellar Sea", baseStats: { hp: 1058, atk: 529, def: 330 }, effects: ["critRate"] } // contoh, perlu detail
    // Tambahkan light cone lain
};

const relicSetsData = {
    none: { name: "None", effects: [] },
    genius: { name: "Genius of Brilliant Stars", twoPiece: { quantumDmg: 0.1 }, fourPiece: { defIgnore: 0.1 } }
    // Tambahkan relic set lain
};

// ================== FUNGSI PERHITUNGAN ==================
function calculate() {
    // Ambil nilai input
    const totalHp = parseFloat(document.getElementById('totalHp').value);
    const charLevel = parseInt(document.getElementById('charLevel').value);
    const enemyLevel = parseInt(document.getElementById('enemyLevel').value);
    const enemyRes = parseFloat(document.getElementById('enemyRes').value) / 100;
    const enemyCount = parseInt(document.getElementById('enemyCount').value);
    const attackType = document.getElementById('attackType').value;
    const targetPos = parseInt(document.getElementById('targetPos').value);
    const dmgBonus = parseFloat(document.getElementById('dmgBonus').value) / 100;
    const talentActive = document.getElementById('talentActive').checked;
    const critRate = parseFloat(document.getElementById('critRate').value) / 100;
    const critDmg = parseFloat(document.getElementById('critDmg').value) / 100;

    // Validasi
    if (isNaN(totalHp) || totalHp <= 0) {
        document.getElementById('result').innerText = "Total HP harus diisi dengan angka positif.";
        return;
    }
    if (targetPos < 1 || targetPos > enemyCount) {
        document.getElementById('result').innerText = "Posisi target harus antara 1 dan jumlah musuh.";
        return;
    }

    // Trace Quantum DMG tetap
    const quantumTrace = 0.144; // 14.4%

    // Total DMG% multiplier
    let dmgMultiplier = 1 + quantumTrace + dmgBonus;
    if (talentActive) dmgMultiplier += 0.6; // talent 60%

    // DEF multiplier
    const defMulti = (charLevel + 20) / ((enemyLevel + 20) + (charLevel + 20));

    // RES multiplier
    const resMulti = 1 - enemyRes;

    // CRIT multiplier (rata-rata)
    const critMulti = 1 + critRate * critDmg;

    // Tentukan multiplier skill berdasarkan tipe serangan
    let primaryMulti = 0, adjacentMulti = 0, aoeMulti = 0;
    switch (attackType) {
        case 'basic':
            primaryMulti = 0.5; // 50% HP
            break;
        case 'skill':
            primaryMulti = 0.5;
            adjacentMulti = 0.3;
            break;
        case 'enhanced':
            aoeMulti = 0.8; // 50% + 30% = 80% HP ke semua
            break;
        default:
            break;
    }

    // Hitung damage per musuh
    let damages = []; // array of damage per enemy index (0-based)
    let totalDamage = 0;

    if (attackType === 'basic') {
        // Hanya satu musuh terkena (anggap posisi 1)
        let base = totalHp * primaryMulti;
        let dmg = base * dmgMultiplier * defMulti * resMulti * critMulti;
        damages = [dmg];
        totalDamage = dmg;
    } 
    else if (attackType === 'skill') {
        // Buat array damage untuk semua musuh, default 0
        damages = new Array(enemyCount).fill(0);
        // Primary target
        let primaryIndex = targetPos - 1;
        let basePrimary = totalHp * primaryMulti;
        damages[primaryIndex] = basePrimary * dmgMultiplier * defMulti * resMulti * critMulti;

        // Adjacent (kiri dan kanan)
        if (primaryIndex > 0) { // ada musuh di kiri
            let baseAdj = totalHp * adjacentMulti;
            damages[primaryIndex - 1] = baseAdj * dmgMultiplier * defMulti * resMulti * critMulti;
        }
        if (primaryIndex < enemyCount - 1) { // ada musuh di kanan
            let baseAdj = totalHp * adjacentMulti;
            damages[primaryIndex + 1] = baseAdj * dmgMultiplier * defMulti * resMulti * critMulti;
        }
        totalDamage = damages.reduce((a, b) => a + b, 0);
    } 
    else if (attackType === 'enhanced') {
        // Semua musuh kena damage sama
        let base = totalHp * aoeMulti;
        let dmg = base * dmgMultiplier * defMulti * resMulti * critMulti;
        damages = new Array(enemyCount).fill(dmg);
        totalDamage = dmg * enemyCount;
    }

    // Format hasil
    let resultText = `Total Damage: ${Math.round(totalDamage)}\n\n`;
    resultText += `Rincian per musuh (posisi 1 = paling kiri):\n`;
    for (let i = 0; i < damages.length; i++) {
        resultText += `Musuh ${i+1}: ${Math.round(damages[i])}\n`;
    }

    document.getElementById('result').innerText = resultText;
}

// ================== SETUP TAMPILAN ==================
// Sembunyikan/tampilkan input posisi target berdasarkan jenis serangan
function toggleTargetPosition() {
    const attackType = document.getElementById('attackType').value;
    const group = document.getElementById('targetPositionGroup');
    if (attackType === 'skill') {
        group.style.display = 'block';
    } else {
        group.style.display = 'none';
    }
}

// Batasi maks posisi target sesuai jumlah musuh
function updateTargetPosMax() {
    const enemyCount = parseInt(document.getElementById('enemyCount').value);
    const targetPos = document.getElementById('targetPos');
    targetPos.max = enemyCount;
    if (parseInt(targetPos.value) > enemyCount) {
        targetPos.value = enemyCount;
    }
}

// Event listeners
document.getElementById('attackType').addEventListener('change', toggleTargetPosition);
document.getElementById('enemyCount').addEventListener('input', updateTargetPosMax);

// Jalankan sekali saat halaman dimuat
window.onload = function() {
    toggleTargetPosition();
    updateTargetPosMax();
    calculate();
};
