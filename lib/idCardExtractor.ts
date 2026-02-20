import { ocrEngine } from '@/lib/ocr/TesseractOCR';
import { ScannedPage } from '@/hooks/useDocumentStore';

export interface IDCardData {
    nik?: string;
    nama?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    golDarah?: string;
    alamat?: string;
    rtrw?: string;
    kelDesa?: string;
    kecamatan?: string;
    agama?: string;
    statusPerkawinan?: string;
    pekerjaan?: string;
    kewarganegaraan?: string;
    berlakuHingga?: string;
    rawText: string;
}

export async function extractIDCard(imageUri: string): Promise<IDCardData> {
    const ocrResult = await ocrEngine.recognizeText(imageUri, 'ind');
    return parseKTP(ocrResult.text);
}

function parseKTP(text: string): IDCardData {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const data: IDCardData = { rawText: text };

    // Regex constants
    const NIK_REGEX = /\b\d{16}\b/;

    // Simple line-by-line parsing heuristics
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toUpperCase();

        if (line.includes('NIK')) {
            const match = line.match(NIK_REGEX) || lines[i + 1]?.match(NIK_REGEX);
            if (match) data.nik = match[0];
        }
        else if (line.includes('NAMA')) {
            data.nama = cleanField(line, 'NAMA');
        }
        else if (line.includes('TEMPAT') || line.includes('TGL')) {
            const val = cleanField(line, 'TEMPAT/TGL LAHIR').replace('TEMPAT', '').replace('TGL', '').replace('LAHIR', '');
            const parts = val.split(',');
            if (parts.length > 0) data.tempatLahir = parts[0].trim();
            if (parts.length > 1) data.tanggalLahir = parts[1].trim();
        }
        else if (line.includes('ALAMAT')) {
            data.alamat = cleanField(line, 'ALAMAT');
        }
        else if (line.includes('RT/RW')) {
            data.rtrw = cleanField(line, 'RT/RW');
        }
        else if (line.includes('KEL') || line.includes('DESA')) {
            data.kelDesa = cleanField(line, 'KEL/DESA');
        }
        else if (line.includes('KECAMATAN')) {
            data.kecamatan = cleanField(line, 'KECAMATAN');
        }
        else if (line.includes('AGAMA')) {
            data.agama = cleanField(line, 'AGAMA');
        }
        else if (line.includes('STATUS')) {
            data.statusPerkawinan = cleanField(line, 'STATUS PERKAWINAN');
        }
        else if (line.includes('PEKERJAAN')) {
            data.pekerjaan = cleanField(line, 'PEKERJAAN');
        }
        else if (line.includes('KEWARGANEGARAAN')) {
            data.kewarganegaraan = cleanField(line, 'KEWARGANEGARAAN');
        }
        else if (line.includes('BERLAKU')) {
            data.berlakuHingga = cleanField(line, 'BERLAKU HINGGA');
        }
    }

    // Heuristic: If NAMA is empty but NIK found, assume next line is name
    if (!data.nama && data.nik) {
        // Find index of NIK line
        const nikIndex = lines.findIndex(l => l.includes(data.nik!));
        if (nikIndex !== -1 && lines[nikIndex + 1]) {
            // Basic check to exclude common labels
            if (!lines[nikIndex + 1].includes('TEMPAT')) {
                data.nama = lines[nikIndex + 1];
            }
        }
    }

    return data;
}

function cleanField(line: string, label: string): string {
    // Remove label and colon
    return line.replace(label, '').replace(':', '').trim();
}
