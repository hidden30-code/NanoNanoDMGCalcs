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
    const charKey = document.getElementById('characterSelect').value;
    const char = charactersData[charKey];
    const lightConeKey = document.getElementById('lightConeSelect').value;
    const lightCone = lightConesData[lightConeKey];
    const relicKey = document.getElementById('relicSetSelect').value;
    const relic = relicSetsData[relicKey];

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
    const brokenState = document.getElementById('brokenState').checked;
    const spd = parseFloat(document.getElementById('spd').value);
    const teamDmgMulti = parseFloat(document.getElementById('teamDmgMulti').value);

    // Validasi
    if (isNaN(totalHp) || totalHp <= 0) {
        document.getElementById('result').innerText = "Total HP harus diisi dengan angka positif.";
        return;
    }
    if (targetPos < 1 || targetPos > enemyCount) {
        document.getElementById('result').innerText = "Posisi target harus antara 1 dan jumlah musuh.";
        return;
    }

    // Trace dan bonus dari karakter
    const traceElemental = char.traces.elemental || 0;
    const traceCR = char.traces.cr || 0;
    const traceCD = char.traces.cd || 0;

    // Gabungkan dengan input crit (input sudah termasuk trace?)
    // Asumsi input crit sudah termasuk trace, jadi kita gunakan langsung
    // Tapi jika ingin memisahkan, bisa ditambahkan.

    // Efek light cone (contoh sederhana: tambahkan crit rate)
    let lightConeBonus = { cr: 0, cd: 0, atk: 0, hp: 0, def: 0 };
    if (lightConeKey === 'cruising') {
        lightConeBonus.cr = 0.08; // contoh
    }

    // Efek relic (contoh)
    let relicBonus = { quantumDmg: 0, defIgnore: 0 };
    if (relicKey === 'genius') {
        relicBonus.quantumDmg = 0.1; // 2-piece
        relicBonus.defIgnore = 0.1;   // 4-piece (asumsi terhadap musuh)
    }

    // Total DMG% multiplier
    let dmgMultiplier = 1 + traceElemental + dmgBonus + relicBonus.quantumDmg;
    if (talentActive) dmgMultiplier += char.talent.dmgBoost || 0;

    // DEF multiplier dengan mempertimbangkan def ignore dari relic
    const defIgnore = relicBonus.defIgnore || 0;
    // Rumus DEF multiplier dengan DEF ignore:
    // DEF Multi = (charLevel + 20) / ((enemyLevel + 20) * (1 - defIgnore) + (charLevel + 20))
    const defMulti = (charLevel + 20) / ((enemyLevel + 20) * (1 - defIgnore) + (charLevel + 20));

    // RES multiplier
    const resMulti = 1 - enemyRes;

    // CRIT multiplier (rata-rata), tambahkan bonus crit dari light cone
    const finalCritRate = Math.min(critRate + lightConeBonus.cr, 1.0);
    const critMulti = 1 + finalCritRate * critDmg;

    // Universal DMG Reduction
    const universalMulti = brokenState ? 1.0 : 0.9;

    // Team Damage Multiplier
    const teamMulti = teamDmgMulti;

    // Tentukan multiplier skill berdasarkan tipe serangan
    let primaryMulti = 0, adjacentMulti = 0, aoeMulti = 0;
    const skill = char.multipliers[attackType];
    if (skill.type === 'single') {
        primaryMulti = skill.atk || skill.hp || 0;
    } else if (skill.type === 'blast') {
        primaryMulti = skill.primary;
        adjacentMulti = skill.adjacent;
    } else if (skill.type === 'aoe') {
        aoeMulti = skill.hp || skill.atk || 0;
    }

    // Hitung damage per musuh
    let damages = [];
    let totalDamage = 0;

    if (attackType === 'basic' || attackType === 'skill' || attackType === 'ult' || attackType === 'enhanced') {
        // Penyesuaian: untuk skill dengan tipe single, kita gunakan primaryMulti
        if (skill.type === 'single') {
            let base = totalHp * primaryMulti; // asumsi scaling HP, bisa juga ATK
            let dmg = base * dmgMultiplier * defMulti * resMulti * critMulti * universalMulti * teamMulti;
            damages = [dmg];
            totalDamage = dmg;
        } else if (skill.type === 'blast') {
            damages = new Array(enemyCount).fill(0);
            let primaryIndex = targetPos - 1;
            let basePrimary = totalHp * primaryMulti;
            damages[primaryIndex] = basePrimary * dmgMultiplier * defMulti * resMulti * critMulti * universalMulti * teamMulti;

            if (primaryIndex > 0) {
                let baseAdj = totalHp * adjacentMulti;
                damages[primaryIndex - 1] = baseAdj * dmgMultiplier * defMulti * resMulti * critMulti * universalMulti * teamMulti;
            }
            if (primaryIndex < enemyCount - 1) {
                let baseAdj = totalHp * adjacentMulti;
                damages[primaryIndex + 1] = baseAdj * dmgMultiplier * defMulti * resMulti * critMulti * universalMulti * teamMulti;
            }
            totalDamage = damages.reduce((a, b) => a + b, 0);
        } else if (skill.type === 'aoe') {
            let base = totalHp * aoeMulti;
            let dmg = base * dmgMultiplier * defMulti * resMulti * critMulti * universalMulti * teamMulti;
            damages = new Array(enemyCount).fill(dmg);
            totalDamage = dmg * enemyCount;
        }
    }

    // Hitung DMG/AV
    const actionValue = 10000 / spd;
    const dmgPerAV = totalDamage / actionValue;

    // Format hasil
    let resultText = `Total Damage: ${Math.round(totalDamage)}\n`;
    resultText += `DMG/AV: ${Math.round(dmgPerAV * 100) / 100} (per AV)\n`;
    resultText += `Action Value: ${Math.round(actionValue * 100) / 100} AV\n`;
    resultText += `Status Musuh: ${brokenState ? 'Broken' : 'Tidak Broken'}\n`;
    resultText += `Team Multiplier: ${teamMulti}\n\n`;
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
