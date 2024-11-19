import bcrypt from 'bcryptjs';

// 生成hash密码
export const encryptin = (password: string): string => {
    // 生成随机的salt
    const salt = bcrypt.genSaltSync(10);

    // 生成的hash密码
    const hash = bcrypt.hashSync(password, salt);

    return hash;
};

// 验证密码
export const verification = (password: string, hash: string): boolean => {
    const verif = bcrypt.compareSync(password, hash);
    return verif;
};