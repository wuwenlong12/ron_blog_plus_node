import crypto from 'crypto';

export const generateEncryptedString = (input: string): string => {
    // 获取当前日期
    const currentDate = new Date().toISOString();

    // 拼接输入字符串和当前日期
    const dataToEncrypt = `${input}-${currentDate}`;

    // 创建加密哈希算法（SHA-256）
    const hash = crypto.createHash('sha256');

    // 更新要加密的数据并生成最终哈希值
    hash.update(dataToEncrypt);

    // 返回加密后的字符串，使用hex编码
    return `ROMIM${hash.digest('hex').slice(-8)}`;
};