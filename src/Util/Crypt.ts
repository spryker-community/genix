import * as crypto from 'crypto';

export class Crypt {
    private readonly encryptionKey: Buffer;
    private readonly iv_length: number;
    private readonly algorithm: string;

    constructor(password: string) {
        this.encryptionKey = crypto.createHash('sha256').update(password).digest().slice(0, 32);
        this.iv_length = 16;
        this.algorithm = 'aes-256-ctr';
    }

    encode(data: string): string {
        const iv = crypto.randomBytes(this.iv_length);
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
        const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
        return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    }

    decode(data: string): string | never {
        try {
            const [ivHex, encryptedHex] = data.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const encryptedText = Buffer.from(encryptedHex, 'hex');
            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
            const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
            return decrypted.toString('utf8');
        } catch (exception) {
            console.error("Given password does not allow to decrypt the data. Please try again.");
            process.exit(1);
        }
    }
}